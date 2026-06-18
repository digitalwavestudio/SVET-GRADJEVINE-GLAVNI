import { db, getDb, admin as firebaseAdmin } from "../../config/firebase.ts";
import DOMPurify from "isomorphic-dompurify";
import { CacheService } from "../cache.service.ts";
import { CacheInvalidationService } from "../cache-invalidation.service.ts";
import { Job, jobSchema, User } from "@svet-gradjevine/shared";
import { AppError, BadRequestError, NotFoundError } from "../../utils/appError.ts";
import { sanitizeInput } from "../../../src/lib/sanitize.ts";
import { DomainEvents } from "../../events/event-bus.ts";
import { TraceContext } from "../../utils/trace.ts";
import { AdminStatsService } from "../admin-stats.service.ts";

export class JobsCoreService {
  static async getPublicJobs(limit: number = 100, cursor?: string) {
    const cacheKey = cursor ? `public_jobs_${limit}_${cursor}` : `public_jobs_${limit}`;
    const cached = await CacheService.get(cacheKey);
    // Return cached if available
    if (cached) return cached;

    try {
      // Bypass proxy to avoid circuit-breaker returning empty wrapped data
      const rawDb = getDb();

      // Fetch from Firestore
      let q = rawDb
        .collection("listings")
        .where("type", "==", "job")
        .where("status", "==", "active")
        .orderBy("createdAt", "desc");
        
      if (cursor) {
        const cursorDoc = await rawDb.collection("listings").doc(cursor).get();
        if (cursorDoc.exists) {
            q = q.startAfter(cursorDoc);
        }
      }

      const snap = await q
        .limit(limit)
        .select(
          "title",
          "price",
          "location",
          "loc",
          "type",
          "status",
          "createdAt",
          "images",
          "isPremium",
          "isUrgent",
          "comp",
          "salary",
          "sal",
          "logo",
          "benefits",
          "plataMin",
          "plataMax",
          "salaryType",
          "smestaj",
          "prevoz",
          "hrana",
          "housing",
          "transport",
          "food",
          "topliObrok",
          "benefiti",
          "rawBenefits",
        )
        .get();

      const docs = snap.docs.map((doc: firebaseAdmin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

      const response = {
        docs,
        lastVisible: docs.length === limit ? docs[docs.length - 1].id : null,
        hasMore: docs.length === limit,
      };

      // Cache the result for 60 minutes (Quota protection)
      await CacheService.set(cacheKey, response, 3600000);
      return response;
    } catch (error: any) {
      const err = error as Error & { details?: string; code?: number };
      const errMsg = err?.message || "";
      const isQuotaError = 
        errMsg.includes("Quota limit exceeded") || 
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        err?.details?.includes("Quota limit exceeded") ||
        err?.code === 8;

      // Check for missing composite index
      const isIndexError = errMsg.includes("The query requires an index");
        
      if (isIndexError) {
        console.error("[JOBS] MISSING COMPOSITE INDEX! Create index for: type↑, status↑, createdAt↓");
        console.error("[JOBS] Index link (from error):", errMsg.match(/https:\/\/console\.firebase[^\s]*/)?.[0] || "N/A");
      } else if (isQuotaError) {
        console.error("[JOBS] Firestore QUOTA EXCEEDED. Serving fallback/stale data.");
      } else {
        console.error("[JOBS] Firestore error:", errMsg);
      }
      
      // Try to return stale cache if database is down or quota hit
      console.log("[JOBS] getPublicJobs returning empty - cached:", !!cached, "error:", isIndexError ? "INDEX_MISSING" : isQuotaError ? "QUOTA" : "OTHER");
      return cached || { docs: [], lastVisible: null, hasMore: false, warning: isQuotaError ? "Quota hit" : undefined };
    }
  }

  static async getJobById(id: string) {
    const cacheKey = `job:${id}`;
    const cached = await CacheService.get<Job>(cacheKey);
    if (cached) return cached;

    const jobSnap = await db.collection("listings").doc(id).get();
    const job = jobSnap.exists
      ? ({ id: jobSnap.id, ...jobSnap.data() } as Job)
      : null;
    if (!job) throw new NotFoundError("Oglas nije pronađen");

    await CacheService.set(cacheKey, job, 3600 * 1000); // 1 hour cache
    return job;
  }

  static async createJob(rawPayload: unknown, uid: string) {
    const jobPayload = jobSchema.parse(rawPayload);
    const now = Date.now();
    const todayStr = new Date().toISOString().split("T")[0];

    const resultData = await db.runTransaction(async (transaction) => {
      const statsRef = db
        .collection("users")
        .doc(uid)
        .collection("job_post_stats")
        .doc(todayStr);
      const statsSnap = await transaction.get(statsRef);
      const statsData = statsSnap.exists
        ? statsSnap.data()!
        : { count: 0, lastTimestamp: 0 };

      if (now - (statsData.lastTimestamp || 0) < 60000)
        throw new AppError("Sačekajte minut.", 429);
      if ((statsData.count || 0) >= 20)
        throw new AppError("Dnevni limit dostignut.", 429);

      const userSnap = await transaction.get(db.collection("users").doc(uid));
      const userData = userSnap.exists
        ? ({ id: userSnap.id, ...userSnap.data() } as User)
        : null;
      if (!userData) throw new BadRequestError("Korisnik ne postoji.");

      // More robust role naming handling
      const safeRole = (userData.role || "").toLowerCase();
      const isEmployer = [
        "poslodavac",
        "employer",
        "kompanija",
        "agencija",
      ].includes(safeRole);

      if (!isEmployer) {
        throw new BadRequestError("Samo poslodavci mogu postavljati oglase.");
      }

      // Strict field picking for Job
      const titleFallback =
        (jobPayload as any).professionSlug ||
        (jobPayload as any).category ||
        "Građevinski posao";
      const safeJob: Partial<Job> = {
        title: sanitizeInput(jobPayload.title || titleFallback),
        description: DOMPurify.sanitize(jobPayload.description || ""),
        opis: DOMPurify.sanitize(jobPayload.opis || ""),
        location: sanitizeInput(jobPayload.location || ""),
        locationSlug: sanitizeInput(jobPayload.locationSlug || ""),
        sectorSlug: jobPayload.sectorSlug || "",
        professionSlug: jobPayload.professionSlug || "",
        engagementSlug: jobPayload.engagementSlug || "",
        experienceSlug: jobPayload.experienceSlug || "",
        // type: jobPayload.type || '',
        salary: jobPayload.salary || "",
        salaryType: jobPayload.salaryType || "",
        plataMin: jobPayload.plataMin,
        plataMax: jobPayload.plataMax,
        telefon: jobPayload.telefon || "",
        viber: jobPayload.viber,
        whatsapp: jobPayload.whatsapp,
        images: jobPayload.images || [],
        tacnaLokacija: jobPayload.tacnaLokacija || "",
        benefits: jobPayload.benefits || [],
        email: jobPayload.email || "",
      };

      safeJob.authorId = uid;
      safeJob.companyId =
        jobPayload.companyId ||
        (["employer", "poslodavac"].includes(safeRole) ? uid : undefined);

      if (isEmployer) {
        safeJob.comp =
          userData.businessProfile?.companyName ||
          userData.company ||
          userData.displayName ||
          "Kompanija";
        safeJob.logo =
          userData.businessProfile?.logo || userData.photoURL || "";
        safeJob.isCompanyVerified = userData.isVerified || false;
      } else {
        safeJob.comp =
          userData.displayName ||
          (userData.firstName
            ? `${userData.firstName} ${userData.lastName}`
            : "Privatni oglašivač");
        safeJob.logo = userData.photoURL || "";
      }

      (safeJob as any).authorSnapshot = {
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || "",
        isVerified: userData.isVerified || false,
        role: userData.role || "standard",
        companyName:
          userData.businessProfile?.companyName ||
          (userData.businessProfile as any)?.name ||
          (userData as any).company ||
          "",
      };

      safeJob.status = jobPayload.status === "draft" ? "draft" : "active";
      safeJob.viewsCount = 0;
      safeJob.applicantsCount = 0;
      safeJob.isPremium = jobPayload.paket === "premium" || jobPayload.paket === "premium_partner";
      safeJob.isUrgent = jobPayload.paket === "urgent";

      const jobDocRef = db.collection("listings").doc();
      transaction.set(jobDocRef, {
        ...safeJob,
        type: "job",
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
      const jobId = jobDocRef.id;

      // Activity log is handled asynchronously via EventBus.

      // Agregacija dashboard metrika
      await AdminStatsService.updateGlobalStats(
        "jobs",
        1,
        safeJob.isPremium || false,
        safeJob.status || "active",
        transaction,
        safeJob.isUrgent || false,
      );

      if (safeJob.status === "active") {
        await AdminStatsService.updateUserStats(
          uid,
          { activeAds: 1 },
          transaction,
        );
      }

      transaction.set(
        statsRef,
        {
          count: (statsData.count || 0) + 1,
          lastTimestamp: now,
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      // PERSISTENT OUTBOX: Save event to be processed by worker
      if (safeJob.status === "active") {
        const outboxRef = db.collection("outbox").doc();
        transaction.set(outboxRef, {
          type: DomainEvents.JOB_CREATED,
          version: 1,
          correlationId: TraceContext.generateId(),
          idempotencyKey: `job_created_${jobId}`,
          payload: { jobId, jobData: safeJob },
          status: "pending",
          attempts: 0,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return { id: jobId, jobData: safeJob };
    });

    // Invalidate job caches to show the new job immediately on listings view
    CacheInvalidationService.onJobChange(uid);

    return { success: true, jobId: resultData.id };
  }

  static async updateJob(id: string, updates: Partial<Job>, uid: string) {
    const cid = TraceContext.generateId();

    await db.runTransaction(async (transaction) => {
      const jobRef = db.collection("listings").doc(id);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists) throw new NotFoundError("Oglas nije pronađen");

      const jobData = jobSnap.data() as Job;
      if (jobData.authorId !== uid)
        throw new BadRequestError("Nemate dozvolu za izmenu ovog oglasa");

      const cleanUpdates: any = {
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };

      const userSnap = await transaction.get(
        db.collection("users").doc(jobData.authorId),
      );
      if (userSnap.exists) {
        const userData = userSnap.data()!;
        cleanUpdates.authorSnapshot = {
          displayName: userData.displayName || "",
          photoURL: userData.photoURL || "",
          isVerified: userData.isVerified || false,
          role: userData.role || "standard",
          companyName:
            userData.businessProfile?.companyName ||
            userData.businessProfile?.name ||
            userData.company ||
            "",
        };
        cleanUpdates.comp =
          userData.businessProfile?.companyName ||
          userData.company ||
          userData.displayName ||
          "Kompanija";
        cleanUpdates.logo =
          userData.businessProfile?.logo || userData.photoURL || "";
        cleanUpdates.isCompanyVerified = userData.isVerified || false;
      }

      if (updates.title) cleanUpdates.title = sanitizeInput(updates.title);
      if (updates.description)
        cleanUpdates.description = DOMPurify.sanitize(updates.description);
      if (updates.location)
        cleanUpdates.location = sanitizeInput(updates.location);
      if (updates.status) cleanUpdates.status = updates.status;
      if (updates.salary) cleanUpdates.salary = updates.salary;
      if (updates.plataMin !== undefined)
        cleanUpdates.plataMin = updates.plataMin;
      if (updates.plataMax !== undefined)
        cleanUpdates.plataMax = updates.plataMax;

      transaction.update(jobRef, cleanUpdates);

      // Log status change activity
      if (updates.status && updates.status !== jobData.status) {
        const activityId = db.collection("activities").doc().id;
        transaction.set(db.collection("activities").doc(activityId), {
          userId: uid,
          type: "AD_STATUS_CHANGED",
          targetId: id,
          targetType: "jobs",
          title: "Status oglasa promenjen",
          message: `Oglas "${jobData.title}" je sada ${updates.status}.`,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      }

      // Agregacija ako se promeni status (npr. iz draft u active)
      if (updates.status && updates.status !== jobData.status) {
        // Umanjujemo stari status
        await AdminStatsService.updateGlobalStats(
          "jobs",
          -1,
          jobData.isPremium,
          jobData.status,
          transaction,
          jobData.isUrgent,
        );
        if (jobData.status === "active") {
          await AdminStatsService.updateUserStats(
            uid,
            { activeAds: -1 },
            transaction,
          );
        }

        // Povećavamo novi status
        const isUrgentNow =
          updates.isUrgent !== undefined ? updates.isUrgent : jobData.isUrgent;
        const isPremiumNow =
          updates.isPremium !== undefined
            ? updates.isPremium
            : jobData.isPremium;

        await AdminStatsService.updateGlobalStats(
          "jobs",
          1,
          isPremiumNow,
          updates.status,
          transaction,
          isUrgentNow,
        );
        if (updates.status === "active") {
          await AdminStatsService.updateUserStats(
            uid,
            { activeAds: 1 },
            transaction,
          );
        }
      }

      // Relational sync queueing via Outbox
      const outboxRef = db.collection("outbox").doc();
      transaction.set(outboxRef, {
        type: DomainEvents.JOB_UPDATED,
        version: 1,
        idempotencyKey: `job_update_${id}_${Date.now()}`,
        correlationId: cid,
        payload: {
          jobId: id,
          updates: cleanUpdates,
          oldData: jobData,
          newData: { ...jobData, ...cleanUpdates },
        },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Invalidate job caches to show the updated job immediately on listings view
    CacheInvalidationService.onJobChange(uid);

    return { success: true };
  }

  static async deleteJob(id: string, uid: string) {
    const cid = TraceContext.generateId();

    await db.runTransaction(async (transaction) => {
      const jobRef = db.collection("listings").doc(id);
      const jobSnap = await transaction.get(jobRef);
      if (!jobSnap.exists) throw new NotFoundError("Oglas nije pronađen");

      const jobData = jobSnap.data() as Job;
      if (jobData.authorId !== uid)
        throw new BadRequestError("Nemate dozvolu za brisanje ovog oglasa");

      transaction.delete(jobRef);

      // Log deletion activity
      const activityId = db.collection("activities").doc().id;
      transaction.set(db.collection("activities").doc(activityId), {
        userId: uid,
        type: "AD_DELETED",
        targetId: id,
        targetType: "jobs",
        title: "Oglas obrisan",
        message: `Oglas za posao "${jobData.title}" je obrisan.`,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      // Umanjenje dashboard metrika
      await AdminStatsService.updateGlobalStats(
        "jobs",
        -1,
        jobData.isPremium || false,
        jobData.status || "active",
        transaction,
        jobData.isUrgent || false,
      );

      if (jobData.status === "active") {
        await AdminStatsService.updateUserStats(
          uid,
          { activeAds: -1 },
          transaction,
        );
      }

      // Cleanup applications via outbox asynchronously
      const outboxRef = db.collection("outbox").doc();
      transaction.set(outboxRef, {
        type: DomainEvents.JOB_DELETED,
        version: 1,
        idempotencyKey: `job_delete_${id}`,
        correlationId: cid,
        payload: { jobId: id },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Invalidate job caches to show the deleted job immediately on listings view
    CacheInvalidationService.onJobChange(uid);

    return { success: true };
  }
}
