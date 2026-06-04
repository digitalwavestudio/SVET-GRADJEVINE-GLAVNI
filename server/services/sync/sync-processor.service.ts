import { db, admin } from "../../config/firebase.ts";
import {
  syncJobToIndex,
  syncAdToIndex,
  deleteAdFromIndex,
  syncAdsToIndex,
} from "../algolia.service.ts";
import { MonitoringService } from "../monitoring.service.ts";
import { syncCircuit } from "../../utils/circuit-breaker.ts";
import { Logger } from "../../utils/logger.ts";
import { TraceContext } from "../../utils/trace.ts";
import { Job as BullJob } from "bullmq";
import { SyncTaskType } from "../sync.service.ts";
import { SyncUtils } from "./sync-utils.service.ts";
import { SyncAlgolia } from "./sync-algolia.service.ts";
import { QueueService, JobType } from "../queue.service.ts";

export class SyncProcessor {
  static async processJob(job: BullJob) {
    const { type, targetId, data, correlationId } = job.data;
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    await TraceContext.run(cid, async () => {
      try {
        iLogger.info(`${TraceContext.logPrefix()} Processing sync task`, {
          type,
          targetId,
        });

        if (type === SyncTaskType.ALGOLIA_JOB_SYNC) {
          await syncCircuit.execute(() =>
            syncJobToIndex(targetId, data as Record<string, unknown>),
          );
          await this.enqueueGooglePing(SyncUtils.getAdUrl("jobs", targetId), "URL_UPDATED");
        } else if (type === SyncTaskType.ALGOLIA_JOB_DELETE) {
          await syncCircuit.execute(() => deleteAdFromIndex("jobs", targetId));
          await this.enqueueGooglePing(SyncUtils.getAdUrl("jobs", targetId), "URL_DELETED");
        } else if (type === SyncTaskType.ALGOLIA_AD_SYNC) {
          const { category, ...adData } = data as Record<string, unknown>;
          await syncCircuit.execute(() =>
            syncAdToIndex(category as string, targetId, adData),
          );
          await this.enqueueGooglePing(SyncUtils.getAdUrl(category as string, targetId), "URL_UPDATED");
        } else if (type === SyncTaskType.ALGOLIA_AD_DELETE) {
          const { category } = data as Record<string, unknown>;
          await syncCircuit.execute(() =>
            deleteAdFromIndex(category as string, targetId),
          );
          await this.enqueueGooglePing(SyncUtils.getAdUrl(category as string, targetId), "URL_DELETED");
        } else if (type === SyncTaskType.ALGOLIA_PROFILE_SYNC) {
          const { userData } = data as Record<string, unknown>;
          await SyncAlgolia.syncProfile(targetId as string, userData as Record<string, any>, cid);
        } else if (type === SyncTaskType.ALGOLIA_PROFILE_DELETE) {
          const { category } = data as Record<string, unknown>;
          await syncCircuit.execute(() =>
            deleteAdFromIndex(category as string, targetId as string),
          );
          await this.enqueueGooglePing(SyncUtils.getAdUrl(category as string, targetId as string), "URL_DELETED");
        } else if (type === SyncTaskType.USER_RELATIONAL_SYNC) {
          await this.processUserRelationalSync(targetId as string);
        } else if (type === SyncTaskType.JOB_APPLICATION_SYNC) {
          await this.processJobApplicationSync(targetId as string, data);
        } else if (type === "FULL_REINDEX") {
          await this.processFullReindex(data as Record<string, unknown>);
        }

        MonitoringService.recordSyncSuccess();
        iLogger.info(
          `${TraceContext.logPrefix()} Completed sync task ${targetId}`,
        );
      } catch (err: unknown) {
        iLogger.error(`${TraceContext.logPrefix()} Sync task failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
        MonitoringService.recordSyncFail();
        throw err; // BullMQ handles retry
      }
    });
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
    if (userData) {
      const authorSnapshot = {
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || "",
        isVerified: userData.isVerified || false,
        role: userData.role || "standard",
        companyName:
          (userData.businessProfile as Record<string, unknown>)?.companyName ||
          (userData.businessProfile as Record<string, unknown>)?.name ||
          userData.company ||
          "",
      };

      const syncData = {
        authorSnapshot,
        comp: authorSnapshot.companyName || userData.displayName || "Kompanija",
        logo: (userData.businessProfile as Record<string, unknown>)?.logo || userData.photoURL || "",
        isCompanyVerified: userData.isVerified || false,
      };

      const targetCollections = [
        "listings",
        "marketplaces",
        "machine_listings",
      ];

      for (const collectionName of targetCollections) {
        const adsQuery = db
          .collection(collectionName)
          .where("authorId", "==", targetId);
        const stream = adsQuery.stream();

        await new Promise<void>((resolve, reject) => {
          let batch = db.batch();
          let opCount = 0;
          const algoliaUpdatesByBatch: {
            [index: string]: { id: string; data: Record<string, unknown> }[];
          } = {};
          let promises: Promise<unknown>[] = [];

          stream.on("data", (docSnap: import("firebase-admin/firestore").QueryDocumentSnapshot) => {
            const data = docSnap.data();
            const updatedAdData = {
              ...data,
              ...syncData,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            batch.update(docSnap.ref, syncData as admin.firestore.UpdateData<any>);

            const category =
              (data.type as string) ||
              (collectionName === "marketplaces"
                ? "marketplace"
                : collectionName === "machine_listings"
                  ? "machines"
                  : "listings");
            if (!algoliaUpdatesByBatch[category])
              algoliaUpdatesByBatch[category] = [];
            algoliaUpdatesByBatch[category].push({
              id: docSnap.id,
              data: { ...updatedAdData, updatedAt: Date.now() },
            });

            opCount++;
            if (opCount >= 450) {
              stream.pause();
              const currentBatch = batch;
              batch = db.batch(); // reset
              opCount = 0;

              const currentAlgolia = { ...algoliaUpdatesByBatch };
              for (let k in algoliaUpdatesByBatch)
                delete algoliaUpdatesByBatch[k];

              const p = currentBatch
                .commit()
                .then(() => {
                  return Promise.all(
                    Object.entries(currentAlgolia).map(([cat, objs]) =>
                      syncAdsToIndex(cat, objs),
                    ),
                  );
                })
                .then(() => {
                  stream.resume();
                })
                .catch((err) => {
                  (stream as { destroy?: (err: Error) => void }).destroy?.(err);
                });
              promises.push(p);
            }
          });

          stream.on("end", async () => {
            try {
              if (opCount > 0) {
                await batch.commit();
                await Promise.all(
                  Object.entries(algoliaUpdatesByBatch).map(([cat, objs]) =>
                    syncAdsToIndex(cat, objs),
                  ),
                );
              }
              await Promise.all(promises);
              resolve();
            } catch (e) {
              reject(e);
            }
          });

          stream.on("error", reject);
        });
      }
    }
  }

  private static async processJobApplicationSync(targetId: string, data: Record<string, unknown>) {
    const { updates } = data as { updates: Record<string, unknown> };
    const appsQuery = db
      .collection("applications")
      .where("jobId", "==", targetId);
    const stream = appsQuery.stream();

    await new Promise<void>((resolve, reject) => {
      let batch = db.batch();
      let opCount = 0;
      let promises: Promise<unknown>[] = [];

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
            currentBatch
              .commit()
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
        } catch (e) {
          reject(e);
        }
      });
      stream.on("error", reject);
    });
  }

  private static async processFullReindex(data: Record<string, unknown>) {
    const targetColl = data.collection as string;
    if (targetColl) {
      let collRef: import("firebase-admin/firestore").Query;
      
      // PROMPT 6: Delta Algolia Sync - povlačimo samo oglase menjane u poslednjih 15 minuta
      const fifteenMinsAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 15 * 60 * 1000));

      if (["companies", "masters"].includes(targetColl)) {
        collRef = db
          .collection("users")
          .where(
            "role",
            "==",
            targetColl === "companies" ? "poslodavac" : "majstor",
          )
          .where("updatedAt", ">=", fifteenMinsAgo);
      } else {
        collRef = db
          .collection(targetColl)
          .where("status", "==", "active")
          .where("updatedAt", ">=", fifteenMinsAgo);
      }

      const stream = collRef.stream();
      await new Promise<void>((resolve, reject) => {
        let algoliaBatch: { id: string; data: Record<string, unknown> }[] = [];
        let promises: Promise<unknown>[] = [];

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
            if (algoliaBatch.length > 0)
              promises.push(syncAdsToIndex(targetColl, algoliaBatch));
            await Promise.all(promises);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
        stream.on("error", reject);
      });
    }
  }
}
