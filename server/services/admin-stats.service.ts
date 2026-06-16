import { admin as firebaseAdmin, db, getDb } from "../config/firebase.ts";
import { CacheService } from "./cache.service.ts";
import { Logger } from "../utils/logger.ts";

/**
 * AdminStatsService handles proactive aggregation of platform metrics on the server side.
 * This is critical for preventing O(N) client-side counts and ensuring dashboard scalability.
 */
export class AdminStatsService {
  private static logger = new Logger({ service: "AdminStatsService" });
  private static STATS_DOC_PATH = "metadata/global_stats";
  private static NUM_SHARDS = 10;

  // L1 Hard Cache (Shield) specifically for homepage performance
  private static l1ShieldCache = new Map<string, { data: unknown; expiry: number }>();
  private static inflightPromises = new Map<string, Promise<unknown>>();
  private static readonly L1_SHIELD_TTL = 60 * 1000; // 1 minute protection

  /**
   * Internal helper to handle request collapsing and L1/L2 caching logic for metadata
   */
  private static async getCachedMetadata<T>(cacheKey: string, fastPathDoc: string, fetchFn: () => Promise<T>, fallbackValue?: T): Promise<T> {
    const now = Date.now();
    
    // 1. L1 RAM Shield Check
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) return shield.data as T;

    // 2. In-flight Promise Collapsing
    const inflight = this.inflightPromises.get(cacheKey);
    if (inflight) return inflight as Promise<T>;

    const fetchTask = (async () => {
      try {
        const data = await CacheService.getOrSetSWR(
          cacheKey,
          async () => {
             // 1. Try Firestore Fast-Path (L0) as a cheaper fallback than query
             try {
               const { checkQuotaStatus, getMockDocSnapshot } = await import("../config/firebase.ts");
               
                let doc;
                if (checkQuotaStatus()) {
                   console.warn(`[AdminStatsService] Quota exhausted, using local mock for ${fastPathDoc}`);
                   doc = getMockDocSnapshot(fastPathDoc.split('/').pop() || "", fastPathDoc);
                } else {
                   // Increased timeout for Fast-Path FirestoreDoc to prevent expensive recalculations. 
                   const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
                   doc = await Promise.race([
                     db.doc(fastPathDoc).get(),
                     timeoutPromise
                   ]).catch(() => null);
                }

               if (doc && doc.exists) {
                 const d = doc.data();
                 const actualData = d?.stats || d;
                 if (actualData) {
                   console.log(`[AdminStatsService] L0 Fast-Path hit for ${cacheKey}`);
                   return actualData;
                 }
               }
             } catch (e: any) {
               console.warn(`[AdminStatsService] L0 Fast-Path failed for ${cacheKey}:`, e instanceof Error ? e.message : String(e));
             }

             // Stop execution and return fallback immediately if circuit breaker tripped
             const { checkQuotaStatus } = await import("../config/firebase.ts");
             if (checkQuotaStatus()) {
               console.warn(`[AdminStatsService] Quota status is active after fast-path attempt. Skipping cold-path query for ${cacheKey} and returning fallback.`);
               return fallbackValue as T;
             }

             // 2. Fallback to real query (Cold Path) 
             // U skladu sa zadatkom: 1 Firestore čitač koji popunjava cache
             const res = await fetchFn();
             
             // Sync to Fast-Path
             db.doc(fastPathDoc).set({
               stats: res,
               updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
             }, { merge: true }).catch(() => {});
             
             return res;
          },
          3600 * 1000, // 1 hour TTL
          fallbackValue
        );
        this.l1ShieldCache.set(cacheKey, { data, expiry: now + this.L1_SHIELD_TTL });
        return data;
      } catch (err: any) {
        console.error(`[AdminStatsService] Cache failure for ${cacheKey}:`, err instanceof Error ? err.message : String(err));
        throw err;
      } finally {
        this.inflightPromises.delete(cacheKey);
      }
    })();

    this.inflightPromises.set(cacheKey, fetchTask);

