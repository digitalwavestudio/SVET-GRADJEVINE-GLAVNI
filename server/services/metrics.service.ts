// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { CacheService } from "./cache.service.ts";
import { ViewStatsService } from "./viewStatsService.ts";
import { CACHE_PREFIXES, CacheKeys } from "../constants/cache-keys.ts";
import { logger, Logger } from "../utils/logger.ts";

const REDIS_KEY_PENDING = CACHE_PREFIXES.METRICS_VIEW_BUFFER;
const REDIS_KEY_USER_STATS = CACHE_PREFIXES.METRICS_USER_STATS;
const REDIS_KEY_DAILY_STATS = CACHE_PREFIXES.METRICS_DAILY_STATS;
const REDIS_KEY_PENDING_FAVS_AD = CACHE_PREFIXES.METRICS_FAVS_AD;
const REDIS_KEY_PENDING_FAVS_USER = CACHE_PREFIXES.METRICS_FAVS_USER;
const REDIS_KEY_BOT_HITS = CACHE_PREFIXES.METRICS_BOT_HITS;
const REDIS_KEY_BOT_PATHS = CACHE_PREFIXES.METRICS_BOT_PATHS;
const REDIS_PREFIX_CACHE = CACHE_PREFIXES.METRICS_VIEW_CACHE;
const FLUSH_DELAY_MS = env.NODE_ENV === "production" ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000; // 2h in production, 4h in sandbox/dev

export type MetricType = "view" | "click" | "inquiry";
export type MetricSource = "internal" | "external" | "direct";

export class MetricsService {
  private static redis = getRedis();

  /**
   * Records a metric event (view, click, inquiry) with source attribution
   */
  static async bulkRecordEvents(
    events: any[],
    ipStr: string,
  ): Promise<{ success: boolean; processed: number }> {
    if (!this.redis) return { success: false, processed: 0 };
    try {
      const pipeline = this.redis.pipeline();
      let processed = 0;
      const today = new Date().toISOString().split("T")[0];

      // Local tracking for throttling
      const throttledKeys = new Set<string>();

      for (const event of events) {
        if (!event.type || !event.collectionName || !event.targetId) continue;

        const { type, collectionName, targetId, authorId, source } = event;

        if (type === "view") {
          const viewKey = CacheKeys.viewThrottling(ipStr, collectionName, targetId);
          if (throttledKeys.has(viewKey)) continue;

          // We will let the pipeline do the throttling checks, but to be 100% accurate we would need a multi or separate get.
          // PROMPT 7: In-memory baferisanje umesto Redis I/O
          ViewStatsService.incrementView(collectionName, targetId).catch((e: any) => logger.warn("[MetricsService] Increment view stats:", e));
          
          if (authorId) pipeline.hincrby(REDIS_KEY_USER_STATS, authorId, 1);

          // We queue a set command as well to throttle future ones
          pipeline.set(viewKey, "1", "EX", 3600);
          throttledKeys.add(viewKey);
        }

        const dailySubKey = `${today}:${authorId || "anonymous"}:${targetId}:${type}:${source || "direct"}`;
        pipeline.hincrby(REDIS_KEY_DAILY_STATS, dailySubKey, 1);

        processed++;
      }

      if (processed > 0) {
        await pipeline.exec();
      }
      return { success: true, processed };
    } catch (err) {
      console.error("[MetricsService] Bulk record error:", err);
      return { success: false, processed: 0 };
    }
  }

