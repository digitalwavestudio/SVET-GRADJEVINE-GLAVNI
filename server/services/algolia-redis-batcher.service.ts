// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { getRedis, getRawRedis } from "../utils/redis.ts";
import { syncAdsToIndex } from "./algolia.service.ts";
import { Logger } from "../utils/logger.ts";
import { LockManager } from "./lock.service.ts";
import { Worker, Job } from "bullmq";
import { QueueService, JobType } from "./queue.service.ts";
import { defaultConnection } from "../utils/queue.ts";
import { RegionService } from "./region.service.ts";

const logger = new Logger({ module: "AlgoliaRedisBatcher" });

// Safe type guard to validate Redis stream results structure natively without any fake casting or unsafe assertions.
function isRedisStreamResults(val: unknown): val is [string, [string, string[]][]][] {
  if (!Array.isArray(val)) return false;
  if (val.length === 0) return true;
  const first = val[0];
  if (!Array.isArray(first) || first.length < 2) return false;
  return typeof first[0] === 'string' && Array.isArray(first[1]);
}

/**
 * Enterprise Adaptive Bulk Batching via Redis Streams.
 * Prevents Cloud Run pods from hammering Algolia with individual saveObject API calls under 50k RPS.
 * Accumulates syncing objects persistently and flushes them as bulk saveObjects via BullMQ workers.
 */
export class AlgoliaRedisBatcher {
  private static STREAM_KEY = "algolia:sync:stream";
  private static CONSUMER_GROUP = "algolia_batch_workers";
  private static CONSUMER_NAME = `worker_${Math.random().toString(36).substring(7)}`;
  private static BATCH_SIZE = 100;
  private static INTERVAL_MS = 2500;
  private static worker: Worker | null = null;

  public static async init() {
    // We allow initialization in dev to ensure functional integrity, 
    // but we can still use fallback sync in bufferSync if preferred.
    const isSandbox = process.env.NODE_ENV !== "production";
    
    const redis = getRedis();
    if (!redis) {
      logger.warn("Redis not available. Algolia batcher will gracefully degrade.");
      return;
    }

    try {
      await redis.xgroup("CREATE", this.STREAM_KEY, this.CONSUMER_GROUP, "0", "MKSTREAM");
    } catch (err: unknown) {
      const isBusyGroup = err instanceof Error && err.message.includes("BUSYGROUP");
      if (!isBusyGroup) {
        logger.error(`Error creating Redis Stream group: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (defaultConnection) {
      this.worker = new Worker(
        "algolia",
        async (job: Job) => {
          if (job.name === JobType.ALGOLIA_BATCH_CRON) {
            await this.processBatch();
          }
        },
        {
          connection: {
          host: process.env.REDIS_HOST || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost'),
          port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : (process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379),
          password: process.env.REDIS_PASSWORD || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        },
          concurrency: 1,
          lockDuration: 300000, // 5 minutes default
          lockRenewTime: 30000,  // Proactive auto-renew every 30s
        }
      );

      if (RegionService.isLeaderRegion()) {
        await QueueService.addJob(
          JobType.ALGOLIA_BATCH_CRON,
          {},
          {
            jobId: "cron:algolia_batch_flusher",
            repeat: { every: this.INTERVAL_MS },
          }
        );
      }
    }
  }

  /**
   * Pushes a document change to the Redis stream for bulk processing.
   */
  public static async bufferSync(category: string, id: string, data: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      await syncAdsToIndex(category, [{ id, data }]);
      return;
    }

    const redis = getRedis();
    if (!redis) {
        await syncAdsToIndex(category, [{ id, data }]);
        return;
    }
    await redis.xadd(this.STREAM_KEY, "*", "category", category, "id", id, "payload", JSON.stringify(data));
  }

  private static async processBatch() {
    const lockKey = "lock:algolia_redis_batcher";
    const redis = getRedis();
    if (!redis) return;

    let lockId: string | null = null;
    try {
      lockId = await LockManager.acquire(lockKey, this.INTERVAL_MS * 2);
      if (!lockId) return;

      const results: unknown = await redis.xreadgroup(
        "GROUP", this.CONSUMER_GROUP, this.CONSUMER_NAME,
        "COUNT", this.BATCH_SIZE,
        "STREAMS", this.STREAM_KEY, ">"
      );

      if (!results || !isRedisStreamResults(results) || results.length === 0) return;

      const streamData = results[0][1];
      if (streamData.length === 0) return;

      const itemsByCategory: Record<string, { id: string; data: Record<string, unknown>; streamId: string }[]> = {};
      const deadStreamIds: string[] = [];

      for (const [streamId, fields] of streamData) {
        let category = "ads";
        let id = "";
        let data: Record<string, unknown> = {};

        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          const val = fields[i + 1];
          if (key === "category") category = val;
          if (key === "id") id = val;
          if (key === "payload") {
            try { 
              const parsed = JSON.parse(val);
              if (parsed && typeof parsed === "object") {
                data = parsed as Record<string, unknown>;
              }
            } catch (e: unknown) {}
          }
        }
        
        if (!itemsByCategory[category]) itemsByCategory[category] = [];
        const existingIdx = itemsByCategory[category].findIndex(v => v.id === id);
        if (existingIdx !== -1) {
             deadStreamIds.push(itemsByCategory[category][existingIdx].streamId);
             itemsByCategory[category][existingIdx] = { streamId, id, data };
        } else {
             itemsByCategory[category].push({ streamId, id, data });
        }
      }

      // Proactive optimization: Acknowledge all overwritten/superseded duplicate updates in a single bulk call
      if (deadStreamIds.length > 0) {
        await redis.xack(this.STREAM_KEY, this.CONSUMER_GROUP, ...deadStreamIds);
      }

      for (const category of Object.keys(itemsByCategory)) {
        const batch = itemsByCategory[category];
        if (batch.length === 0) continue;

        try {
          await syncAdsToIndex(category, batch.map(b => ({ id: b.id, data: b.data })));
          const streamIds = batch.map(b => b.streamId);
          await redis.xack(this.STREAM_KEY, this.CONSUMER_GROUP, ...streamIds);
          logger.info(`[AlgoliaRedisBatcher] Auto-flushed ${batch.length} items to '${category}' via bulk operation.`);
        } catch (syncErr: unknown) {
          logger.error(`[AlgoliaRedisBatcher] Bulk sync failed for ${category}: ${syncErr instanceof Error ? syncErr.message : String(syncErr)}`);
        }
      }
    } catch (e: unknown) {
      logger.error(`[AlgoliaRedisBatcher] processing error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  public static async gracefulShutdown() {
    if (this.worker) {
      await this.worker.close();
      logger.info("[AlgoliaRedisBatcher] Worker shut down.");
    }
  }
}