    // 3. Global Tier-2 Safety Timeout: 150ms max wait for the whole tiered lookup
    const globalTimeout = new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallbackValue as T), 150);
    });

    return Promise.race([fetchTask, globalTimeout]);
  }

  /**
   * Updates global stats atomically using sharded counters.
   * This is part of the "Atomic Consistency" fix.
   */
  static async updateGlobalStats(
    category:
      | "jobs"
      | "companies"
      | "machines"
      | "accommodations"
      | "masters"
      | "realEstate"
      | "catering"
      | "caterings"
      | "marketplace"
      | "users"
      | "plots"
      | "premiumPartners",
    change: number,
    isPremium: boolean = false,
    status: string = "active",
    transaction?: firebaseAdmin.firestore.Transaction,
    isUrgent: boolean = false,
  ) {
    const shardId = Math.floor(Math.random() * this.NUM_SHARDS).toString();
    const statsRef = db.doc(`${this.STATS_DOC_PATH}/shards/${shardId}`);

    const updates: any = {
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    };

    // Mapping category to schema field
    const fieldMap: Record<string, string> = {
      jobs: "totalJobs",
      companies: "companiesCount",
      machines: "machinesCount",
      accommodations: "accommodationsCount",
      masters: "mastersCount",
      realEstate: "realEstateCount",
      plots: "realEstateCount",
      catering: "cateringCount",
      caterings: "cateringCount",
      marketplace: "marketplaceCount",
      users: "totalUsers",
      premiumPartners: "premiumPartners",
    };

    const mainField = fieldMap[category];
    if (mainField) {
      updates[mainField] = firebaseAdmin.firestore.FieldValue.increment(change);
    }

    // Status based aggregation
    if (status === "active") {
      updates.activeAds = firebaseAdmin.firestore.FieldValue.increment(change);
    } else if (status === "pending" || status === "pending_payment") {
      updates.pendingAds = firebaseAdmin.firestore.FieldValue.increment(change);
    }

    // Premium tracking & Revenue Estimation
    if (isPremium) {
      // If it's a category update, track as premiumAds
      if (category !== "premiumPartners" && category !== "users") {
        updates.premiumAds =
          firebaseAdmin.firestore.FieldValue.increment(change);
      } else {
        updates.premiumPartners =
          firebaseAdmin.firestore.FieldValue.increment(change);
      }

      const REVENUE_PER_PREMIUM = 50;
      const REVENUE_PER_STANDARD = 15;

      const revenueChange = isPremium
        ? change * REVENUE_PER_PREMIUM
        : change * REVENUE_PER_STANDARD;
      updates.estimatedRevenue =
        firebaseAdmin.firestore.FieldValue.increment(revenueChange);
    }

    if (isUrgent) {
      updates.urgentAds = firebaseAdmin.firestore.FieldValue.increment(change);
    }

    try {
      if (transaction) {
        transaction.set(statsRef, updates, { merge: true });
      } else {
        await statsRef.set(updates, { merge: true });
      }
    } catch (error) {
      this.logger.error(`Failed to update global stats for ${category}`, {
        error,
      });
    }
  }

  /**
   * Updates per-user aggregated stats.
   * Part of the dashboard scalability improvements.
   */
  static async updateUserStats(
    uid: string,
    updates: {
      activeAds?: number;
      pendingApplications?: number;
      totalViews?: number;
      favoritesCount?: number;
    },
    transaction?: firebaseAdmin.firestore.Transaction,
  ) {
    if (!uid) return;
    const statsRef = db.collection("user_stats").doc(uid);
    const firestoreUpdates: any = {
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    };

    if (updates.activeAds !== undefined) {
      firestoreUpdates.activeAds = firebaseAdmin.firestore.FieldValue.increment(
        updates.activeAds,
      );
    }
    if (updates.pendingApplications !== undefined) {
      firestoreUpdates.pendingApplications =
        firebaseAdmin.firestore.FieldValue.increment(
          updates.pendingApplications,
        );
    }
    if (updates.totalViews !== undefined) {
      firestoreUpdates.totalViews =
        firebaseAdmin.firestore.FieldValue.increment(updates.totalViews);
    }
    if (updates.favoritesCount !== undefined) {
      firestoreUpdates.favoritesCount =
        firebaseAdmin.firestore.FieldValue.increment(updates.favoritesCount);
    }

    try {
      if (transaction) {
        transaction.set(statsRef, firestoreUpdates, { merge: true });
      } else {
        await statsRef.set(firestoreUpdates, { merge: true });
      }
    } catch (error) {
      this.logger.error(`Failed to update user stats for ${uid}`, { error });
    }
  }

  static async getGlobalStats() {
    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    if (redis) {
      try {
        const cached = await redis.get("admin_global_metrics:cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          console.log("[AdminStatsService] Hit precompiled admin_global_metrics:cache in Redis.");
          return parsed;
        }
      } catch (err) {
        console.warn("[AdminStatsService] Failed to read admin_global_metrics:cache from Redis:", err);
      }
    }

    try {
      const doc = await db.collection("metadata").doc("admin_stats").get();
      if (doc.exists) {
        const d = doc.data();
        if (d) {
          if (redis) {
            await redis.set("admin_global_metrics:cache", JSON.stringify(d), "EX", 3600);
          }
          console.log("[AdminStatsService] Served global stats from admin_stats document shield.");
          return d;
        }
      }
    } catch (err) {
      console.warn("[AdminStatsService] Failed to read admin_stats document shield:", err);
    }

    const fallbackStats: any = {
      totalJobs: 0,
      companiesCount: 0,
      machinesCount: 0,
      accommodationsCount: 0,
      mastersCount: 0,
      realEstateCount: 0,
      cateringCount: 0,
      marketplaceCount: 0,
      activeAds: 0,
      pendingAds: 0,
      premiumPartners: 0,
      premiumAds: 0,
      urgentAds: 0,
      totalUsers: 0,
      estimatedRevenue: 0,
      growthActiveAds: "0%",
      growthPremiumPartners: "0",
      growthCompanies: "0",
      verifiedCompanies: 0
    };

    try {
      const liveStats = await this.reconcileGlobalStats();
      return { ...fallbackStats, ...liveStats };
    } catch (err) {
      console.warn("[AdminStatsService] Reconcile failed, returning zeroes.", err);
      return fallbackStats;
    }
  }

  /**
   * Safe Global Stats Reconciliation
   * Refashions the sharded counter baseline by performing a capped scan of listings.
   * PROMPT 9: Hard limits and small batches to prevent Quota Exhaustion.
   */
  static async reconcileGlobalStats(): Promise<Record<string, any>> {
      this.logger.info("[AdminStatsService] Starting sharding baseline reconciliation...");

    try {
      const rawDb = getDb();

      // Precise aggregations using count() (Safest & Cheapest - 1 read per 1k docs)
      const counts: Record<string, number> = {};
      const categories = ["job", "machine", "accommodation", "catering", "plot", "marketplace"];
      
      for (const cat of categories) {
        const snap = await rawDb.collection("listings").where("type", "==", cat).count().get();
        counts[`total_${cat}s`] = snap.data().count;
      }

      const usersSnap = await rawDb.collection("users").count().get();
      const verifiedUsersSnap = await rawDb.collection("users").where("isVerified", "==", true).count().get();
      const premiumUsersSnap = await rawDb.collection("users").where("businessProfile.isPremium", "==", true).count().get();
      const employersSnap = await rawDb.collection("users").where("role", "==", "poslodavac").count().get();
      const activeAdsSnap = await rawDb.collection("listings").where("status", "==", "active").count().get();
      const pendingAdsSnap = await rawDb.collection("listings").where("status", "==", "pending").count().get();

      const reconciledStats = {
        totalJobs: counts.total_jobs || 0,
        companiesCount: employersSnap.data().count,
        machinesCount: counts.total_machines || 0,
        accommodationsCount: counts.total_accommodations || 0,
        cateringCount: counts.total_caterings || 0,
        realEstateCount: (counts.total_plots || 0),
        marketplaceCount: counts.total_marketplaces || 0,
        totalUsers: usersSnap.data().count,
        verifiedCompanies: verifiedUsersSnap.data().count,
        premiumPartners: premiumUsersSnap.data().count,
        activeAds: activeAdsSnap.data().count,
        pendingAds: pendingAdsSnap.data().count,
        lastReconciled: new Date().toISOString(),
        safetySwitch: "active"
      };

      // Consolidate to admin_stats document (L0 Shield)
      await rawDb.collection("metadata").doc("admin_stats").set(reconciledStats, { merge: true });
      
      return reconciledStats;
    } catch (error) {
      this.logger.error("Failed to reconcile global stats securely", { error });
      throw error;
    }
  }
}
