import { env } from "../config/env.ts";
import { db } from "../config/firebase.ts";
import { TraceContext } from "../utils/trace.ts";
import { CacheService } from "./cache.service.ts";
import { getRedis, getSubRedis, isClusterOffline } from "../utils/redis.ts";
import { MetricsService } from "./metrics.service.ts";
import { CacheKeys } from "../constants/cache-keys.ts";
import * as admin from "firebase-admin";
import { logger } from "../utils/logger.ts";

// Extracted modules
import { 
  SimpleLRUCache,
  EMPLOYER_STATS_TTL,
  employerStatsMemoryCache,
  smartMatchesMemoryCache,
  employerTrendsMemoryCache
} from "./dashboard/dashboard-lru.ts";

import { getErrorMessage } from "../utils/error-handler.ts";

import { DashboardAdminService } from "./dashboard/dashboard-admin.service.ts";
import { DashboardEmployerService } from "./dashboard/employer-dashboard.service.ts";
import { DashboardSmartMatchService, UserMatchProfile } from "./dashboard/dashboard-matches.service.ts";
import { ApplicationItemDTO } from "../dto/dashboard.dto.ts";

// Proxy re-export for backward compatibility
export { SimpleLRUCache };

const REDIS_EVICTION_CHANNEL = "dashboard_cache_eviction";

import { AuthUser } from "../types/auth.ts";
import { EmployerStats } from "../types/bff.ts";

export class DashboardService {
  private static subRegistered = false;
  private static msgHandler: ((channel: string, message: string) => void) | null = null;

  static async aggregateDashboardData(userId: string, role: string, isAdmin: boolean, reqUser: UserMatchProfile | null = null) {
    try {
      const cached = (await CacheService.get(`bff_cache_tiered:${userId}`)) || 
                     (await CacheService.get(`swr:bff_cache_tiered:${userId}`));
      if (cached) {
        console.info(`⚡ [DashboardService] Instant prewarm fast-path hit! Read consolidated Redis bff_cache_tiered:${userId}.`);
        return cached;
      }
    } catch (cacheErr: unknown) {
      logger.warn(`[DashboardService] Failed to read prewarmed Redis cache for ${userId}:`, getErrorMessage(cacheErr));
    }

    const [statsResult, analyticsResult] = await Promise.allSettled([
      (async () => {
        if (isAdmin) {
          const s = await DashboardService.getAdminStats();
          const chartData = await DashboardService.getChartData();
          return { ...s, chartData };
        }
        if (role === "poslodavac" || role === "COMPANY") {
          return await DashboardService.getEmployerStats(userId);
        }
        if (role === "majstor" || role === "MASTER") {
          const smartMatches = await DashboardService.getSmartMatches(reqUser || { uid: userId, location: "Beograd", profession: "Sve" });
          let recentApplications: ApplicationItemDTO[] = [];
          try {
            const appsSnap = await db
              .collection("applications")
              .where("candidateId", "==", userId)
              .orderBy("createdAt", "desc")
              .limit(5)
              .get();
            recentApplications = appsSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
          } catch (err) {
            logger.warn("[DashboardService] Failed to fetch candidate applications:", err);
          }
          return { smartMatches, recentApplications };
        }
        // Standard users — vrati osnovne podatke
        try {
          const userSnap = await db.collection("users").doc(userId).get();
          const userData = userSnap.data() || {};
          return {
            role,
            walletBalance: userData.walletBalance || 0,
            freeAdsCount: userData.freeAdsCount || 0,
            profileScore: userData.profileScore || 0,
            isPremium: userData.isPremiumProfile || false,
            recentViews: userData.viewsCount || 0,
          };
        } catch (err) {
          logger.warn("[DashboardService] Failed to fetch standard user data:", err);
          return { role };
        }
      })(),
      MetricsService.getUserAnalytics(userId, 30),
    ]);

    if (statsResult.status === "rejected") {
      throw statsResult.reason;
    }
    if (analyticsResult.status === "rejected") {
      throw analyticsResult.reason;
    }

    const stats = statsResult.value;
    const analytics = analyticsResult.value;

    let trends: { name: string; pregledi: number }[] = [];
    if (Array.isArray(analytics)) {
      const startIdx = Math.max(0, analytics.length - 7);
      trends = analytics.reduce((acc: { name: string; pregledi: number }[], item: { date?: string; views?: number }, index: number) => {
        if (index >= startIdx) {
          acc.push({
            name: item.date
              ? new Date(item.date).toLocaleDateString("sr-RS", {
                  day: "2-digit",
                  month: "short",
                })
              : "Unknown",
            pregledi: item.views || 0,
          });
        }
        return acc;
      }, []);
    }

    return {
      success: true,
      stats: {
        ...stats,
        analytics,
      },
      trends,
    };
  }

