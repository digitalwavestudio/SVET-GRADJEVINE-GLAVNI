import { env } from "../config/env.ts";
import { admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { LockManager } from "./lock.service.ts";

import { HousekeepingUtils } from "./housekeeping/housekeeping-utils.service.ts";
import { HousekeepingCleanups } from "./housekeeping/housekeeping-cleanups.service.ts";
import { HousekeepingAds } from "./housekeeping/housekeeping-ads.service.ts";
import { HousekeepingOutbox } from "./housekeeping/housekeeping-outbox.service.ts";

/**
 * Housekeeping Service
 * Odgovoran za redovno održavanje baze podataka, arhiviranje i čišćenje starih podataka.
 */
export class HousekeepingService {
  private static logger = new Logger({ service: "Housekeeping" });
  private static intervalId: NodeJS.Timeout | null = null;
  private static outboxTaskIntervalId: NodeJS.Timeout | null = null;

  /**
   * Pokreće periodične housekeeping zadatke (ako se koristi u FULL modu)
   */
  static async run() {
    this.logger.info("Housekeeping Service initialized");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        if (env.NODE_ENV === "production") {
          SystemCron.register("housekeeping_full_cycle", { pattern: "0 3 * * *" }, async () => {
            await this.runFullCycle();
          }).catch(err => this.logger.error("Failed to register full cycle cron", err));
        }

        SystemCron.register("housekeeping_outbox_tasks", { pattern: "0 */12 * * *" }, async () => {
          await this.processOutboxTasks();
        }).catch(err => this.logger.error("Failed to register outbox tasks cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static async runFullCycle() {
    const lockKey = "lock:housekeeping_full_cycle";

    const lockId = await LockManager.acquire(lockKey, 60 * 60 * 1000); // 60m lock
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
    HousekeepingUtils.startAccumulating();

    try {
      // Redosled prioriteta
      await this.expirePremiums();
      await this.reconcileGlobalStats();
      await this.archiveDeletedAds();
      await this.cleanupActivitiesAndDLQ();
      await this.cleanupOldDrafts();
      await this.cleanupAuditLogs();
      await this.cleanupOldMetrics();

      const duration = Math.round((Date.now() - startTime) / 1000);
      await HousekeepingUtils.flushAccumulated({
        durationSeconds: duration,
        lastRun: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      const { CacheService } = await import("./cache.service.ts");
      await CacheService.set("housekeeping_last_run", Date.now().toString(), 24 * 60 * 60 * 1000);
      
      this.logger.info(`Housekeeping Full Cycle completed in ${duration}s`);
    } catch (err) {
      this.logger.error("Full cycle failed", err);
      await HousekeepingUtils.flushAccumulated({ error: String(err) }, true);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static async gracefulShutdown() {
    // Handled natively by SystemCron
    this.logger.info("Housekeeping Service stopped");
  }

  static async processOutboxTasks() {
    return HousekeepingOutbox.processOutboxTasks();
  }

  static async processFanOutProfileUpdate(userId: string) {
    return HousekeepingOutbox.processFanOutProfileUpdate(userId);
  }

  static async archiveDeletedAds() {
    return HousekeepingAds.archiveDeletedAds();
  }

  static async expirePremiums() {
    return HousekeepingAds.expirePremiums();
  }

  static async cleanupActivitiesAndDLQ() {
    return HousekeepingCleanups.cleanupActivitiesAndDLQ();
  }

  static async cleanupOldDrafts() {
    return HousekeepingCleanups.cleanupOldDrafts();
  }

  static async cleanupAuditLogs() {
    return HousekeepingCleanups.cleanupAuditLogs();
  }

  static async cleanupOldMetrics() {
    return HousekeepingCleanups.cleanupOldMetrics();
  }

  static async cleanupAlgoliaOrphans() {
    return HousekeepingCleanups.cleanupAlgoliaOrphans();
  }

  static async reconcileGlobalStats() {
    const { AdminStatsService } = await import("./admin-stats.service.ts");
    this.logger.info("Triggering safe global stats reconciliation via AdminStatsService...");
    
    const results = await AdminStatsService.reconcileGlobalStats();
    
    await HousekeepingUtils.updateStatus("reconcileGlobalStats", {
      status: "completed",
      verifiedCounts: results,
      timestamp: new Date().toISOString()
    });
    
    return results;
  }
}
