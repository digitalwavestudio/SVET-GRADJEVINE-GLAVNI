import { Logger } from "../utils/logger.ts";
import { Worker, Job as BullJob } from "bullmq";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { db, admin } from "../config/firebase.ts";
import {
  syncJobToIndex,
  syncAdToIndex,
  deleteAdFromIndex,
  syncAdsToIndex,
} from "./algolia.service.ts";
import { MonitoringService } from "./monitoring.service.ts";
import { TraceContext } from "../utils/trace.ts";
import { QueueService, JobType, JobPriority } from "./queue.service.ts";
import { Job } from "@svet-gradjevine/shared";

export enum SyncTaskType {
  ALGOLIA_JOB_SYNC = "algolia_job_sync",
  ALGOLIA_JOB_DELETE = "algolia_job_delete",
  ALGOLIA_AD_SYNC = "algolia_ad_sync",
  ALGOLIA_AD_DELETE = "algolia_ad_delete",
  ALGOLIA_PROFILE_SYNC = "algolia_profile_sync",
  ALGOLIA_PROFILE_DELETE = "algolia_profile_delete",
  USER_RELATIONAL_SYNC = "user_relational_sync",
  JOB_APPLICATION_SYNC = "job_application_sync"
}

export interface SyncTask {
  id?: string;
  type: SyncTaskType;
  payload: Record<string, unknown>;
  priority?: number;
}

export class AlgoliaSync {
  private static worker: Worker;

  static async init() {
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      Logger.withContext().warn("Redis missing. Sync BullMQ Worker skipped.");
      return;
    }

    Logger.withContext().info("Sync BullMQ Worker Starting...");

