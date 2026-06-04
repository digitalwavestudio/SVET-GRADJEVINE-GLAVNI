import * as Sentry from "@sentry/node";
import { db } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

export class DLQMonitoringService {
  private static logger = new Logger({ service: "DLQMonitoring" });
  private static intervalId: NodeJS.Timeout | null = null;

  static async checkIntegrity() {
    const lockKey = "lock:dlq_monitoring";
    let lockId: string | null = null;
    try {
      const { LockManager } = await import("./lock.service");
      lockId = await LockManager.acquire(lockKey, 60 * 60 * 1000); // 1 hour
      if (!lockId) return; // Neko drugi vec radi

      const dlqSnap = await db.collection("dlq").limit(10).get();
      const count = dlqSnap.size;

      if (count > 5) {
        this.logger.warn(
          `[INTEGRITY] Found ${count} messages in DLQ. System sync might be failing.`,
        );

        Sentry.captureMessage(`DLQ Threshold Exceeded: ${count} items`, {
          level: "warning",
          extra: {
            sampleItems: dlqSnap.docs.map((d) => d.id),
          },
        });
      }
    } catch (error: any) {
      if (error?.code === 8 || error?.message?.includes("Quota")) {
        console.warn("[DLQMonitor] Skiped DLQ check (Firestore quota exceeded).");
      } else {
        console.error("[DLQMonitor] Failed to check DLQ:", error);
      }
    } finally {
      const { LockManager } = await import("./lock.service");
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static startMonitoring() {
    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        SystemCron.register("dlq_monitoring_cron", { pattern: "0 */12 * * *" }, async () => {
          await this.checkIntegrity();
        }).catch(err => this.logger.error("Failed to register DLQ cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static gracefulShutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
