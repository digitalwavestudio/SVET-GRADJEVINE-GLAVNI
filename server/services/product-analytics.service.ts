import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { CacheService } from "./cache.service.ts";
import { CACHE_PREFIXES, CacheKeys } from "../constants/cache-keys.ts";
import { Logger, logger } from "../utils/logger.ts";

const REDIS_KEY_PENDING_VIEWS = CACHE_PREFIXES.METRICS_VIEW_BUFFER;
const REDIS_KEY_USER_STATS = CACHE_PREFIXES.METRICS_USER_STATS;
const REDIS_KEY_DAILY_STATS = CACHE_PREFIXES.METRICS_DAILY_STATS;
const REDIS_KEY_PENDING_FAVS_AD = CACHE_PREFIXES.METRICS_FAVS_AD;
const REDIS_KEY_PENDING_FAVS_USER = CACHE_PREFIXES.METRICS_FAVS_USER;
const REDIS_PREFIX_CACHE = CACHE_PREFIXES.METRICS_VIEW_CACHE;
const FLUSH_DELAY_MS = env.NODE_ENV === "production" ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;

export type MetricType = "view" | "click" | "inquiry";
export type MetricSource = "internal" | "external" | "direct";

export class ProductAnalyticsService {
  private static redis = getRedis();
  private static viewFlushTimer: NodeJS.Timeout | null = null;
  private static metricsFlushTimer: NodeJS.Timeout | null = null;
  private static localFallbackMap = new Map<string, number>();

  // ── View buffering ────────────────────────────────────

  static async incrementView(collectionName: string, docId: string) {
    if (!collectionName || !docId) return;
    const key = `${collectionName}:${docId}`;
    try {
      if (this.redis) {
        await this.redis.hincrby(REDIS_KEY_PENDING_VIEWS, key, 1);
        return;
      }
    } catch (err) {
      console.error("[ProductAnalytics] Redis hincrby failed, falling back to local:", err);
    }
    const current = this.localFallbackMap.get(key) || 0;
    this.localFallbackMap.set(key, current + 1);
  }

  // ── Event recording ───────────────────────────────────

  static async recordEvent(
    type: MetricType,
    collectionName: string,
    targetId: string,
    authorId?: string,
    ipStr?: string,
    source: MetricSource = "direct",
  ) {
    if (type === "view" && ipStr && this.redis) {
      const viewKey = CacheKeys.viewThrottling(ipStr, collectionName, targetId);
      const alreadyViewed = await this.redis.get(viewKey);
      if (alreadyViewed) {
        return { success: true, buffered: false, message: "already_counted" };
      }
    }

    if (this.redis) {
      try {
        const pipeline = this.redis.pipeline();
        const today = new Date().toISOString().split("T")[0];

        if (type === "view" && ipStr) {
          const viewKey = CacheKeys.viewThrottling(ipStr, collectionName, targetId);
          pipeline.set(viewKey, "1", "EX", 3600);
        }

        if (type === "view") {
          this.incrementView(collectionName, targetId).catch((e: any) => logger.warn("[ProductAnalytics] Increment view:", e));
          if (authorId) {
            pipeline.hincrby(REDIS_KEY_USER_STATS, authorId, 1);
          }
        }

        const dailySubKey = `${today}:${authorId || "anonymous"}:${targetId}:${type}:${source}`;
        pipeline.hincrby(REDIS_KEY_DAILY_STATS, dailySubKey, 1);

        await pipeline.exec();
        return { success: true, buffered: true };
      } catch (err) {
        console.error("[ProductAnalytics] Redis error:", err);
      }
    }

    return { success: false, buffered: false };
  }

  static async recordView(
    collectionName: string,
    targetId: string,
    ipStr: string,
    authorId?: string,
  ) {
    return this.recordEvent("view", collectionName, targetId, authorId, ipStr);
  }

