import { admin, db, bucket } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

/**
 * Storage Cleanup Worker
 * Scans Firebase Storage for orphan files and deletes them.
 * Runs once every 7 days to clean up unused uploaded files.
 */
export class StorageCleanupWorker {
  private static logger = new Logger({ service: "StorageCleanupWorker" });
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Run the cleanup process for orphaned listings storage files
   */
   static async runCleanup() {
    this.logger.info("Storage Cleanup Worker is permanently disabled to prevent excessive DB reads & quota usage.");
    return;
  }

  static startInterval() {
    this.logger.info("Storage Cleanup Worker cron registration is permanently disabled.");
  }

  static gracefulShutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
