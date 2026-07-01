import { env } from "../config/env.ts";
import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { LockManager } from "./lock.service.ts";

export class HousekeepingService {
  private static logger = new Logger({ service: "Housekeeping" });

  private static accumulatedStatuses: Record<string, any> = {};
  private static isAccumulating = false;
  private static readonly METADATA_DOC = "metadata/housekeeping_status";
  static readonly ARCHIVE_AFTER_MONTHS = 6;

  static async run() {
    this.logger.info("Housekeeping Service initialized");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        if (env.NODE_ENV === "production") {
          SystemCron.register("housekeeping_full_cycle", { pattern: "0 3 * * *" }, async () => {
            await this.runFullCycle();
          }).catch(err => this.logger.error("Failed to register full cycle cron", err));
        }
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static async runFullCycle() {
    const lockKey = "lock:housekeeping_full_cycle";
    const lockId = await LockManager.acquire(lockKey, 60 * 60 * 1000);
    if (!lockId) {
      this.logger.warn("Full cycle already running (locked), skipping");
      return;
    }

    try {
      const { CacheService } = await import("./cache.service.ts");
      const lastRunStr = await CacheService.get<string>("housekeeping_last_run");
      if (lastRunStr) {
        const lastRun = parseInt(lastRunStr, 10);
        const hoursSinceLastRun = (Date.now() - lastRun) / (1000 * 60 * 60);
        if (hoursSinceLastRun < 23) {
          this.logger.info(`Housekeeping skipped. Last run was ${Math.round(hoursSinceLastRun)}h ago.`);
          await LockManager.release(lockKey, lockId);
          return;
        }
      }
    } catch (e) {
      this.logger.error("Failed to check housekeeping cache", e);
    }

    this.logger.info("Starting Housekeeping Full Cycle...");
    const startTime = Date.now();
    this.startAccumulating();

    try {
      await this.cleanupExpiredPremiums();
      await this.reconcileGlobalStats();
      await this.cleanupDeletedAds();
      await this.cleanupActivities();
      await this.cleanupOldDrafts();
      await this.cleanupAuditLogs();
      await this.cleanupOldMetrics();

      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.flushAccumulated({ durationSeconds: duration, lastRun: admin.firestore.FieldValue.serverTimestamp() });

      const { CacheService } = await import("./cache.service.ts");
      await CacheService.set("housekeeping_last_run", Date.now().toString(), 24 * 60 * 60 * 1000);

      this.logger.info(`Housekeeping Full Cycle completed in ${duration}s`);
    } catch (err) {
      this.logger.error("Full cycle failed", err);
      await this.flushAccumulated({ error: String(err) }, true);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static async gracefulShutdown() {
    this.logger.info("Housekeeping Service stopped");
  }

  // ── Cleanup methods ────────────────────────────────────────────

  static async cleanupDeletedAds() {
    this.logger.info("Starting Housekeeping: Audit Archive Deleted Ads");
    const result = { totalArchived: 0, processedCollections: ["listings"] };
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - this.ARCHIVE_AFTER_MONTHS);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    try {
      const snapshot = await db.collection("listings").where("status", "==", "deleted").count().get();
      result.totalArchived = snapshot.data().count;
    } catch (error) {
      this.logger.error("Error auditing listings", error);
    }

    await this.accumulateStatus("cleanupDeletedAds", result);
    return result;
  }

  static async cleanupExpiredPremiums() {
    this.logger.info("Starting Housekeeping: Expire Premiums");
    const result = { totalExpired: 0, totalErrors: 0 };
    const now = admin.firestore.Timestamp.now();

    try {
      const batch = db.batch();
      let batchCount = 0;
      const snap = await db.collection("listings")
        .where("isPremium", "==", true)
        .where("premiumUntil", "<", now)
        .limit(400)
        .get();

      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { isPremium: false, premiumUntil: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        batchCount++;
      });

      if (batchCount > 0) {
        await batch.commit();
        result.totalExpired = batchCount;
        this.logger.info(`Expired ${batchCount} premium listings`);
      }

      try {
        const userBatch = db.batch();
        let userBatchCount = 0;
        const userSnap = await db.collection("users")
          .where("isPremiumProfile", "==", true)
          .where("premiumUntil", "<", now)
          .limit(400)
          .get();

        userSnap.docs.forEach((doc) => {
          userBatch.update(doc.ref, { isPremiumProfile: false, premiumUntil: null, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
          userBatchCount++;
        });

        if (userBatchCount > 0) {
          await userBatch.commit();
          result.totalExpired += userBatchCount;
          this.logger.info(`Expired ${userBatchCount} premium user profiles`);
        }
      } catch (err) {
        result.totalErrors++;
        this.logger.error("Error expiring user premium profiles", err);
      }
    } catch (error) {
      this.logger.error("Error in expirePremiums", error);
    }

    await this.accumulateStatus("cleanupExpiredPremiums", result);
    return result;
  }

  static async cleanupActivities() {
    this.logger.info("Auditing old activities...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

      const snap = await db.collection("activities").where("createdAt", "<", cutoffTimestamp).count().get();
      if (snap.data().count > 0) {
        this.logger.info(`Audit: Found ${snap.data().count} old activities.`);
      }
    } catch (error) {
      this.logger.error("Audit activities failed", error);
    }
  }

  static async cleanupOldDrafts() {
    this.logger.info("Auditing abandoned drafts...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

      const snap = await db.collection("listings")
        .where("status", "==", "draft")
        .where("updatedAt", "<", cutoff)
        .count()
        .get();

      if (snap.data().count > 0) {
        this.logger.info(`Audit: Found ${snap.data().count} abandoned drafts`);
      }
    } catch (error) {
      this.logger.error("Audit drafts failed", error);
    }
  }

  static async cleanupAuditLogs() {
    this.logger.info("Starting Housekeeping: Archive & Clean old audit logs limit audit");
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(ninetyDaysAgo);

      const snapshot = await db.collection("audit_logs").where("timestamp", "<", cutoffTimestamp).count().get();
      const totalArchived = snapshot.data().count;

      await this.accumulateStatus("cleanupAuditLogs", { archivedCount: totalArchived, success: true });
      this.logger.info(`Audit: Found ${totalArchived} audit logs older than 90 days.`);
      return { success: true, archivedCount: totalArchived };
    } catch (err) {
      this.logger.error("Failed to count audit logs", err);
      await this.accumulateStatus("cleanupAuditLogs", { error: String(err) }, true);
      throw err;
    }
  }

  static async cleanupOldMetrics() {
    this.logger.info("Starting Housekeeping: Audit old daily metrics");
    try {
      const dateOffset = new Date();
      dateOffset.setDate(dateOffset.getDate() - 365);
      const cutoffStr = dateOffset.toISOString().split("T")[0];

      const snapshot = await db.collection("metrics_daily").where("date", "<", cutoffStr).count().get();
      const totalDeleted = snapshot.data().count;

      await this.accumulateStatus("cleanupOldMetrics", { deletedCount: totalDeleted, success: true });
      this.logger.info(`Audit: Found ${totalDeleted} old daily metrics (older than 365 days).`);
      return { success: true, deletedCount: totalDeleted };
    } catch (err) {
      this.logger.error("Failed to audit old daily metrics", err);
      await this.accumulateStatus("cleanupOldMetrics", { error: String(err) }, true);
      return { success: false, error: String(err) };
    }
  }

  static async cleanupAlgoliaOrphans() {
    this.logger.info("Starting Housekeeping: Algolia Orphan Cleanup skipped due to limit");
    const result = { totalCleaned: 0, orphansByIndex: {} };
    await this.accumulateStatus("cleanupAlgoliaOrphans", result);
    return result;
  }

  static async reconcileGlobalStats() {
    const { AdminStatsService } = await import("./admin/admin-stats.service.ts");
    this.logger.info("Triggering safe global stats reconciliation via AdminStatsService...");
    const results = await AdminStatsService.reconcileGlobalStats();
    await this.accumulateStatus("reconcileGlobalStats", { status: "completed", verifiedCounts: results, timestamp: new Date().toISOString() });
    return results;
  }

  // ── Status accumulator ──────────────────────────────────────────

  private static startAccumulating() {
    this.accumulatedStatuses = {};
    this.isAccumulating = true;
    this.logger.info("Started accumulating housekeeping statuses in-memory.");
  }

  private static stopAccumulating() {
    this.isAccumulating = false;
    const temp = { ...this.accumulatedStatuses };
    this.accumulatedStatuses = {};
    this.logger.info("Stopped status accumulation.");
    return temp;
  }

  private static async flushAccumulated(fullCycleResult: any, isError = false) {
    const accumulated = this.stopAccumulating();
    try {
      const payload: Record<string, any> = {
        full_cycle: {
          lastRun: admin.firestore.FieldValue.serverTimestamp(),
          status: isError ? "error" : "success",
          result: { ...fullCycleResult, tasks: accumulated },
        },
      };
      await db.doc(this.METADATA_DOC).set(payload, { merge: true });
      this.logger.info("Successfully flushed consolidated housekeeping statuses to Firestore in a single write.");
    } catch (e) {
      this.logger.error("Failed to flush consolidated housekeeping statuses to Firestore", e);
    }
  }

  private static async accumulateStatus(taskName: string, result: any, isError = false) {
    this.accumulatedStatuses[taskName] = {
      lastRun: new Date().toISOString(),
      status: isError ? "error" : "success",
      result,
    };
    this.logger.info(`Accumulated task status in-memory: ${taskName}`);
  }
}