  static async bulkRecordEvents(events: any[], ipStr: string) {
    if (!this.redis) return { success: false, processed: 0 };
    try {
      const pipeline = this.redis.pipeline();
      let processed = 0;
      const today = new Date().toISOString().split("T")[0];
      const throttledKeys = new Set<string>();

      for (const event of events) {
        if (!event.type || !event.collectionName || !event.targetId) continue;
        const { type, collectionName, targetId, authorId, source } = event;

        if (type === "view") {
          const viewKey = CacheKeys.viewThrottling(ipStr, collectionName, targetId);
          if (throttledKeys.has(viewKey)) continue;
          this.incrementView(collectionName, targetId).catch((e: any) => logger.warn("[ProductAnalytics] Increment view:", e));
          if (authorId) pipeline.hincrby(REDIS_KEY_USER_STATS, authorId, 1);
          pipeline.set(viewKey, "1", "EX", 3600);
          throttledKeys.add(viewKey);
        }

        const dailySubKey = `${today}:${authorId || "anonymous"}:${targetId}:${type}:${source || "direct"}`;
        pipeline.hincrby(REDIS_KEY_DAILY_STATS, dailySubKey, 1);
        processed++;
      }

      if (processed > 0) await pipeline.exec();
      return { success: true, processed };
    } catch (err) {
      console.error("[ProductAnalytics] Bulk record error:", err);
      return { success: false, processed: 0 };
    }
  }

  static async recordFavoriteToggle(adId: string, likerId: string, increment: number) {
    if (this.redis) {
      try {
        const rounded = Math.round(increment);
        const safeIncrement = isNaN(rounded) || !isFinite(rounded) ? 1 : rounded;
        const pipeline = this.redis.pipeline();
        pipeline.hincrby(REDIS_KEY_PENDING_FAVS_AD, adId, safeIncrement);
        pipeline.hincrby(REDIS_KEY_PENDING_FAVS_USER, likerId, safeIncrement);
        await pipeline.exec();
      } catch (err: any) {
        console.error("[ProductAnalytics] recordFavoriteToggle error:", err);
      }
    }
  }

  // ── Flush views to Firestore ──────────────────────────