  static async recordEvent(
    type: MetricType,
    collectionName: string,
    targetId: string,
    authorId?: string,
    ipStr?: string,
    source: MetricSource = "direct",
  ): Promise<{ success: boolean; buffered: boolean; message?: string }> {
    // Throttle views by IP per hour
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

        // We still need to call ViewStatsService since it has its own in-memory fallback mechanism, but it delegates its Redis hit.
        // Wait, ViewStatsService.incrementView does a separate REDIS call (hincrby). To truly pipeline, we can just do it here:
        if (type === "view") {
          // PROMPT 7: Koristimo in-memory baferisanje iz ViewStatsService umesto Redis-a da bi smanjili I/O
          ViewStatsService.incrementView(collectionName, targetId).catch((e: any) => logger.warn("[MetricsService] Increment view stats in pipeline:", e));
          
          if (authorId) {
            pipeline.hincrby(REDIS_KEY_USER_STATS, authorId, 1);
          }
        }

        const dailySubKey = `${today}:${authorId || "anonymous"}:${targetId}:${type}:${source}`;
        pipeline.hincrby(REDIS_KEY_DAILY_STATS, dailySubKey, 1);

        await pipeline.exec();

        return { success: true, buffered: true };
      } catch (err) {
        console.error("[MetricsService] Redis error:", err);
      }
    }

    return { success: false, buffered: false };
  }

  static async recordView(
    collectionName: string,
    targetId: string,
    ipStr: string,
    authorId?: string,
  ): Promise<{ success: boolean; buffered: boolean; message?: string }> {
    return this.recordEvent("view", collectionName, targetId, authorId, ipStr);
  }

  static async recordFavoriteToggle(
    adId: string,
    likerId: string,
    increment: number,
  ): Promise<void> {
    if (this.redis) {
      try {
        const rounded = Math.round(increment);
        const safeIncrement = isNaN(rounded) || !isFinite(rounded) ? 1 : rounded;

        const pipeline = this.redis.pipeline();
        pipeline.hincrby(REDIS_KEY_PENDING_FAVS_AD, adId, safeIncrement);
        pipeline.hincrby(REDIS_KEY_PENDING_FAVS_USER, likerId, safeIncrement);
        await pipeline.exec();
      } catch (err: any) {
        console.error(
          "[MetricsService] Redis recordFavoriteToggle error:",
          err,
        );
      }
    } else {
      // Fallback if no redis? We will handle fallback in UnifiedFavoritesService if buffered is false or we can just do direct.
      // But let's keep it simple.
    }
  }

  static async recordBotTelemetry(
    botType: string,
    botName: string,
    path: string,
    status: number,
    durationMs: number
  ): Promise<void> {
    if (this.redis) {
      try {
        const rounded = Math.round(durationMs);
        const safeDuration = isNaN(rounded) || !isFinite(rounded) ? 0 : rounded;

        const pipeline = this.redis.pipeline();
        
        // General Hits
        pipeline.hincrby(REDIS_KEY_BOT_HITS, `total:${botType}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_HITS, `bot:${botName}`, 1);
        
        // Paths & Status 
        const dateKey = new Date().toISOString().split("T")[0];
        const safePath = path.replace(/\//g, "_").substring(0, 50);
        
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:path:${safePath}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:status:${status}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:duration`, safeDuration);
        
        if (status === 404 || status === 410) {
            const longSafePath = path.replace(/\//g, "_").substring(0, 100);
            pipeline.hincrby(REDIS_KEY_BOT_PATHS, `telemetry_404:${longSafePath}`, 1);
        }
        
        await pipeline.exec();
      } catch (err) {
        console.error("[MetricsService] Redis recordBotTelemetry error:", err);
      }
    }
  }

  static async flushMetrics() {
    if (!this.redis) return;

    const lockKey = "lock:metrics_flush";
    const lockId = await LockManager.acquire(lockKey, 55000); // Wait longer for lock
    if (!lockId) return;

    try {
      const [
        allPending,
        pendingUserStats,
        pendingDaily,
        pendingFavsAd,
        pendingFavsUser,
        pendingBotHits,
        pendingBotPaths,
      ] = await Promise.all([
        this.redis.hgetall(REDIS_KEY_PENDING),
        this.redis.hgetall(REDIS_KEY_USER_STATS),
        this.redis.hgetall(REDIS_KEY_DAILY_STATS),
        this.redis.hgetall(REDIS_KEY_PENDING_FAVS_AD),
        this.redis.hgetall(REDIS_KEY_PENDING_FAVS_USER),
        this.redis.hgetall(REDIS_KEY_BOT_HITS),
        this.redis.hgetall(REDIS_KEY_BOT_PATHS),
      ]);

      const entries = Object.entries(allPending || {});
      const userEntries = Object.entries(pendingUserStats || {});
      const dailyEntries = Object.entries(pendingDaily || {});
      const favsAdEntries = Object.entries(pendingFavsAd || {});
      const favsUserEntries = Object.entries(pendingFavsUser || {});
      const botHitsEntries = Object.entries(pendingBotHits || {});
      const botPathsEntries = Object.entries(pendingBotPaths || {});

      if (
        entries.length === 0 &&
        userEntries.length === 0 &&
        dailyEntries.length === 0 &&
        favsAdEntries.length === 0 &&
        favsUserEntries.length === 0 &&
        botHitsEntries.length === 0 &&
        botPathsEntries.length === 0
      )
        return;

      const processInChunks = async (items: any[], redisKey: string, processor: (batch: import("firebase-admin/firestore").WriteBatch, key: string, count: number) => void, onSuccess?: (keys: string[]) => void) => {
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
              console.error(`[MetricsService] DLQ Tolerance: Bulk write failed for chunk in ${redisKey}, skipping to next. Error:`, chunkErr);
            }
          }
        }
      };

      await processInChunks(entries, REDIS_KEY_PENDING, (batch: import("firebase-admin/firestore").WriteBatch, key: string, count: number) => {
        const [collectionName, targetId] = key.split(":");
        const docRef = db.collection(collectionName).doc(targetId);
        batch.set(docRef, { viewsCount: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
      });

      await processInChunks(userEntries, REDIS_KEY_USER_STATS, (batch: import("firebase-admin/firestore").WriteBatch, userId: string, count: number) => {
        const userStatsRef = db.collection("user_stats").doc(userId);
        batch.set(userStatsRef, {
            totalViews: firebaseAdmin.firestore.FieldValue.increment(count),
            lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }, async (keys: string[]) => {
         await Promise.all(keys.map(uid => CacheService.invalidateByPrefix(CACHE_PREFIXES.METRICS_USER_ANALYTICS + uid))).catch(e => console.error(e));
      });

      await processInChunks(dailyEntries, REDIS_KEY_DAILY_STATS, (batch: import("firebase-admin/firestore").WriteBatch, key: string, count: number) => {
        const parts = key.split(":");
        const [date, userId, adId, type] = parts;
        const source = parts[4] || "direct";
        const dailyRef = db.collection("metrics_daily").doc(`${adId}_${date}`);
        const updates = {
          adId, userId, date,
          [`${type}s`]: firebaseAdmin.firestore.FieldValue.increment(count),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        };
        if (source !== "direct") {
          updates[`${type}s_${source}`] = firebaseAdmin.firestore.FieldValue.increment(count);
        } else {
          updates[`${type}s_direct`] = firebaseAdmin.firestore.FieldValue.increment(count);
        }
        batch.set(dailyRef, updates, { merge: true });
      }, async (keys: string[]) => {
          const dailyUsers = [...new Set(keys.map(k => k.split(":")[1]))].filter(Boolean);
          await Promise.all(dailyUsers.map(uid => CacheService.invalidateByPrefix(CACHE_PREFIXES.METRICS_USER_ANALYTICS + uid))).catch(e => console.error(e));
      });

      await processInChunks(favsAdEntries, REDIS_KEY_PENDING_FAVS_AD, (batch: import("firebase-admin/firestore").WriteBatch, adId: string, count: number) => {
          const adRef = db.collection("listings").doc(adId);
          batch.set(adRef, {
              favoritesCount: firebaseAdmin.firestore.FieldValue.increment(count),
              updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
      });

      await processInChunks(favsUserEntries, REDIS_KEY_PENDING_FAVS_USER, (batch: import("firebase-admin/firestore").WriteBatch, userId: string, count: number) => {
          const userStatsRef = db.collection("user_stats").doc(userId);
          batch.set(userStatsRef, {
              favoritesCount: firebaseAdmin.firestore.FieldValue.increment(count),
              lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
      });

      await processInChunks(botHitsEntries, REDIS_KEY_BOT_HITS, (batch: import("firebase-admin/firestore").WriteBatch, key: string, count: number) => {
          const docRef = db.collection("statistics").doc("bot_analytics");
          batch.set(docRef, { [key]: firebaseAdmin.firestore.FieldValue.increment(count), lastSeen: firebaseAdmin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      });

      await processInChunks(botPathsEntries, REDIS_KEY_BOT_PATHS, (batch: import("firebase-admin/firestore").WriteBatch, key: string, count: number) => {
          // Key format: dateKey:botName:path_or_status:value OR telemetry_404:path
          const parts = key.split(":");
          
          if (parts[0] === "telemetry_404") {
              const val = parts.slice(1).join(":"); // path
              const docRef = db.collection("statistics").doc("bot_404_telemetry");
              batch.set(docRef, { [`paths.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count), lastHit: firebaseAdmin.firestore.FieldValue.serverTimestamp() }, { merge: true });
              return;
          }

          const dateKey = parts[0];
          const botName = parts[1];
          const type = parts[2]; 
          const val = parts.slice(3).join(":"); // handles paths with colons if any

          const dailyRef = db.collection("statistics").doc("bot_analytics").collection("daily").doc(dateKey);
          
          if (type === "path") {
              batch.set(dailyRef, { [`paths.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count), [botName]: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
          } else if (type === "status") {
              batch.set(dailyRef, { [`status_codes.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
          } else if (type === "duration") {
              batch.set(dailyRef, { totalDurationMs: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
          }
      });

      logger.debug(`[MetricsService] Flushed metrics fully via chunks`);
    } catch (err) {
      console.error("[MetricsService] Flush failed:", err);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  private static flushInterval: NodeJS.Timeout;

  static init() {
    if (env.NODE_ENV === "production") {
      if (!this.flushInterval) {
        this.flushInterval = setInterval(
          () => this.flushMetrics(),
          FLUSH_DELAY_MS,
        );
      }
    }
  }

  static async gracefulShutdown() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    await this.flushMetrics();
  }

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

      if (!statsMap[date]) {
        statsMap[date] = {
          views: 0,
          views_internal: 0,
          views_external: 0,
          views_direct: 0,
          clicks: 0,
          clicks_internal: 0,
          clicks_external: 0,
          clicks_direct: 0,
          inquiries: 0,
        };
      }
      statsMap[date][`${type}s`] = (statsMap[date][`${type}s`] || 0) + count;
      const source = parts[4] || "direct";
      const sourceKey = `${type}s_${source}`;
      statsMap[date][sourceKey] = (statsMap[date][sourceKey] || 0) + count;
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
          // Bounded timeout for analytics fetching to prevent UI hangs!
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
            if (!statsMap[date])
              statsMap[date] = {
                date,
                views: 0,
                views_internal: 0,
                views_external: 0,
                views_direct: 0,
                clicks: 0,
                clicks_internal: 0,
                clicks_external: 0,
                clicks_direct: 0,
                inquiries: 0,
              };

            statsMap[date].views += data.views || 0;
            statsMap[date].views_internal += data.views_internal || 0;
            statsMap[date].views_external += data.views_external || 0;
            statsMap[date].views_direct += data.views_direct || 0;

            statsMap[date].clicks += data.clicks || 0;
            statsMap[date].clicks_internal += data.clicks_internal || 0;
            statsMap[date].clicks_external += data.clicks_external || 0;
            statsMap[date].clicks_direct += data.clicks_direct || 0;

            statsMap[date].inquiries += data.inquiries || 0;
          });

          const result = [];
          const current = new Date(startDate);
          const today = new Date();
          
          if (isNaN(current.getTime()) || isNaN(today.getTime())) return [];
          let safetyCounter = 0;

          while (current <= today && safetyCounter < 500) {
            const dStr = current.toISOString().split("T")[0];
            result.push(
              statsMap[dStr] || {
                date: dStr,
                views: 0,
                views_internal: 0,
                views_external: 0,
                views_direct: 0,
                clicks: 0,
                clicks_internal: 0,
                clicks_external: 0,
                clicks_direct: 0,
                inquiries: 0,
              },
            );
            current.setUTCDate(current.getUTCDate() + 1);
            safetyCounter++;
          }
          return result;
        } catch (error) {
          logger.warn("[METRICS] Failed to fetch analytics (quota?):", error);
          return []; // Return empty array as fallback
        }
      },
      300000
    ); // 5 min TTL

    const pendingStats = await this.getPendingDailyStats(userId, undefined);
    if (Object.keys(pendingStats).length === 0) return baseStats || [];

    return (baseStats || []).map((item: any) => {
      const p = pendingStats[item.date];
      if (p) {
        return {
          ...item,
          views: (item.views || 0) + (p.views || 0),
          views_internal: (item.views_internal || 0) + (p.views_internal || 0),
          views_external: (item.views_external || 0) + (p.views_external || 0),
          views_direct: (item.views_direct || 0) + (p.views_direct || 0),
          clicks: (item.clicks || 0) + (p.clicks || 0),
          clicks_internal: (item.clicks_internal || 0) + (p.clicks_internal || 0),
          clicks_external: (item.clicks_external || 0) + (p.clicks_external || 0),
          clicks_direct: (item.clicks_direct || 0) + (p.clicks_direct || 0),
          inquiries: (item.inquiries || 0) + (p.inquiries || 0)
        };
      }
      return item;
    });
  }
}
