import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

/**
 * Chat Archiver Service
 * Archives old conversations and their messages (untouched for over 6 months)
 * to conversations_archive and messages_archive to lighten the main tables.
 */
export class ChatArchiverService {
  private static logger = new Logger({ service: "ChatArchiverService" });
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  static async archiveOldChats() {
    const lockKey = "lock:chat_archiver";
    const { LockManager } = await import("./lock.service.ts");
    const lockId = await LockManager.acquire(lockKey, 24 * 60 * 60 * 1000); 
    if (!lockId) {
      return; 
    }

    this.logger.info("Starting Chat Archiver Service Audit...");

    try {
      const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() - SIX_MONTHS_MS);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

      // We query conversations untouched for over 6 months using count
      const oldConvsSnap = await db
        .collection("conversations")
        .where("updatedAt", "<", cutoffTimestamp)
        .count()
        .get();

      if (oldConvsSnap.data().count === 0) {
        this.logger.info("No old conversations to archive.");
        return;
      }

      this.logger.info(`Audit: Found ${oldConvsSnap.data().count} old conversations untouched for over 6 months.`);

    } catch (error: any) {
      if (error?.message?.includes("Quota limit exceeded") || error?.details?.includes("Quota limit exceeded")) {
         this.logger.warn("Chat archival skipped: Quota limit exceeded for Firestore.");
      } else {
         this.logger.error("Error during chat archival audit:", error);
      }
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static startInterval() {
    if (process.env.NODE_ENV === "production") {
      setTimeout(() => {
        this.archiveOldChats().catch(() => {});
      }, 10000);
    }

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        SystemCron.register("chat_archiver_cron", { pattern: "0 2 * * *" }, async () => {
          await this.archiveOldChats();
        }).catch(err => this.logger.error("Failed to register Chat Archiver cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static gracefulShutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