    this.worker = new Worker(
      "sync",
      async (job: BullJob) => {
        await this.processJob(job);
      },
      { connection: defaultConnection!, concurrency: 3, lockDuration: 300000, lockRenewTime: 30000 },
    );
  }

  static async gracefulShutdown() {
    if (this.worker) await this.worker.close();
    Logger.withContext().info("Sync Worker shut down.");
  }

  static async syncJob(
    jobId: string,
    jobData: Job | Partial<Job>,
    oldData?: Job | Partial<Job>,
    correlationId?: string,
  ) {
    if (oldData) {
      const { shouldSync } = this.shouldSyncToAlgolia(oldData, jobData);
      if (!shouldSync) return;
    }
    await this.syncAd("jobs", jobId, jobData as Record<string, unknown>, undefined, correlationId);
  }

  static async syncAd(
    category: string,
    id: string,
    data: Record<string, unknown>,
    oldData?: Record<string, unknown>,
    correlationId?: string,
  ) {
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    if (oldData) {
      const { shouldSync, isPartial } = this.shouldSyncToAlgolia(oldData, data);
      if (!shouldSync) {
        iLogger.info(`Skipping Algolia sync for ${category} ${id} - no vital fields changed`);
        return;
      }
      if (isPartial) data._isPartialUpdate = true;
    }

    await syncAdsToIndex(category, [{ id, data }]);
  }

  static async syncBatch(items: { category: string; id: string; data: Record<string, unknown> }[]) {
    const byCategory: Record<string, { id: string; data: Record<string, unknown> }[]> = {};
    for (const item of items) {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push({ id: item.id, data: item.data });
    }
    await Promise.all(
      Object.entries(byCategory).map(([category, objs]) => syncAdsToIndex(category, objs)),
    );
  }

  static async deleteAd(category: string, id: string, correlationId?: string) {
    const cid = correlationId || TraceContext.generateId();
    try {
      await deleteAdFromIndex(category, id);
    } catch (error) {
      await QueueService.addJob(
        JobType.SYNC_COLLECTION,
        { type: SyncTaskType.ALGOLIA_AD_DELETE, targetId: id, data: { category }, correlationId: cid },
        { priority: JobPriority.LOW },
      );
    }
  }

  static async syncProfile(userId: string, userData: Record<string, unknown>, correlationId?: string) {
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    let category = "";
    if (userData.role === "master" || userData.role === "professional" || userData.role === "majstor")
      category = "masters";
    else if (userData.role === "company" || userData.role === "business")
      category = "companies";

    if (!category) return;

    try {
      const bp = userData.businessProfile as Record<string, unknown> | undefined;
      const algoliaData = {
        name: userData.displayName || (bp?.name as string) || (userData.company as string) || "N/A",
        description: (bp?.description as string) || (userData.bio as string) || "",
        category: (bp?.category as string) || (userData.categoryRank as string) || "Pomoćni radovi",
        skills: (bp?.skills as string[]) || (userData.skills as string[]) || [],
        city: (bp?.city as string) || (userData.city as string) || "Srbija",
        address: (bp?.address as string) || "",
        logo: (bp?.logo as string) || (userData.photoURL as string) || "",
        rating: (userData.rating as number) || 0,
        reviewCount: (userData.reviewCount as number) || 0,
        isVerified: !!userData.isVerified,
        status: (userData.status as string) || "active",
        updatedAt: userData.updatedAt instanceof Date ? userData.updatedAt.getTime() : Date.now(),
      };

      await syncAdToIndex(category, userId, algoliaData);
      MonitoringService.recordSyncSuccess();
    } catch (error: unknown) {
      iLogger.warn(`Profile sync failed for ${userId}, queuing`, {
        error: error instanceof Error ? error.message : String(error),
      });
      await QueueService.addJob(
        JobType.SYNC_COLLECTION,
        { type: SyncTaskType.ALGOLIA_PROFILE_SYNC, targetId: userId, data: { userData }, correlationId: cid },
        { priority: JobPriority.MEDIUM },
      );
    }
  }

  static async queueSync(uid: string) {
    await QueueService.addJob(
      JobType.SYNC_COLLECTION,
      { type: SyncTaskType.USER_RELATIONAL_SYNC, targetId: uid },
      { priority: JobPriority.LOW, jobId: `sync_user_${uid}` },
    );
  }

  // ── Job Processing ──────────────────────────────────────────────

  private static async processJob(job: BullJob) {
    const { type, targetId, data, correlationId } = job.data;
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    await TraceContext.run(cid, async () => {
      try {
        iLogger.info(`Processing sync task`, { type, targetId });

        if (type === SyncTaskType.ALGOLIA_JOB_SYNC) {
          await syncJobToIndex(targetId, data as Record<string, unknown>);
          await this.enqueueGooglePing(this.getAdUrl("jobs", targetId), "URL_UPDATED");
        } else if (type === SyncTaskType.ALGOLIA_JOB_DELETE) {
          await deleteAdFromIndex("jobs", targetId);
          await this.enqueueGooglePing(this.getAdUrl("jobs", targetId), "URL_DELETED");
        } else if (type === SyncTaskType.ALGOLIA_AD_SYNC) {
          const { category, ...adData } = data as Record<string, unknown>;
          await syncAdToIndex(category as string, targetId, adData);
          await this.enqueueGooglePing(this.getAdUrl(category as string, targetId), "URL_UPDATED");
        } else if (type === SyncTaskType.ALGOLIA_AD_DELETE) {
          const { category } = data as Record<string, unknown>;
          await deleteAdFromIndex(category as string, targetId);
          await this.enqueueGooglePing(this.getAdUrl(category as string, targetId), "URL_DELETED");
        } else if (type === SyncTaskType.ALGOLIA_PROFILE_SYNC) {
          const { userData } = data as Record<string, unknown>;
          await this.syncProfile(targetId as string, userData as Record<string, any>, cid);
        } else if (type === SyncTaskType.ALGOLIA_PROFILE_DELETE) {
          const { category } = data as Record<string, unknown>;
          await deleteAdFromIndex(category as string, targetId as string);
          await this.enqueueGooglePing(this.getAdUrl(category as string, targetId as string), "URL_DELETED");
        } else if (type === SyncTaskType.USER_RELATIONAL_SYNC) {
          await this.processUserRelationalSync(targetId as string);
        } else if (type === SyncTaskType.JOB_APPLICATION_SYNC) {
          await this.processJobApplicationSync(targetId as string, data);
        } else if (type === "FULL_REINDEX") {
          await this.processFullReindex(data as Record<string, unknown>);
        }

        MonitoringService.recordSyncSuccess();
        iLogger.info(`Completed sync task ${targetId}`);
      } catch (err: unknown) {
        iLogger.error(`Sync task failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
        MonitoringService.recordSyncFail();
        throw err;
      }
    });
  }

  // ── Utilities ───────────────────────────────────────────────────

  private static getAdUrl(category: string, id: string): string {
    const baseUrl = "https://svetgradjevine.com";
    switch (category) {
      case "jobs": return `${baseUrl}/posao/${id}`;
      case "machines": case "ostalo": return `${baseUrl}/gradjevinske-masine/srbija/ostalo/${id}`;
      case "accommodations": return `${baseUrl}/smestaj/srbija/ostalo/${id}`;
      case "caterings": return `${baseUrl}/ketering/provajder/${id}`;
      case "lands": return `${baseUrl}/placevi/srbija/ostalo/${id}`;
      case "equipments": return `${baseUrl}/alat-i-oprema/srbija/ostalo/${id}`;
      case "masters": return `${baseUrl}/majstori/profil/${id}`;
      case "companies": return `${baseUrl}/firme/profil/${id}`;
      default: return `${baseUrl}/oglas/${id}`;
    }
  }

  private static shouldSyncToAlgolia(
    oldData: Record<string, any> | null | undefined,
    newData: Record<string, any> | null | undefined,
  ): { shouldSync: boolean; isPartial: boolean; changedFields: string[] } {
    if (!oldData || !newData) return { shouldSync: true, isPartial: false, changedFields: [] };

    const vitalFields = [
      "title", "price", "location", "locationSlug", "status", "tags", "isPremium", "isUrgent",
      "company", "companyId", "category", "type", "typeSlug", "salary", "plataMin", "plataMax",
      "kategorija", "potkategorija", "skills", "profession", "professionSlug", "beds", "roomType",
      "parkingAvailable", "invoiceAvailable", "cuisine", "machineType", "condition", "adType",
      "categoryId", "fuelType", "weightKg", "area", "purpose", "brand", "model", "city",
      "mainCategories", "employeeCount", "isVerified", "isPremiumPartner", "cateringType",
      "kitchenType", "dailyCapacityMeals", "minOrder", "accessRoad", "highwayAccess", "railAccess",
      "freeZone", "accommodationType", "tacnaLokacija", "areaM2", "viewsCount", "geopoint", "_geoloc",
    ];

    const changedFields: string[] = [];
    let isPartial = true;
    let shouldSync = false;
    const safePartialFields = new Set(["status", "viewsCount", "isPremium", "isUrgent", "updatedAt"]);

    for (const field of vitalFields) {
      const oldVal = oldData[field];
      const newVal = newData[field];
      if (oldVal === newVal) continue;

      let hasChanged = false;
      if (typeof oldVal === "object" || typeof newVal === "object") {
        if (JSON.stringify(oldVal || null) !== JSON.stringify(newVal || null)) hasChanged = true;
      } else {
        hasChanged = true;
      }

      if (hasChanged) {
        changedFields.push(field);
        shouldSync = true;
        if (!safePartialFields.has(field)) isPartial = false;
      }
    }

    return { shouldSync, isPartial, changedFields };
  }

  private static async enqueueGooglePing(url: string, type: "URL_UPDATED" | "URL_DELETED") {
    try {
      await QueueService.addJob(JobType.GOOGLE_INDEXING_PING, { url, type });
    } catch (err) {
      Logger.withContext().error(`[SyncProcessor] Failed to enqueue Google Indexing ping: ${url}`, { error: err });
    }
  }

  private static async processUserRelationalSync(targetId: string) {
    const userSnap = await db.collection("users").doc(targetId).get();
    const userData = userSnap.exists
      ? ({ id: userSnap.id, ...userSnap.data() } as Record<string, any>)
      : null;
    if (!userData) return;

    const bp = userData.businessProfile as Record<string, unknown> | undefined;
    const authorSnapshot = {
      displayName: userData.displayName || "",
      photoURL: userData.photoURL || "",
      isVerified: userData.isVerified || false,
      role: userData.role || "standard",
      companyName: (bp?.companyName as string) || (bp?.name as string) || userData.company || "",
    };

    const syncData = {
      authorSnapshot,
      comp: authorSnapshot.companyName || userData.displayName || "Kompanija",
      logo: (bp?.logo as string) || userData.photoURL || "",
      isCompanyVerified: userData.isVerified || false,
    };

    const targetCollections = ["listings", "marketplaces", "machine_listings"];

    for (const collectionName of targetCollections) {
      const adsQuery = db.collection(collectionName).where("authorId", "==", targetId);
      const stream = adsQuery.stream();

      await new Promise<void>((resolve, reject) => {
        let batch = db.batch();
        let opCount = 0;
        const algoliaUpdatesByBatch: { [index: string]: { id: string; data: Record<string, unknown> }[] } = {};
        const promises: Promise<unknown>[] = [];

        stream.on("data", (docSnap: import("firebase-admin/firestore").QueryDocumentSnapshot) => {
          const data = docSnap.data();
          batch.update(docSnap.ref, syncData as admin.firestore.UpdateData<any>);

          const category = (data.type as string) ||
            (collectionName === "marketplaces" ? "marketplace" :
             collectionName === "machine_listings" ? "machines" : "listings");
          if (!algoliaUpdatesByBatch[category]) algoliaUpdatesByBatch[category] = [];
          algoliaUpdatesByBatch[category].push({
            id: docSnap.id,
            data: { ...data, ...syncData, updatedAt: Date.now() },
          });

          opCount++;
          if (opCount >= 450) {
            stream.pause();
            const currentBatch = batch;
            batch = db.batch();
            opCount = 0;
            const currentAlgolia = { ...algoliaUpdatesByBatch };
            for (const k in algoliaUpdatesByBatch) delete algoliaUpdatesByBatch[k];

            promises.push(
              currentBatch.commit()
                .then(() => Promise.all(Object.entries(currentAlgolia).map(([cat, objs]) => syncAdsToIndex(cat, objs))))
                .then(() => stream.resume())
                .catch((err) => (stream as { destroy?: (err: Error) => void }).destroy?.(err)),
            );
          }
        });

        stream.on("end", async () => {
          try {
            if (opCount > 0) {
              await batch.commit();
              await Promise.all(Object.entries(algoliaUpdatesByBatch).map(([cat, objs]) => syncAdsToIndex(cat, objs)));
            }
            await Promise.all(promises);
            resolve();
          } catch (e) { reject(e); }
        });

        stream.on("error", reject);
      });
    }
  }

  private static async processJobApplicationSync(targetId: string, data: Record<string, unknown>) {
    const { updates } = data as { updates: Record<string, unknown> };
    const appsQuery = db.collection("applications").where("jobId", "==", targetId);
    const stream = appsQuery.stream();

    await new Promise<void>((resolve, reject) => {
      let batch = db.batch();
      let opCount = 0;
      const promises: Promise<unknown>[] = [];

      stream.on("data", (docSnap: import("firebase-admin/firestore").QueryDocumentSnapshot) => {
        const appUpdates: Record<string, unknown> = {};
        if (updates.title) appUpdates.jobTitle = updates.title;
        if (updates.location) appUpdates.jobCity = updates.location;
        batch.update(docSnap.ref, appUpdates as admin.firestore.UpdateData<any>);

        opCount++;
        if (opCount >= 450) {
          stream.pause();
          const currentBatch = batch;
          batch = db.batch();
          opCount = 0;
          promises.push(
            currentBatch.commit()
              .then(() => stream.resume())
              .catch((err) => (stream as { destroy?: (err: Error) => void }).destroy?.(err)),
          );
        }
      });

      stream.on("end", async () => {
        try {
          if (opCount > 0) await batch.commit();
          await Promise.all(promises);
          resolve();
        } catch (e) { reject(e); }
      });
      stream.on("error", reject);
    });
  }

  private static async processFullReindex(data: Record<string, unknown>) {
    const targetColl = data.collection as string;
    if (!targetColl) return;

    let collRef: import("firebase-admin/firestore").Query;
    const fifteenMinsAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000));

    if (["companies", "masters"].includes(targetColl)) {
      collRef = db.collection("users")
        .where("role", "==", targetColl === "companies" ? "poslodavac" : "majstor")
        .where("updatedAt", ">=", fifteenMinsAgo);
    } else {
      collRef = db.collection(targetColl)
        .where("status", "==", "active")
        .where("updatedAt", ">=", fifteenMinsAgo);
    }

    collRef = collRef.limit(500).select("id", "type", "title", "status", "updatedAt", "authorId", "location", "price", "comp", "category", "description");
    const stream = collRef.stream();

    await new Promise<void>((resolve, reject) => {
      let algoliaBatch: { id: string; data: Record<string, unknown> }[] = [];
      const promises: Promise<unknown>[] = [];

      stream.on("data", (docSnap: import("firebase-admin/firestore").QueryDocumentSnapshot) => {
        algoliaBatch.push({ id: docSnap.id, data: docSnap.data() });
        if (algoliaBatch.length >= 250) {
          const currBatch = [...algoliaBatch];
          algoliaBatch = [];
          stream.pause();
          promises.push(
            syncAdsToIndex(targetColl, currBatch)
              .then(() => stream.resume())
              .catch((err) => (stream as { destroy?: (err: Error) => void }).destroy?.(err)),
          );
        }
      });

      stream.on("end", async () => {
        try {
          if (algoliaBatch.length > 0) promises.push(syncAdsToIndex(targetColl, algoliaBatch));
          await Promise.all(promises);
          resolve();
        } catch (e) { reject(e); }
      });
      stream.on("error", reject);
    });
  }
}
