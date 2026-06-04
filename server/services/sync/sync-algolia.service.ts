import { db, admin } from "../../config/firebase.ts";
import {
  syncJobToIndex,
  syncAdToIndex,
  deleteAdFromIndex,
  syncAdsToIndex,
} from "../algolia.service.ts";
import { MonitoringService } from "../monitoring.service.ts";
import { Job } from "@svet-gradjevine/shared";
import { syncCircuit } from "../../utils/circuit-breaker.ts";
import { Logger } from "../../utils/logger.ts";
import { TraceContext } from "../../utils/trace.ts";
import { QueueService, JobType, JobPriority } from "../queue.service.ts";
import { SyncTaskType } from "../sync.service.ts";
import { GoogleIndexingService } from "../google-indexing.service.ts";
import { SyncUtils } from "./sync-utils.service.ts";
import { AlgoliaRedisBatcher } from "../algolia-redis-batcher.service.ts";

export interface UserProfileData {
  role?: string;
  displayName?: string;
  businessProfile?: {
    name?: string;
    description?: string;
    category?: string;
    skills?: string[];
    city?: string;
    address?: string;
    logo?: string;
  };
  company?: string;
  bio?: string;
  categoryRank?: string;
  skills?: string[];
  city?: string;
  photoURL?: string;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  status?: string;
  updatedAt?: Date | { getTime: () => number } | number | { toMillis: () => number } | unknown;
}

export class SyncAlgolia {
  static async syncJob(
    jobId: string,
    jobData: Job | Partial<Job>,
    oldData?: Job | Partial<Job>,
    correlationId?: string,
  ) {
    if (oldData) {
      const { shouldSync, isPartial } = SyncUtils.shouldSyncToAlgolia(oldData, jobData);
      if (!shouldSync) {
        Logger.withContext(correlationId || TraceContext.generateId()).info(
          `Skipping Algolia sync for jobs/${jobId} - no vital fields changed`,
        );
        return;
      }
      if (isPartial) {
        (jobData as Record<string, unknown>)._isPartialUpdate = true;
      }
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
      const { shouldSync, isPartial } = SyncUtils.shouldSyncToAlgolia(oldData, data);
      if (!shouldSync) {
        iLogger.info(
          `Skipping Algolia sync for ${category} ${id} - no vital fields changed`,
        );
        return;
      }
      if (isPartial) {
        data._isPartialUpdate = true;
      }
    }

    iLogger.info(`Buffering sync to Redis Stream for ${category} ${id}`);
    
    // Domain 3: Outbox Congestion fix - 50k RPS Adaptive Bulk Batching via Redis Streams
    await AlgoliaRedisBatcher.bufferSync(category, id, data);
  }

  static async deleteAd(category: string, id: string, correlationId?: string) {
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    try {
      await syncCircuit.execute(() => deleteAdFromIndex(category, id));
    } catch (error) {
      await QueueService.addJob(
        JobType.SYNC_COLLECTION,
        {
          type: SyncTaskType.ALGOLIA_AD_DELETE,
          targetId: id,
          data: { category },
          correlationId: cid,
        },
        { priority: JobPriority.LOW },
      );
    }
  }

  static async syncProfile(
    userId: string,
    userData: UserProfileData,
    correlationId?: string,
  ) {
    const cid = correlationId || TraceContext.generateId();
    const iLogger = Logger.withContext(cid);

    let category = "";
    if (
      userData.role === "master" ||
      userData.role === "professional" ||
      userData.role === "majstor"
    )
      category = "masters";
    else if (userData.role === "company" || userData.role === "business")
      category = "companies";

    if (!category) return;

    try {
      iLogger.info(`Syncing profile for ${userId} to ${category}`);

      const algoliaData = {
        name:
          userData.displayName ||
          userData.businessProfile?.name ||
          userData.company ||
          "N/A",
        description:
          userData.businessProfile?.description || userData.bio || "",
        category:
          userData.businessProfile?.category ||
          userData.categoryRank ||
          "Pomoćni radovi",
        skills: userData.businessProfile?.skills || userData.skills || [],
        city: userData.businessProfile?.city || userData.city || "Srbija",
        address: userData.businessProfile?.address || "",
        logo: userData.businessProfile?.logo || userData.photoURL || "",
        rating: userData.rating || 0,
        reviewCount: userData.reviewCount || 0,
        isVerified: userData.isVerified || false,
        status: userData.status || "active",
        updatedAt:
          userData.updatedAt instanceof Date
            ? userData.updatedAt.getTime()
            : Date.now(),
      };

      await syncCircuit.execute(() =>
        syncAdToIndex(category, userId, algoliaData),
      );
      MonitoringService.recordSyncSuccess();
    } catch (error: unknown) {
      iLogger.warn(`Profile sync failed for ${userId}, queuing`, {
        error: error instanceof Error ? error.message : String(error),
      });
      await QueueService.addJob(
        JobType.SYNC_COLLECTION,
        {
          type: SyncTaskType.ALGOLIA_PROFILE_SYNC,
          targetId: userId,
          data: { userData },
          correlationId: cid,
        },
        { priority: JobPriority.MEDIUM },
      );
    }
  }

  static async queueSync(uid: string) {
    await QueueService.addJob(
      JobType.SYNC_COLLECTION,
      {
        type: SyncTaskType.USER_RELATIONAL_SYNC,
        targetId: uid,
      },
      {
        priority: JobPriority.LOW,
        jobId: `sync_user_${uid}`,
      },
    );
  }

  static async forceClearTimeout() {
    // Deprecated
  }
}
