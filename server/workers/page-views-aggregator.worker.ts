import { env } from "../config/env.ts";
import { db, admin } from "../config/firebase.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "../services/lock.service.ts";
import { Logger } from "../utils/logger.ts";
import { CacheService } from "../services/cache.service.ts";

const REDIS_KEY_MAGAZINE_PENDING_VIEWS = "metrics:magazine_pending_views";
const FLUSH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export class PageViewsAggregatorWorker {
  private static logger = new Logger({ service: "PageViewsAggregatorWorker" });
  private static interval: NodeJS.Timeout | null = null;

  static start() {
    this.logger.info("Initializing Page Views Aggregator Worker (runs every 30 minutes via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        const cronPattern = env.NODE_ENV === "production" ? "*/30 * * * *" : "0 */12 * * *";
        SystemCron.register("page_views_aggregator_cron", { pattern: cronPattern }, async () => {
          await this.flushBufferedViews();
        }).catch(err => this.logger.error("Failed to register Page Views Aggregator cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static stop() {
    // Handled natively by SystemCron
  }

  static async flushBufferedViews(): Promise<void> {
    if (env.NODE_ENV !== "production") return;
    const redis = getRedis();
    if (!redis) {
      this.logger.info("Redis client not available, skipping buffered views flush.");
      return;
    }

    const lockKey = "lock:magazine_views_flush";
    const lockId = await LockManager.acquire(lockKey, 60000); // 1 min lock
    if (!lockId) {
      this.logger.info("Failed to acquire lock for magazine views flush, skipping.");
      return;
    }

    try {
      // 1. Get all pending magazine view counts
      const pendingViews = await redis.hgetall(REDIS_KEY_MAGAZINE_PENDING_VIEWS);
      if (!pendingViews || Object.keys(pendingViews).length === 0) {
        return;
      }

      this.logger.info(`Starting batch flush for ${Object.keys(pendingViews).length} articles.`);

      const entries = Object.entries(pendingViews);
      const chunkSize = 400; // Firestore batch limit is 500
      
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        const processedKeys: string[] = [];
        let totalViewsInBatch = 0;

        for (const [articleId, countStr] of chunk) {
          const count = parseInt(countStr as string, 10);
          if (isNaN(count) || count <= 0) continue;

          // Update both 'views' and 'viewCount' as specified & expected by existing code
          const articleRef = db.collection("articles").doc(articleId);
          batch.set(
            articleRef,
            {
              viewCount: admin.firestore.FieldValue.increment(count),
              views: admin.firestore.FieldValue.increment(count),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );

          processedKeys.push(articleId);
          totalViewsInBatch += count;
        }

        if (processedKeys.length > 0) {
          // Also update global/metadata stats
          const metadataRef = db.doc("metadata/magazine_stats");
          batch.set(
            metadataRef,
            {
              totalViews: admin.firestore.FieldValue.increment(totalViewsInBatch),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );

          await batch.commit();

          // Clear flushed counts from Redis
          await redis.hdel(REDIS_KEY_MAGAZINE_PENDING_VIEWS, ...processedKeys);
          this.logger.info(`Successfully flushed ${totalViewsInBatch} views to ${processedKeys.length} articles.`);
        }
      }

      // Evict lists cache to reflect updated view counts immediately
      await CacheService.invalidateByPrefix("magazine_list_");
    } catch (err) {
      this.logger.error("Global failure flushing buffered views", err);
    } finally {
      if (lockId) {
        await LockManager.release(lockKey, lockId);
      }
    }
  }
}
