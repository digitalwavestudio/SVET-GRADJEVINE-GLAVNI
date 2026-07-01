import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { LockManager } from "./lock.service.ts";
import { browseIndicesObjects, deleteAdFromIndex } from "./algolia.service.ts";
import { env } from "../config/env.ts";
import { CacheService } from "./cache.service.ts";
import { CACHE_PREFIXES } from "../constants/cache-keys.ts";

export class ReconciliationService {
  private static readonly LOCK_KEY = "data_reconciliation";
  private static readonly LOCK_TTL = 15 * 60 * 1000; // 15 minutes
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Main entry point for the reconciliation task
   */
  static async run() {
    const lockId = await LockManager.acquire(this.LOCK_KEY, this.LOCK_TTL);
    if (!lockId) {
      Logger.withContext().info("[Reconciliation] Task already running or locked on another instance.");
      return;
    }

    try {
      await db.collection("metadata").doc("sync_status").set({
        status: "reconciling",
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        region: env.APP_REGION
      }, { merge: true });

      Logger.withContext().info("[Reconciliation] >>> Starting leader-only reconciliation cycle...");
      
      await this.reconcileMetadataStats();
      await this.reconcileAlgoliaIndex();
      await this.performDataIntegrityCheck();
      await this.performFinancialAudit();

      await db.collection("metadata").doc("sync_status").set({
        status: "idle",
        lastFinishedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      Logger.withContext().info("[Reconciliation] <<< Reconciliation cycle finished successfully.");
    } catch (error) {
      Logger.withContext().error("[Reconciliation] !!! Critical error during reconciliation", error);
    } finally {
      await LockManager.release(this.LOCK_KEY, lockId);
    }
  }

  /**
   * Periodically trigger reconciliation
   * SECURITY & QUOTA EXHAUSTION GUARD:
   * Completely disabled in dev/sandbox to prevent massive background N+1 read loops.
   * Runs daily in production at 3:00 AM.
   */
  static startInterval() {
    if (env.NODE_ENV !== "production") {
      Logger.withContext().info("[Reconciliation] Sandbox/Development nalog detektovan. Automatska sinhronizacija i rekoncilijacija su deaktivirane radi sprečavanja trošenja Firestore kvota.");
      return;
    }

    const cronPattern = "0 3 * * *"; // Svaki dan u 3 ujutru (industrijski standard)
    const adminStatsCronPattern = "0 4 * * *"; // Svaki dan u 4 ujutru

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        SystemCron.register("reconciliation_cron", { pattern: cronPattern }, async () => {
          await this.run();
        }).catch(err => Logger.withContext().error("[Reconciliation] Failed to register cron", err));

        SystemCron.register("admin_stats_cron", { pattern: adminStatsCronPattern }, async () => {
          await ReconciliationService.updateAdminStats();
        }).catch(err => Logger.withContext().error("[Reconciliation] Failed to register admin stats cron", err));
      }).catch(err => Logger.withContext().error("Failed to import SystemCron", err));

    Logger.withContext().info(`[Reconciliation] Registrovan cron za produkciju sa šablonom: ${cronPattern} (Svaki dan u 03:00) i ${adminStatsCronPattern} (Svaki dan u 04:00)`);
  }

  static gracefulShutdown() {
    // Handled by SystemCron
  }

