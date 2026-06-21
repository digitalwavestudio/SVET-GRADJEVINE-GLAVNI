import { env } from "../config/env.ts";
import { db, admin } from "../config/firebase.ts";
import { DashboardService } from "./dashboard.service.ts";
import { MetricsService } from "./metrics.service.ts";
import { CacheService } from "./cache.service.ts";
import { Logger } from "../utils/logger.ts";
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { RedisLockManager } from "../utils/redis-lock.ts";

const logger = new Logger({ service: "DashboardPrewarmService" });

export class DashboardPrewarmService {
  private static isPrewarming = false;
  private static prewarmDebounceMap = new Map<string, NodeJS.Timeout>();

  /**
   * Debounces the prewarm call per user for exactly 3 seconds (3000ms) to relieve Firestore pressure.
   */
  static debouncePrewarm(uid: string, role?: string) {
    if (this.prewarmDebounceMap.has(uid)) {
      clearTimeout(this.prewarmDebounceMap.get(uid)!);
      logger.info(`[Prewarm] Throttling frequent prewarm request for user: ${uid}. Resetting 3-second debounce timer.`);
    }
    const timeout = setTimeout(() => {
      this.prewarmDebounceMap.delete(uid);
      this.prewarmUser(uid, role).catch((e: any) => logger.warn("[DashboardPrewarmService] Prewarm user dashboard:", e));
    }, 3000);
    this.prewarmDebounceMap.set(uid, timeout);
  }

  /**
   * Prewarms the cache for a specific user.
   * Useful to call after a payment or registration.
   */
  static async prewarmUser(uid: string, role?: string) {
    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    if (redis && env.NODE_ENV !== "test") {
      const isActive = await redis.sismember("active_users:48h", uid);
      if (!isActive) {
        logger.info(`[Prewarm] User ${uid} is not active in the last 48 hours (active_users:48h check failed). Skipping prewarm.`);
        return;
      }
    }

    const cacheKey = `bff_cache:${uid}`;
    
    logger.info(`[Prewarm] Starting prewarm for user: ${uid} (Role: ${role || "unknown"})`);
    
    try {
      let finalRole = role;
      if (!finalRole) {
        const { internalUserLoader } = await import("../utils/dataloader.ts");
        const userDoc = await internalUserLoader.load(uid);
        if (userDoc) {
          finalRole = userDoc.role as string;
        }
      }
      if (!finalRole) {
        logger.warn(`[Prewarm] Could not determine role for user: ${uid}. Skipping prewarm.`);
        return;
      }

      // Mocking enough of the user object for services that need it
      const userMock = { id: uid, uid: uid, role: finalRole };

      const result = await DashboardService.aggregateDashboardData(uid, finalRole, finalRole === "admin", userMock);

      // Set in Redis for 15 minutes (prewarm TTL)
      await CacheService.set(cacheKey, result, 15 * 60 * 1000);

      // Write SWR envelope to Redis to fully support prewarmed SWR fast-path entries
      const swrEnvelope = {
        isSWR: true,
        expiresAt: Date.now() + 15 * 60 * 1000,
        staleFallbackUntil: Date.now() + 15 * 60 * 1000 + 24 * 60 * 60 * 1000,
        data: result
      };
      await CacheService.set(`swr:${cacheKey}`, swrEnvelope, 15 * 60 * 1000 + 24 * 60 * 60 * 1000);

      // Set prewarmed stats Redis key for direct BFF dashboard fast path lookups
      const { getRedis } = await import("../utils/redis.ts");
      const redis = getRedis();
      if (redis) {
        await redis.set(`dashboard_stats_prewarm:${uid}`, JSON.stringify(result), "EX", 10 * 60); // 10 minutes TTL
      }

      logger.info(`[Prewarm] Successfully prewarmed Redis cache for user: ${uid}`);
    } catch (err: any) {
      logger.error(`[Prewarm] Failed to prewarm cache for user: ${uid}`, { error: err.message });
    }
  }

  private static isWithin48Hours(val: any): boolean {
    if (!val) return false;
    let ms = 0;
    if (val && typeof val.toMillis === "function") {
      ms = val.toMillis();
    } else if (val instanceof Date) {
      ms = val.getTime();
    } else if (typeof val === "number") {
      ms = val;
    } else if (typeof val === "string") {
      ms = Date.parse(val);
    } else if (val && typeof val === "object" && typeof val.seconds === "number") {
      ms = val.seconds * 1000;
    }
    if (isNaN(ms) || ms <= 0) return false;
    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    return ms >= fortyEightHoursAgo;
  }