  static async flushViews() {
    const redisClient = this.redis;
    const viewsToFlush: Record<string, string> = {};

    const lockKey = "lock:view_stats_flush_cron";
    const lockId = await LockManager.acquire(lockKey, 50000);
    if (!lockId) return;

    try {
      if (redisClient) {
        try {
          const redisStats = await redisClient.hgetall(REDIS_KEY_PENDING_VIEWS);
          if (redisStats) Object.assign(viewsToFlush, redisStats);
        } catch (err) {
          console.error("[ProductAnalytics] Error hgetall pending views:", err);
        }
      }

      const localSnapshot = new Map<string, number>();
      for (const [key, count] of this.localFallbackMap.entries()) {
        localSnapshot.set(key, count);
        const currentVal = parseInt(viewsToFlush[key] || "0", 10);
        viewsToFlush[key] = String(currentVal + count);
      }

      const entries = Object.entries(viewsToFlush);
      if (entries.length === 0) return;

      const chunkSize = 400;
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        let countInBatch = 0;
        const processedKeys: string[] = [];

        for (const [key, countStr] of chunk) {
          const count = parseInt(countStr, 10);
          if (isNaN(count) || count <= 0) continue;
          const [collectionName, docId] = key.split(":");
          if (!collectionName || !docId) continue;

          batch.set(
            db.collection(collectionName).doc(docId),
            { viewsCount: firebaseAdmin.firestore.FieldValue.increment(count) },
            { merge: true }
          );
          processedKeys.push(key);
          countInBatch++;
        }

        if (countInBatch > 0) {
          await batch.commit();
          if (redisClient && processedKeys.length > 0) {
            await redisClient.hdel(REDIS_KEY_PENDING_VIEWS, ...processedKeys).catch(() => {});
          }
          for (const key of processedKeys) {
            const snapCount = localSnapshot.get(key) || 0;
            if (snapCount > 0) {
              const current = this.localFallbackMap.get(key) || 0;
              const diff = current - snapCount;
              if (diff <= 0) this.localFallbackMap.delete(key);
              else this.localFallbackMap.set(key, diff);
            }
          }
        }
      }
    } catch (err) {
      console.error("[ProductAnalytics] Flush views failed:", err);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  // ── Flush metrics (daily/user/favorites) to Firestore ─

  static async flushMetrics() {
    if (!this.redis) return;

    const lockKey = "lock:metrics_flush";
    const lockId = await LockManager.acquire(lockKey, 55000);
    if (!lockId) return;

    try {
      const [pendingUserStats, pendingDaily, pendingFavsAd, pendingFavsUser] = await Promise.all([
        this.redis.hgetall(REDIS_KEY_USER_STATS),
        this.redis.hgetall(REDIS_KEY_DAILY_STATS),
        this.redis.hgetall(REDIS_KEY_PENDING_FAVS_AD),
        this.redis.hgetall(REDIS_KEY_PENDING_FAVS_USER),
      ]);

      const userEntries = Object.entries(pendingUserStats || {});
      const dailyEntries = Object.entries(pendingDaily || {});
      const favsAdEntries = Object.entries(pendingFavsAd || {});
      const favsUserEntries = Object.entries(pendingFavsUser || {});

      if (userEntries.length === 0 && dailyEntries.length === 0 && favsAdEntries.length === 0 && favsUserEntries.length === 0) return;

      const processInChunks = async (items: any[], redisKey: string, processor: (batch: any, key: string, count: number) => void, onSuccess?: (keys: string[]) => void) => {
        if (!items || items.length === 0) return;
        const chunkSize = 400;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const batch = db.batch();
          const processedKeys: string[] = [];
          for (const [key, countStr] of chunk) {
            const count = parseInt(countStr as string, 10);
            if (isNaN(count) || count === 0) continue;
            processor(batch, key, count);
            processedKeys.push(key as string);
          }
          if (processedKeys.length > 0) {
            try {
              await batch.commit();
              await this.redis!.hdel(redisKey, ...processedKeys);
              if (onSuccess) await onSuccess(processedKeys);
            } catch (chunkErr) {
              console.error("[ProductAnalytics] Flush chunk failed:", chunkErr);
            }
          }
        }
      };

      await processInChunks(userEntries, REDIS_KEY_USER_STATS, (batch: any, userId: string, count: number) => {
        batch.set(db.collection("user_stats").doc(userId), {
          totalViews: firebaseAdmin.firestore.FieldValue.increment(count),
          lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }, async (keys: string[]) => {
        await Promise.all(keys.map((uid: string) => CacheService.invalidateByPrefix(CACHE_PREFIXES.METRICS_USER_ANALYTICS + uid))).catch(() => {});
      });

      await processInChunks(dailyEntries, REDIS_KEY_DAILY_STATS, (batch: any, key: string, count: number) => {
        const parts = key.split(":");
        const [date, userId, adId, type] = parts;
        const source = parts[4] || "direct";
        const dailyRef = db.collection("metrics_daily").doc(`${adId}_${date}`);
        const updates: any = {
          adId, userId, date,
          [`${type}s`]: firebaseAdmin.firestore.FieldValue.increment(count),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        };
        updates[`${type}s_${source}`] = firebaseAdmin.firestore.FieldValue.increment(count);
        batch.set(dailyRef, updates, { merge: true });
      }, async (keys: string[]) => {
        const dailyUsers = [...new Set(keys.map((k: string) => k.split(":")[1]))].filter(Boolean);
        await Promise.all(dailyUsers.map((uid: string) => CacheService.invalidateByPrefix(CACHE_PREFIXES.METRICS_USER_ANALYTICS + uid))).catch(() => {});
      });

      await processInChunks(favsAdEntries, REDIS_KEY_PENDING_FAVS_AD, (batch: any, adId: string, count: number) => {
        batch.set(db.collection("listings").doc(adId), {
          favoritesCount: firebaseAdmin.firestore.FieldValue.increment(count),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await processInChunks(favsUserEntries, REDIS_KEY_PENDING_FAVS_USER, (batch: any, userId: string, count: number) => {
        batch.set(db.collection("user_stats").doc(userId), {
          favoritesCount: firebaseAdmin.firestore.FieldValue.increment(count),
          lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });
    } catch (err) {
      console.error("[ProductAnalytics] Flush metrics failed:", err);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  // ── Analytics queries ─────────────────────────────────

  static async getPendingDailyStats(userId?: string, adId?: string) {
    if (!this.redis) return {};
    const pendingDaily = await this.redis.hgetall(REDIS_KEY_DAILY_STATS);
    const statsMap: Record<string, any> = {};
    if (!pendingDaily) return statsMap;

    for (const [key, countStr] of Object.entries(pendingDaily)) {
      const count = parseInt(countStr as string, 10);
      if (isNaN(count) || count === 0) continue;
      const parts = key.split(":");
      const [date, uId, aId, type] = parts;
      if (userId && uId !== userId) continue;
      if (adId && aId !== adId) continue;
      if (!statsMap[date]) statsMap[date] = { views: 0, clicks: 0, inquiries: 0 };
      statsMap[date][`${type}s`] = (statsMap[date][`${type}s`] || 0) + count;
    }
    return statsMap;
  }

  static async getUserAnalytics(userId: string, days: number = 30) {
    const cacheKey = CacheKeys.userAnalytics(userId, days);

    const baseStats = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split("T")[0];

        try {
          const timeoutPromise = new Promise<unknown>((_, reject) => {
            setTimeout(() => reject(new Error("METRICS_FIRESTORE_TIMEOUT")), 8000);
          });
          const queryPromise = db
            .collection("metrics_daily")
            .where("userId", "==", userId)
            .where("date", ">=", startDateStr)
            .orderBy("date", "asc")
            .limit(365)
            .get();

          const snapshot = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
          const statsMap: Record<string, any> = {};

          snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            const date = data.date;
            if (!statsMap[date]) statsMap[date] = { date, views: 0, views_internal: 0, views_external: 0, clicks: 0, clicks_internal: 0, clicks_external: 0, inquiries: 0 };
            statsMap[date].views += data.views || 0;
            statsMap[date].views_internal += data.views_internal || 0;
            statsMap[date].views_external += data.views_external || 0;
            statsMap[date].clicks += data.clicks || 0;
            statsMap[date].clicks_internal += data.clicks_internal || 0;
            statsMap[date].clicks_external += data.clicks_external || 0;
            statsMap[date].inquiries += data.inquiries || 0;
          });

          const result: any[] = [];
          const current = new Date(startDate);
          const today = new Date();
          if (isNaN(current.getTime()) || isNaN(today.getTime())) return [];
          let safetyCounter = 0;

          while (current <= today && safetyCounter < 500) {
            const dStr = current.toISOString().split("T")[0];
            result.push(statsMap[dStr] || { date: dStr, views: 0, views_internal: 0, views_external: 0, clicks: 0, clicks_internal: 0, clicks_external: 0, inquiries: 0 });
            current.setUTCDate(current.getUTCDate() + 1);
            safetyCounter++;
          }
          return result;
        } catch (error) {
          logger.warn("[METRICS] Failed to fetch analytics:", error);
          return [];
        }
      },
      300000
    );

    const pendingStats = await this.getPendingDailyStats(userId, undefined);
    if (Object.keys(pendingStats).length === 0) return baseStats || [];

    return (baseStats || []).map((item: any) => {
      const p = pendingStats[item.date];
      if (p) {
        return {
          ...item,
          views: (item.views || 0) + (p.views || 0),
          clicks: (item.clicks || 0) + (p.clicks || 0),
          inquiries: (item.inquiries || 0) + (p.inquiries || 0)
        };
      }
      return item;
    });
  }

  static async getAdViewTrend(adId: string, days: number = 7) {
    const cacheKey = `analytics_trend:${adId}:${days}`;

    const snapData = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split("T")[0];

        const snap = await db
          .collection("metrics_daily")
          .where("adId", "==", adId)
          .where("date", ">=", startDateStr)
          .orderBy("date", "asc")
          .limit(365)
          .get();

        const fetchedStats: Record<string, number> = {};
        snap.docs.forEach((doc) => {
          const data = doc.data();
          fetchedStats[data.date] = data.views || 0;
        });
        return fetchedStats;
      },
      300000
    );

    const stats: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const cd = new Date();
      cd.setDate(cd.getDate() - i);
      const dateStr = cd.toISOString().split("T")[0];
      stats[dateStr] = (snapData && snapData[dateStr]) || 0;
    }

    const pendingStats = await this.getPendingDailyStats(undefined, adId);
    Object.keys(pendingStats).forEach((date) => {
      if (stats[date] !== undefined) stats[date] += (pendingStats[date].views || 0);
    });

    return Object.entries(stats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getUserTotalTrends(userId: string, days: number = 7) {
    const result = await this.getUserAnalytics(userId, days);
    return result.map((item: any) => ({ date: item.date, count: item.views }));
  }

  // ── Lifecycle ─────────────────────────────────────────

  static init() {
    if (env.NODE_ENV === "production") {
      if (!this.viewFlushTimer) {
        this.viewFlushTimer = setInterval(() => this.flushViews(), FLUSH_DELAY_MS);
      }
      if (!this.metricsFlushTimer) {
        this.metricsFlushTimer = setInterval(() => this.flushMetrics(), FLUSH_DELAY_MS);
      }
    }
  }

  static async shutdown() {
    if (this.viewFlushTimer) {
      clearInterval(this.viewFlushTimer);
      this.viewFlushTimer = null;
    }
    if (this.metricsFlushTimer) {
      clearInterval(this.metricsFlushTimer);
      this.metricsFlushTimer = null;
    }
    await this.flushViews();
    await this.flushMetrics();
  }
}