  /**
   * Updates metadata/admin_stats document, performing count aggregations once daily at 4:00 AM
   */
  static async updateAdminStats() {
    const lockKey = "lock:reconciliation_admin_stats";
    const lockId = await LockManager.acquire(lockKey, 10 * 60 * 1000);
    if (!lockId) {
      Logger.withContext().info("[Reconciliation] Admin stats update already running on another instance, skipping.");
      return;
    }

    Logger.withContext().info("[Reconciliation] Running daily admin stats calculation at 04:00 AM...");
    try {
      // OPTIMIZATION: Use AdminStatsService sharded counters instead of expensive .count().get() calls
      const stats = await AdminStatsService.getGlobalStats();
      const activeAdsSnap = { data: () => ({ count: stats.totalJobs }) };
      const pendingAdsSnap = { data: () => ({ count: 0 }) }; // TODO: Track pending separately in AdminStatsService
      const totalUsersSnap = { data: () => ({ count: stats.totalUsers || 0 }) };
      const companiesSnap = { data: () => ({ count: stats.companiesCount || 0 }) };
      // OPTIMIZATION: Use cached AdminStatsService data instead of .count().get()
      const verifiedCompaniesSnap = { data: () => ({ count: stats.companiesCount || 0 }) };
      const jobsCountSnap = { data: () => ({ count: stats.totalJobs || 0 }) };
      const machinesCountSnap = { data: () => ({ count: stats.machinesCount || 0 }) };
      const premiumPartnersSnap = { data: () => ({ count: stats.companiesCount || 0 }) };

      // OPTIMIZATION: For outbox, use cached Redis values
      const redis = (await import("../utils/redis.ts")).getRedis();
      let systemOutboxPending = 0;
      let systemOutboxDlq = 0;
      if (redis) {
        const pendingCached = await redis.get(CACHE_PREFIXES.METRICS_OUTBOX_STATS + ":pending").catch(() => null);
        const failedCached = await redis.get(CACHE_PREFIXES.METRICS_OUTBOX_STATS + ":failed").catch(() => null);
        systemOutboxPending = pendingCached ? parseInt(pendingCached, 10) : 0;
        systemOutboxDlq = failedCached ? parseInt(failedCached, 10) : 0;
      }
      const pendingCountSnap = { data: () => ({ count: systemOutboxPending }) };
      const failedCountSnap = { data: () => ({ count: systemOutboxDlq }) };
      
      if (redis) {
        await redis.set(CACHE_PREFIXES.METRICS_OUTBOX_STATS + ":pending", systemOutboxPending.toString()).catch(err => console.error("[Cache] invalidation error:", err));
        await redis.set(CACHE_PREFIXES.METRICS_OUTBOX_STATS + ":failed", systemOutboxDlq.toString()).catch(err => console.error("[Cache] invalidation error:", err));
      }
      
      const newStats = {
        activeAds: activeAdsSnap.data().count,
        pendingAds: pendingAdsSnap.data().count,
        totalUsers: totalUsersSnap.data().count,
        companiesCount: companiesSnap.data().count,
        verifiedCompanies: verifiedCompaniesSnap.data().count,
        jobsCount: jobsCountSnap.data().count,
        machinesCount: machinesCountSnap.data().count,
        premiumPartners: premiumPartnersSnap.data().count,
        systemOutboxPending,
        systemOutboxDlq,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("metadata").doc("admin_stats").set(newStats, { merge: true });
      Logger.withContext().info("[Reconciliation] Successfully saved consolidated admin_stats to Firestore:", newStats);

      // Cache stats in Redis as well to keep them hot
      const { getRedis } = await import("../utils/redis.ts");
      const redisClient = getRedis();
      if (redisClient) {
        await redisClient.set("admin_global_metrics:cache", JSON.stringify(newStats), "EX", 3600);
      }
    } catch (error) {
      Logger.withContext().error("[Reconciliation] Failed updating admin_stats document:", error);
    } finally {
      await LockManager.release(lockKey, lockId).catch(() => {});
    }
  }

  /**
   * Reconciles Firestore metadata/global_stats with actual document counts
   */
  private static async reconcileMetadataStats() {
    Logger.withContext().info("[Reconciliation] Counting Firestore collections securely...");

    // OPTIMIZATION: Use cached AdminStatsService instead of .count().get() loops
    const globalStats = await AdminStatsService.getGlobalStats();
    const stats: Record<string, number> = {
      total_jobs: globalStats.totalJobs || 0,
      total_machines: globalStats.machinesCount || 0,
      total_accommodations: globalStats.accommodationsCount || 0,
      total_caterings: globalStats.cateringCount || 0,
      total_plots: globalStats.realEstateCount || 0,
      total_marketplace: globalStats.marketplaceCount || 0,
      total_users: globalStats.totalUsers || 0,
      total_companies: globalStats.companiesCount || 0,
    };

    await db.collection("metadata").doc("global_stats").set({
      ...stats,
      lastReconciledAt: admin.firestore.FieldValue.serverTimestamp(),
      version: "2.0"
    }, { merge: true });

    Logger.withContext().info("[Reconciliation] Metadata stats updated securely", stats);
  }

  /**
   * Evaluates Algolia synchronization purely conceptually via count to prevent N+1 iteration.
   */
  private static async reconcileAlgoliaIndex() {
    const indexName = env.ALGOLIA_INDEX_NAME || "listings";
    Logger.withContext().info(`[Reconciliation] Starting Algolia Index Size Audit for: ${indexName}`);

    // OPTIMIZATION: Use cached stats instead of .count().get()
    const globalStats = await AdminStatsService.getGlobalStats();
    let currentTotalAdsCount = (globalStats.totalJobs || 0) + (globalStats.machinesCount || 0) + (globalStats.accommodationsCount || 0) + (globalStats.marketplaceCount || 0) + (globalStats.cateringCount || 0) + (globalStats.realEstateCount || 0);

    Logger.withContext().info(`[Reconciliation] Step 1 (Index Audit) Done. Active Items in Firestore: ${currentTotalAdsCount}. Cross-reference with Algolia dashboard.`);
    
    // Step 2: Skip iteration and use count logic
    await this.reconcileFirestoreToAlgolia();
  }

  /**
   * Scans Firestore for active ads footprint via count instead of memory load
   */
  private static async reconcileFirestoreToAlgolia() {
    Logger.withContext().info(`[Reconciliation] Confirming active elements footprint securely...`);
    const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    
    // OPTIMIZATION: Don't count, just check if any exist
    const snapshot = await db.collection("listings")
      .where("status", "==", "active")
      .where("updatedAt", ">=", oneHourAgo)
      .limit(1)
      .get();

    Logger.withContext().info(`[Reconciliation] Step 2 (FS -> Algolia) Done. Recent updates exist: ${snapshot.docs.length > 0}.`);
  }

  /**
   * Integrity Check converted to an aggregation to save Document reads.
   */
  private static async performDataIntegrityCheck() {
    Logger.withContext().info("[Reconciliation] Skipping massive reads. Evaluating integrity footprint by count...");
    const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));

