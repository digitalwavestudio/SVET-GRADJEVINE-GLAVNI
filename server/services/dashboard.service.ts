// @ts-nocheck
import { db } from "../config/firebase.ts";
import { TraceContext } from "../utils/trace.ts";
import { CacheService } from "./cache.service.ts";
import { getRedis, getSubRedis, isClusterOffline } from "../utils/redis.ts";
import { MetricsService } from "./metrics.service.ts";
import { CacheKeys } from "../constants/cache-keys.ts";
import * as admin from "firebase-admin";

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
        console.log(`⚡ [DashboardService] Instant prewarm fast-path hit! Read consolidated Redis bff_cache_tiered:${userId}.`);
        return cached;
      }
    } catch (cacheErr: unknown) {
      console.warn(`[DashboardService] Failed to read prewarmed Redis cache for ${userId}:`, getErrorMessage(cacheErr));
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
          return { smartMatches };
        }
        return { role };
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
      console.warn("⚠️ [DashboardService] Skipping pub/sub eviction registration because Redis is offline.");
      return;
    }
    if (this.subRegistered) {
      console.log("[DashboardService] Redis eviction pub/sub already registered.");
      return;
    }
    const subRedis = getSubRedis();
    if (subRedis) {
      const isUsable = subRedis.status !== "end" && subRedis.status !== "close";
      if (!isUsable) {
        console.warn("[DashboardService] Failed to register pub/sub: Redis sub client is in status:", subRedis.status);
        return;
      }

      if (this.msgHandler) {
        try {
          subRedis.off("message", this.msgHandler);
        } catch (e) {}
      }

      this.msgHandler = (channel: string, message: string) => {
        if (channel === REDIS_EVICTION_CHANNEL) {
          try {
            console.log(`[DashboardService Pub/Sub] Cache eviction signal for user: ${message}`);
            this.evictLocalMemoryCache(message);
          } catch (err: unknown) {
            console.error("[DashboardService Pub/Sub] Error handling message:", getErrorMessage(err));
          }
        }
      };

      subRedis.subscribe(REDIS_EVICTION_CHANNEL)
        .then(() => {
          console.log(`[DashboardService] Subscribed to Redis channel: ${REDIS_EVICTION_CHANNEL}`);
        })
        .catch((err: unknown) => {
          const errMsg = getErrorMessage(err);
          if (errMsg.toLowerCase().includes("offlinequeue") || errMsg.toLowerCase().includes("writeable")) {
            console.warn("[DashboardService] Pub/sub registracija nije dostupna (Redis je u in-memory modu).");
          } else {
            console.error("[DashboardService] Failed to subscribe to channel:", errMsg);
          }
        });

      subRedis.on("message", this.msgHandler);
      this.subRegistered = true;
    }
  }

  static async gracefulShutdown() {
    console.log("[DashboardService] Shutting down Redis eviction pub/sub gracefully...");
    const subRedis = getSubRedis();
    const isConnected = subRedis && (subRedis.status === "ready" || subRedis.status === "connect");

    if (subRedis) {
      if (this.msgHandler) {
        try {
          if (subRedis.status !== "end") {
            subRedis.off("message", this.msgHandler);
          }
        } catch (e) {}
        this.msgHandler = null;
      }

      try {
        if (isConnected) {
          await subRedis.unsubscribe(REDIS_EVICTION_CHANNEL).catch(() => {});
          console.log(`[DashboardService] Unsubscribed from channel.`);
        }
      } catch (err: unknown) {}
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
      console.log(`[DashboardService] Performing surgical granular cache update for employer: ${uid}`);
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
        await CacheService.set(CacheKeys.employerStats(uid), cachedStats, cacheTtl).catch(() => {});

        const redis = getRedis();
        if (redis) {
          await redis.publish(REDIS_EVICTION_CHANNEL, uid).catch((err: unknown) => {
            console.error("[DashboardService] Redis publish eviction failed:", getErrorMessage(err));
          });
        }
        return;
      } catch (err: unknown) {
        console.warn(`[DashboardService] Surgical update failed for user ${uid}. Falling back to clean reset: ${getErrorMessage(err)}`);
      }
    }

    this.evictLocalMemoryCache(uid);
    await db.collection("metadata").doc(`dashboard_prewarm_${uid}`).delete().catch(() => {});

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
      await CacheService.delete(CacheKeys.employerStats(uid)).catch(() => {});
      await CacheService.delete(CacheKeys.smartMatches(uid)).catch(() => {});
      await CacheService.delete(CacheKeys.employerTrends(uid)).catch(() => {});
    }

    this.getEmployerStats(uid).catch(() => {});
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
