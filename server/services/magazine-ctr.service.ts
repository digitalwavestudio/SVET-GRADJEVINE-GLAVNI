import { db, admin } from "../config/firebase.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { Logger } from "../utils/logger.ts";
import { CacheService } from "./cache.service.ts";
import { CACHE_PREFIXES, CacheKeys } from "../constants/cache-keys.ts";

export class MagazineCtrService {
  private static logger = new Logger({ service: "MagazineCtrService" });
  private static localClicksMap = new Map<string, number>();

  /**
   * Tracks a click transaction inside the Redis hash buffer (or local memo-fallback if Redis is down)
   */
  static async recordClick(articleId: string, targetType: string): Promise<void> {
    if (!articleId || !targetType) return;

    const redis = getRedis();
    if (!redis) {
      this.recordLocalClick(articleId, targetType, 1);
      return;
    }

    try {
      const key = CacheKeys.magazineClicks(articleId, targetType);
      await redis.hincrby(key, "count", 1);
    } catch (err) {
      this.logger.warn(`Redis transaction failed, routing to RAM fallback. Err: ${err}`);
      this.recordLocalClick(articleId, targetType, 1);
    }
  }

  private static recordLocalClick(articleId: string, targetType: string, count: number) {
    const key = `${articleId}:${targetType}`;
    const existing = this.localClicksMap.get(key) || 0;
    this.localClicksMap.set(key, existing + count);
  }

  /**
   * Safe persistence "flush" worker.
   * Periodically pools intermediate Redis keys and memory logs,
   * performs a single optimized Firestore transaction to decrement/increment, saving 99% cost.
   */
  static async flush(): Promise<void> {
    const lockKey = "lock:magazine_ctr_clicks_flush";
    const lockId = await LockManager.acquire(lockKey, 90000); // 1.5 min lock
    if (!lockId) {
      this.logger.info("CTR clicks flush locked by another server node. Skipping round.");
      return;
    }

    const redis = getRedis();
    const aggregatedData: Record<string, Record<string, number>> = {};

    try {
      // 1. Fetch from Redis using cursor-scans
      if (redis) {
        let cursor = "0";
        let scanResults: string[] = [];
        do {
          const res = await redis.scan(cursor, "MATCH", CACHE_PREFIXES.MAGAZINE_CLICKS + "*", "COUNT", 100);
          cursor = res[0];
          scanResults = scanResults.concat(res[1]);
        } while (cursor !== "0");

        for (const key of scanResults) {
          // Key format: magazine:clicks:<article_id>:<target_type>
          const parts = key.split(":");
          if (parts.length >= 4) { // magazine:clicks:ID:TYPE
            const articleId = parts[2];
            const targetType = parts[3];
            const countStr = await redis.hget(key, "count");
            const count = parseInt(countStr || "0", 10);
            if (count > 0 && articleId && targetType) {
              if (!aggregatedData[articleId]) aggregatedData[articleId] = {};
              aggregatedData[articleId][targetType] = (aggregatedData[articleId][targetType] || 0) + count;
            }
          }
        }
      }

      // 2. Fetch from local RAM fallback
      for (const [key, count] of this.localClicksMap.entries()) {
        const parts = key.split(":");
        if (parts.length === 2) {
          const articleId = parts[0];
          const targetType = parts[1];
          if (articleId && targetType) {
            if (!aggregatedData[articleId]) aggregatedData[articleId] = {};
            aggregatedData[articleId][targetType] = (aggregatedData[articleId][targetType] || 0) + count;
          }
        }
      }

      const articleIds = Object.keys(aggregatedData);
      if (articleIds.length === 0) {
        // Nothing to flush
        return;
      }

      this.logger.info(`Flushing magazine CTR clickstreams for ${articleIds.length} articles.`);

      // 3. Batch build for Firestore
      const batch = db.batch();
      let batchCount = 0;
      const keysToClearRedis: string[] = [];
      const keysToClearMem: string[] = [];

      for (const articleId of articleIds) {
        const targets = aggregatedData[articleId];
        let totalClicksForArticle = 0;
        const updatePayload: Record<string, unknown> = {};

        for (const [targetType, count] of Object.entries(targets)) {
          totalClicksForArticle += count;
          updatePayload[`clickStats.${targetType}`] = admin.firestore.FieldValue.increment(count);
          keysToClearRedis.push(CacheKeys.magazineClicks(articleId, targetType));
          keysToClearMem.push(`${articleId}:${targetType}`);
        }

        updatePayload["clicksCount"] = admin.firestore.FieldValue.increment(totalClicksForArticle);
        updatePayload["updatedAt"] = admin.firestore.FieldValue.serverTimestamp();

        const ref = db.collection("articles").doc(articleId);
        batch.set(ref, updatePayload, { merge: true });
        batchCount++;

        // Commit every 400 records to prevent Firestore limit errors
        if (batchCount >= 400) {
          await batch.commit();
          this.logger.info(`Committed middle batch of CTR clicks. Size: ${batchCount}`);
          batchCount = 0;
        }
      }

      if (batchCount > 0) {
        await batch.commit();
        this.logger.info(`Committed terminal batch of CTR clicks. Size: ${batchCount}`);
      }

      // 4. Cleanup Redis after success
      if (redis && keysToClearRedis.length > 0) {
        const pipeline = redis.pipeline();
        for (const k of keysToClearRedis) {
          pipeline.del(k);
        }
        await pipeline.exec();
      }

      // 5. Cleanup Local Memory
      for (const k of keysToClearMem) {
        this.localClicksMap.delete(k);
      }

      this.logger.info(`Successfully flushed click events.`);
    } catch (err) {
      this.logger.error("CTR clicks batch flush encountered errors", err);
    } finally {
      if (lockId) {
        await LockManager.release(lockKey, lockId);
      }
    }
  }

  /**
   * Helper to fetch consolidated conversion analytics for all/specific articles
   * Returns: article meta + reads / clicks count
   */
  static async getConversionReport(): Promise<Array<{
    id: string;
    title: string;
    viewsCount: number;
    clicksCount: number;
    ctr: number;
    clickStats: Record<string, number>;
  }>> {
    try {
      const snapshot = await db.collection("articles")
        .select("title", "viewsCount", "clicksCount", "clickStats", "viewCount", "views")
        .get();

      const report = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Handle all format legacy and current fields for views safely
        const viewsCount = Math.max(
          data.viewsCount || 0,
          data.viewCount || 0,
          data.views || 0
        );
        const clicksCount = data.clicksCount || 0;
        const ctr = viewsCount > 0 ? Number(((clicksCount / viewsCount) * 100).toFixed(2)) : 0;
        
        return {
          id: doc.id,
          title: data.title || "Untitled Article",
          viewsCount,
          clicksCount,
          ctr,
          clickStats: data.clickStats || {}
        };
      });

      // Sort by CTR descending for administrative decision value
      return report.sort((a, b) => b.ctr - a.ctr);
    } catch (err) {
      this.logger.error("Failed to generate conversion analytics metrics report", err);
      return [];
    }
  }
}