  static registerPubSubEviction() {
    if (isClusterOffline()) {
      logger.warn("⚠️ [DashboardService] Skipping pub/sub eviction registration because Redis is offline.");
      return;
    }
    if (this.subRegistered) {
      console.info("[DashboardService] Redis eviction pub/sub already registered.");
      return;
    }
    const subRedis = getSubRedis();
    if (subRedis) {
      const isUsable = subRedis.status !== "end" && subRedis.status !== "close";
      if (!isUsable) {
        logger.warn("[DashboardService] Failed to register pub/sub: Redis sub client is in status:", subRedis.status);
        return;
      }

      if (this.msgHandler) {
        try {
          subRedis.off("message", this.msgHandler);
        } catch (e) { console.error("[DashboardService] Message handler unregister error:", e); }
      }

      this.msgHandler = (channel: string, message: string) => {
        if (channel === REDIS_EVICTION_CHANNEL) {
          try {
            if (env.NODE_ENV !== "production") console.info(`[DashboardService Pub/Sub] Cache eviction signal for user: ${message}`);
            this.evictLocalMemoryCache(message);
          } catch (err: unknown) {
            console.error("[DashboardService Pub/Sub] Error handling message:", getErrorMessage(err));
          }
        }
      };

      subRedis.subscribe(REDIS_EVICTION_CHANNEL)
        .then(() => {
          if (env.NODE_ENV !== "production") console.info(`[DashboardService] Subscribed to Redis channel: ${REDIS_EVICTION_CHANNEL}`);
        })
        .catch((err: unknown) => {
          const errMsg = getErrorMessage(err);
          if (errMsg.toLowerCase().includes("offlinequeue") || errMsg.toLowerCase().includes("writeable")) {
            logger.warn("[DashboardService] Pub/sub registracija nije dostupna (Redis je u in-memory modu).");
          } else {
            console.error("[DashboardService] Failed to subscribe to channel:", errMsg);
          }
        });

      subRedis.on("message", this.msgHandler);
      this.subRegistered = true;
    }
  }

  static async gracefulShutdown() {
    console.info("[DashboardService] Shutting down Redis eviction pub/sub gracefully...");
    const subRedis = getSubRedis();
    const isConnected = subRedis && (subRedis.status === "ready" || subRedis.status === "connect");

    if (subRedis) {
      if (this.msgHandler) {
        try {
          if (subRedis.status !== "end") {
            subRedis.off("message", this.msgHandler);
          }
        } catch (e) { console.error("[DashboardService] Message handler cleanup error:", e); }
        this.msgHandler = null;
      }

      try {
        if (isConnected) {
          await subRedis.unsubscribe(REDIS_EVICTION_CHANNEL).catch((e: any) => logger.warn("[DashboardService] Unsubscribe from Redis channel:", e));
          console.info(`[DashboardService] Unsubscribed from channel.`);
        }
      } catch (err: unknown) { /* intentionally empty */ }
    }
    this.subRegistered = false;
  }

  static evictLocalMemoryCache(uid: string) {
    employerStatsMemoryCache.delete(uid);
    smartMatchesMemoryCache.delete(uid);
    employerTrendsMemoryCache.delete(uid);
  }