  /**
   * Prewarms all premium users (verified employers and partners).
   * Scheduled task to ensure fast dashboard load times with Active-Only & Live-Session prioritisation.
   */
  static async prewarmPremiumUsers() {
    if (env.NODE_ENV !== "production") {
      logger.info("[Prewarm] Batch prewarm for premium users is safely deactivated in Sandbox/Dev environment to conserve Firebase quota.");
      return;
    }

    if (this.isPrewarming) {
      logger.warn("[Prewarm] Batch prewarming already in progress. Skipping.");
      return;
    }

    this.isPrewarming = true;
    logger.info("[Prewarm] Starting batch prewarm for premium users with Active-Only & Live-Session prioritisation...");

    try {
      // Fetch candidate premium users
      const premiumUsersSnap = await db.collection("users")
        .where("isVerified", "==", true)
        .where("role", "in", ["poslodavac", "COMPANY", "partner", "PARTNER"])
        .limit(25) // Candidate pool limit prepolovljen sa 50 na 25 radi dodatne optimizacije resursa
        .get();

      const candidates = premiumUsersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          role: data.role,
          lastLogin: data.lastLogin,
          lastActive: data.lastActive,
        };
      });

      logger.info(`[Prewarm] Evaluating ${candidates.length} candidate premium users for activity...`);

      const candidateIdsPendingCheck = candidates
        .filter(c => !this.isWithin48Hours(c.lastLogin) && !this.isWithin48Hours(c.lastActive))
        .map(c => c.id);

      const uidsWithActiveListings = new Set<string>();

      // Batch check active listings — single Firestore query instead of N individual queries
      if (candidateIdsPendingCheck.length > 0) {
        const chunkSize = 30;
        for (let i = 0; i < candidateIdsPendingCheck.length; i += chunkSize) {
          const chunk = candidateIdsPendingCheck.slice(i, i + chunkSize);
          try {
            const snap = await db.collection("listings")
              .where("authorId", "in", chunk)
              .where("status", "==", "active")
              .limit(100)
              .get();
            snap.docs.forEach(doc => {
              const data = doc.data();
              if (data.authorId) uidsWithActiveListings.add(data.authorId);
            });
          } catch (err: any) {
            logger.warn(`[Prewarm] Failed to batch-check listings for chunk: ${err.message}`);
          }
        }
      }

      const activeUsers: Array<{ id: string; role: string }> = [];

      for (const candidate of candidates) {
        if (activeUsers.length >= 15) {
          logger.info("[Prewarm] Strict limit of 15 active premium users reached. Stopping candidate evaluation.");
          break;
        }

        const isActiveBySession = this.isWithin48Hours(candidate.lastLogin) || this.isWithin48Hours(candidate.lastActive);
        
        if (isActiveBySession) {
          activeUsers.push({ id: candidate.id, role: candidate.role });
          continue;
        }

        const hasActiveAds = uidsWithActiveListings.has(candidate.id);
        if (hasActiveAds) {
          activeUsers.push({ id: candidate.id, role: candidate.role });
        }
      }

      logger.info(`[Prewarm] Found ${activeUsers.length} active premium users to prewarm.`);

      // Prewarm sequentially
      for (const user of activeUsers) {
        await this.prewarmUser(user.id, user.role);
        // Small delay between users to be gentle on Firestore
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      logger.info("[Prewarm] Batch prewarming completed successfully.");
    } catch (err: any) {
      logger.error("[Prewarm] Batch prewarming failed.", { error: err.message });
    } finally {
      this.isPrewarming = false;
    }
  }

  /**
   * Pre-warms high-level platform fast-path documents (Level 0 Cache)
   * which are critical for Homepage performance and Global visibility.
   */
  static async prewarmGlobalFastPaths() {
    if (env.NODE_ENV !== "production") {
      logger.info("[Prewarm Global] High-level platform fast-path prewarming is safely deactivated in Sandbox/Dev environment to conserve Firebase quota.");
      return;
    }

    logger.info("[Prewarm Global] Starting high-level platform fast-path prewarming...");
    try {
      // PROMPT 2: Skip Firestore queries if data is already in Redis
      const statsWarm = await CacheService.get("admin_global_metrics:cache");
      const partnersWarm = await CacheService.get("swr:premium_partners_v2");

      if (statsWarm && partnersWarm) {
        logger.info("[Prewarm Global] Global fast-paths are already warm in Redis. Skipping duplicate prewarm to conserve quota.");
        return;
      }

      const { UnifiedAdsService } = await import("./unified-ads.service.ts");
      const { AdminStatsService } = await import("./admin-stats.service.ts");
      const { UnifiedSearchService } = await import("./unified-search.service.ts");

      // We don't await them strictly to allow concurrent execution
      await Promise.allSettled([
        UnifiedAdsService.getPremiumPartners(),
        UnifiedAdsService.getPromotedAds({ isPremium: true, limit: 12 }),
        UnifiedAdsService.getPromotedAds({ isUrgent: true, limit: 12 }),
        AdminStatsService.getGlobalStats(),
        // Homepage BFF previews (matching exact filters and limits from bff.controller)
        UnifiedSearchService.search("machines", { status: "active", skipCount: true }, 2),
        UnifiedSearchService.search("realEstate", { status: "active", skipCount: true }, 2),
        UnifiedSearchService.search("accommodations", { status: "active", skipCount: true }, 3),
        UnifiedSearchService.search("caterings", { status: "active", skipCount: true }, 3)
      ]);

      logger.info("[Prewarm Global] High-level platform fast-paths prewarmed successfully.");
    } catch (err: any) {
      logger.error("[Prewarm Global] Global prewarming cycle failed:", err.message);
    }
  }

  /**
   * Starts the automatic scheduler/listener system for prewarming in event-driven reactive hybrid mode.
   */
  static startScheduler() {
    if (env.NODE_ENV !== "production") {
      logger.info("[Prewarm] Automated dashboard prewarm scheduler is safely deactivated in Sandbox/Dev environment to conserve Firebase quota.");
      return;
    }

    logger.info("[Prewarm] Scheduler initialized in event-driven reactive hybrid mode.");

    // Periodic leaderboard prewarm cron (every 4 hours) safely handled by BullMQ across the cluster using Redis distributed lock
    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        SystemCron.register("dashboard_prewarm_cron", { pattern: "0 0 * * *" }, async () => {
          logger.info("[Prewarm Cron] Checking concurrency using Redis distributed lock...");
          // Pokusaj preuzimanja locka na 3 sata kako se zadatak ne bi ponovio na drugim instancama
          const lockId = await RedisLockManager.acquire("dashboard_prewarm_lock", 3 * 60 * 60 * 1000);
          if (!lockId) {
            logger.info("[Prewarm Cron] Failed to acquire distributed lock, another instance is already running this task.");
            return;
          }
          try {
            logger.info("[Prewarm Cron] Executing high-activity platform prewarming task...");
            await DashboardPrewarmService.prewarmGlobalFastPaths();
            await DashboardPrewarmService.prewarmPremiumUsers();
          } finally {
            await RedisLockManager.release("dashboard_prewarm_lock", lockId).catch((e: any) => logger.warn("[DashboardPrewarmService] Release prewarm lock:", e));
          }
        }).catch(err => logger.error("[Prewarm Cron] Failed to register repeatable job", err));
      })
      .catch((err) => logger.error("[Prewarm] Failed to import SystemCron", err));

    // Listen to key platform events to trigger immediate cache pre-warming
    eventBus.on(DomainEvents.PAYMENT_COMPLETED, async (payload: any) => {
      try {
        const uid = payload?.userId;
        if (uid) {
          logger.info(`[Prewarm] Event PAYMENT_COMPLETED caught for user: ${uid}. Prewarming dashboard...`);
          const role = payload?.role;
          DashboardPrewarmService.prewarmUser(uid, role).catch((e: any) => logger.warn("[DashboardPrewarmService] Prewarm user on payment event:", e));
        }
      } catch (e: any) {
        logger.error(`[Prewarm] Reaction to PAYMENT_COMPLETED failed`, { error: e.message });
      }
    });

    eventBus.on(DomainEvents.APPLICATION_SUBMITTED, async (payload: any) => {
      try {
        const uid = payload?.employerId;
        if (uid) {
          logger.info(`[Prewarm] Event APPLICATION_SUBMITTED caught for employer: ${uid}. Scheduling debounced prewarm...`);
          DashboardPrewarmService.debouncePrewarm(uid);
        }
      } catch (e: any) {
        logger.error(`[Prewarm] Reaction to APPLICATION_SUBMITTED failed`, { error: e.message });
      }
    });

    const handleAdChange = async (payload: any) => {
      try {
        const authorId = payload?.authorId || payload?.newData?.authorId || payload?.oldData?.authorId;
        if (authorId) {
          logger.info(`[Prewarm] Ad event caught. Scheduling debounced prewarm for author: ${authorId}...`);
          DashboardPrewarmService.debouncePrewarm(authorId);
        } else if (payload?.id) {
          const finalAd = await db.collection("listings").doc(payload.id).get();
          if (finalAd.exists) {
            const adData = finalAd.data();
            if (adData?.authorId) {
              logger.info(`[Prewarm] Ad event caught (lazy fetch). Scheduling debounced prewarm for author: ${adData.authorId}...`);
              DashboardPrewarmService.debouncePrewarm(adData.authorId);
            }
          }
        }
      } catch (e: any) {
        logger.error(`[Prewarm] Reaction to ad change event failed`, { error: e.message });
      }
    };

    eventBus.on(DomainEvents.AD_CREATED, handleAdChange);
    eventBus.on(DomainEvents.AD_UPDATED, handleAdChange);
    eventBus.on(DomainEvents.JOB_CREATED, handleAdChange);
    eventBus.on(DomainEvents.JOB_UPDATED, handleAdChange);
  }
}
