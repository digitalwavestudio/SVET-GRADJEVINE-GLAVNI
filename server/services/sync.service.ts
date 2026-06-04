import { Logger } from "../utils/logger.ts";
import { Worker, Job as BullJob } from "bullmq";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { DLQService } from "./dlq.service.ts";
import { Job } from "@svet-gradjevine/shared";

import { SyncUtils } from "./sync/sync-utils.service.ts";
import { SyncAlgolia } from "./sync/sync-algolia.service.ts";
import { SyncProcessor } from "./sync/sync-processor.service.ts";

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
  correlationId?: string;
  type: SyncTaskType;
  targetId: string;
  data?: unknown;
  retryCount: number;
  lastError?: string;
  status: "pending" | "failed" | "completed";
  createdAt: import("firebase-admin/firestore").Timestamp | number | Date | string | null;
  updatedAt: import("firebase-admin/firestore").Timestamp | number | Date | string | null;
}

export class SyncManager {
  private static COLLECTION = "sync_tasks";
  private static worker: Worker;

  static async init() {
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      Logger.withContext().warn("⚠️ Redis missing. Sync BullMQ Worker skipped.");
      return;
    }

    Logger.withContext().info(
      `🚀 Sync BullMQ Worker Starting (Using shared connection)...`,
    );

    this.worker = new Worker(
      "sync",
      async (job: BullJob) => {
        await SyncProcessor.processJob(job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost'),
          port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : (process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379),
          password: process.env.REDIS_PASSWORD || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        },
        concurrency: 3,
        lockDuration: 300000, // 5 minutes default
        lockRenewTime: 30000,  // Proactive auto-renew every 30s
      },
    );

    this.worker.on("failed", async (job, err) => {
      if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
        await DLQService.handleFinalFailure(job, err);
      }
    });
  }

  static getAdUrl(category: string, id: string): string {
    return SyncUtils.getAdUrl(category, id);
  }

  static shouldSyncToAlgolia(oldData: Record<string, unknown> | null | undefined, newData: Record<string, unknown> | null | undefined): { shouldSync: boolean, isPartial: boolean, changedFields: string[] } {
    return SyncUtils.shouldSyncToAlgolia(oldData, newData);
  }

  static async syncJob(
    jobId: string,
    jobData: Job | Partial<Job>,
    oldData?: Job | Partial<Job>,
    correlationId?: string,
  ) {
    return SyncAlgolia.syncJob(jobId, jobData, oldData, correlationId);
  }

  static async flushAlgoliaBatch() {
    // Deprecated
  }

  static async syncAd(
    category: string,
    id: string,
    data: Record<string, unknown>,
    oldData?: Record<string, unknown>,
    correlationId?: string,
  ) {
    return SyncAlgolia.syncAd(category, id, data, oldData, correlationId);
  }

  static async deleteAd(category: string, id: string, correlationId?: string) {
    return SyncAlgolia.deleteAd(category, id, correlationId);
  }

  static async syncProfile(
    userId: string,
    userData: Record<string, unknown>,
    correlationId?: string,
  ) {
    return SyncAlgolia.syncProfile(userId, userData, correlationId);
  }

  static async queueSync(uid: string) {
    return SyncAlgolia.queueSync(uid);
  }

  static async gracefulShutdown() {
    await SyncAlgolia.forceClearTimeout();
    if (this.worker) await this.worker.close();
    Logger.withContext().info("Sync Worker shut down.");
  }
}