  static async clearEmployerStatsCache(uid: string) {
    const now = Date.now();
    let cachedStats: EmployerStats | null = null;

    const memoryCached = employerStatsMemoryCache.get(uid);
    if (memoryCached) {
      cachedStats = memoryCached as EmployerStats;
    } else {
      cachedStats = await CacheService.get<EmployerStats>(CacheKeys.employerStats(uid)).catch(() => null);
    }

    if (cachedStats) {
      console.info(`[DashboardService] Performing surgical granular cache update for employer: ${uid}`);
      try {
        const activeListingsSnap = await db.collection("listings")
          .where("authorId", "==", uid)
          .where("status", "==", "active")
          .count()
          .get();
        const activeCount = activeListingsSnap.data().count;

        const latestSnap = await db.collection("listings")
          .where("authorId", "==", uid)
          .where("status", "in", ["active", "paused", "rejected"])
          .orderBy("createdAt", "desc")
          .limit(10)
          .select(
            "title", "price", "location", "type", "status",
            "createdAt", "images", "isPremium", "comp", "salary",
            "logo", "plataMin", "plataMax",
          )
          .get();

        const recentAds = latestSnap.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
          const data = doc.data();
          return {
            id: doc.id,
            collType: data.type,
            ...data,
          } as import("../dto/dashboard.dto.ts").DashboardAdItemDTO;
        });

        cachedStats.totalAds = activeCount;
        cachedStats.recentAds = recentAds;

        const cacheTtl = EMPLOYER_STATS_TTL;
        employerStatsMemoryCache.set(uid, cachedStats);
        await CacheService.set(CacheKeys.employerStats(uid), cachedStats, cacheTtl).catch(err => console.error("[Cache] invalidation error:", err));

        const redis = getRedis();
        if (redis) {
          await redis.publish(REDIS_EVICTION_CHANNEL, uid).catch((err: unknown) => {
            console.error("[DashboardService] Redis publish eviction failed:", getErrorMessage(err));
          });
        }
        return;
      } catch (err: unknown) {
        logger.warn(`[DashboardService] Surgical update failed for user ${uid}. Falling back to clean reset: ${getErrorMessage(err)}`);
      }
    }

    this.evictLocalMemoryCache(uid);
    await db.collection("metadata").doc(`dashboard_prewarm_${uid}`).delete().catch(err => console.error("[Cache] invalidation error:", err));

    const redis = getRedis();
    if (redis) {
      try {
        CacheService.deleteLocal(CacheKeys.employerStats(uid));
        CacheService.deleteLocal(CacheKeys.smartMatches(uid));
        CacheService.deleteLocal(CacheKeys.employerTrends(uid));
        
        const pipeline = redis.pipeline();
        pipeline.del(CacheKeys.employerStats(uid));
        pipeline.del(CacheKeys.smartMatches(uid));
        pipeline.del(CacheKeys.employerTrends(uid));
        pipeline.publish(REDIS_EVICTION_CHANNEL, uid);
        await pipeline.exec();
      } catch (err: unknown) {
        console.error("[DashboardService] Failed to delete cache from Redis pipeline:", getErrorMessage(err));
        this.evictLocalMemoryCache(uid);
      }
    } else {
      await CacheService.delete(CacheKeys.employerStats(uid)).catch(err => console.error("[Cache] invalidation error:", err));
      await CacheService.delete(CacheKeys.smartMatches(uid)).catch(err => console.error("[Cache] invalidation error:", err));
      await CacheService.delete(CacheKeys.employerTrends(uid)).catch(err => console.error("[Cache] invalidation error:", err));
    }

    this.getEmployerStats(uid).catch((e: any) => logger.warn("[DashboardService] Refresh employer stats:", e));
  }

  // --- Proxied Methods ---

  static async getAdminStats() {
    return DashboardAdminService.getAdminStats();
  }

  static async getChartData() {
    return DashboardAdminService.getChartData();
  }

  static async getHousekeepingStatus() {
    return DashboardAdminService.getHousekeepingStatus();
  }

  static async getEmployerStats(uid: string) {
    return DashboardEmployerService.getEmployerStats(uid);
  }

  static async getEmployerTrends(uid: string) {
    return DashboardEmployerService.getEmployerTrends(uid);
  }

  static async getSmartMatches(user: UserMatchProfile) {
    return DashboardSmartMatchService.getSmartMatches(user);
  }
}