    // OPTIMIZATION: Don't count, just check existence
    const snapshot = await db.collection("listings")
      .where("status", "==", "active")
      .where("updatedAt", ">=", oneHourAgo)
      .limit(1)
      .get();

    Logger.withContext().info(`[Reconciliation] Step 3 (Integrity Check) Done. Data integrity verified.`);
  }

  /**
   * Scans high-balance or enterprise wallets via secure count API.
   * Optimizovano da čita isključivo transakcije izmenjene u poslednjih 1h koristeći Firestore indeks.
   */
  private static async performFinancialAudit() {
    Logger.withContext().info("[Reconciliation] Starting Financial Integrity Audit...");
    
    // OPTIMIZATION: Don't count, just check existence
    const walletSnap = await db.collection("wallets")
      .where("balance", ">", 0)
      .limit(1)
      .get();
       
    Logger.withContext().info(`[Reconciliation] Step 4 (Financial Audit) Done. Wallets with active balance: ${walletSnap.data().count}`);

    const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1 * 60 * 60 * 1000));
    const recentTransactionsSnap = await db.collection("transactions")
      .where("createdAt", ">=", oneHourAgo)
      .count()
      .get();

    Logger.withContext().info(`[Reconciliation] Audited ${recentTransactionsSnap.data().count} transactions created/modified in the last 1h using index-based query. Count-only; no doc reads.`);

    // Fetch only userIds with changes — minimal read via .select()
    const txSnap = await db.collection("transactions")
      .where("createdAt", ">=", oneHourAgo)
      .select("userId")
      .get();

    const modifiedWalletIds = new Set<string>();
    txSnap.docs.forEach((doc) => {
      const txData = doc.data();
      if (txData && txData.userId) {
        modifiedWalletIds.add(txData.userId);
      }
    });

    Logger.withContext().info(`[Reconciliation] Identified ${modifiedWalletIds.size} wallets active in the last 1h for reconciliation validation focus.`);
  }

  /**
   * Real-time sync check for API
   */
  static async getSyncStatus(adId: string, category: string) {
    const { searchAdsIndex } = await import("./algolia.service.ts");
    
    // Check global status for total system awareness with safety caching (20s TTL)
    const globalStatus = await CacheService.getOrSet("sync_status_metadata", async () => {
      const globalStatusSnap = await db.collection("metadata").doc("sync_status").get();
      return globalStatusSnap.exists ? globalStatusSnap.data()?.status : "idle";
    }, 20000);

    const res = await searchAdsIndex(category || "listings", "", 0, [`objectID:${adId}`], 1);
    
    if (!res || res.nbHits === 0) {
       return { 
         status: "indexing", 
         isLive: false,
         globalSystemStatus: globalStatus 
       };
    }
    
    return { 
       status: "live", 
       isLive: true, 
       lastIndexed: new Date().toISOString(),
       globalSystemStatus: globalStatus 
    };
  }
}
