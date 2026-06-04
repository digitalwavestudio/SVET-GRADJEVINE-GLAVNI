import { db, admin } from "../../config/firebase.ts";
import { Logger } from "../../utils/logger.ts";
import { LockManager } from "../lock.service.ts";

export class HousekeepingOutbox {
  private static logger = new Logger({ service: "HousekeepingOutbox" });

  static async processOutboxTasks() {
    const lockKey = "lock:outbox_tasks_worker";
    const lockId = await LockManager.acquire(lockKey, 5 * 60 * 1000);
    if (!lockId) {
      return;
    }

    try {
      const { CacheService } = await import("../cache.service.ts");
      const isEmpty = await CacheService.get<boolean>("outbox_is_empty");
      if (isEmpty === true) {
          // IMPLEMENTATION: Exponential Backoff for scanning
          const backoffLevel = await CacheService.get<number>("outbox_backoff_level") || 1;
          const lastBacklogCheck = await CacheService.get<number>("outbox_last_empty_at") || 0;
          const waitTimeMs = Math.min(15 * 60 * 1000, (2 ** (backoffLevel - 1)) * 60000); // 1, 2, 4, 8, 15 min
          
          if (Date.now() - lastBacklogCheck < waitTimeMs) {
            this.logger.info(`[OutboxWorker] Skipping: Backoff active (${waitTimeMs/60000}m wait). Empty backlog confirmed.`);
            return;
          }
      }

      this.logger.info(
        "[OutboxWorker] Starting outbox task processing cycle...",
      );
      const snapshot = await db
        .collection("outbox_tasks")
        .where("status", "in", ["pending", "failed"])
        .limit(50)
        .get();

      if (snapshot.empty) {
        this.logger.info("[OutboxWorker] No pending tasks found. Increasing backoff.");
        const currentLevel = await CacheService.get<number>("outbox_backoff_level") || 0;
        await CacheService.set("outbox_backoff_level", Math.min(5, currentLevel + 1), 24 * 60 * 60 * 1000);
        await CacheService.set("outbox_is_empty", true, 60 * 60 * 1000);
        await CacheService.set("outbox_last_empty_at", Date.now(), 60 * 60 * 1000);
        return;
      }
      
      await CacheService.set("outbox_is_empty", false, 60 * 60 * 1000);
      await CacheService.set("outbox_backoff_level", 1, 60 * 60 * 1000);
      await CacheService.set("outbox_last_empty_at", 0, 60 * 60 * 1000);

      this.logger.info(
        `[OutboxWorker] Found ${snapshot.size} pending outbox tasks.`,
      );

      for (const doc of snapshot.docs) {
        const task = doc.data();

        if (task.retryCount && task.retryCount >= 3) {
          await doc.ref.update({
            status: "permanently_failed",
            updatedAt: new Date().toISOString(),
          });
          continue;
        }

        try {
          await doc.ref.update({
            status: "processing",
            updatedAt: new Date().toISOString(),
          });

          if (task.type === "FAN_OUT_PROFILE_UPDATE") {
            const userId = task.payload.userId;
            await this.processFanOutProfileUpdate(userId);
          }

          await doc.ref.update({
            status: "completed",
            updatedAt: new Date().toISOString(),
          });
        } catch (error: any) {
          const currentRetry = (task.retryCount || 0) + 1;
          this.logger.error(
            `[OutboxWorker] Task ${doc.id} failed. Attempt ${currentRetry}`,
            error,
          );
          await doc.ref.update({
            status: "failed",
            error: error.message || "Unknown error",
            retryCount: currentRetry,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      this.logger.error(
        "[OutboxWorker] Uncaught error during processing",
        error,
      );
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static async processFanOutProfileUpdate(userId: string) {
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data();
    if (!userData) return;

    const authorSnapshot = {
      displayName: userData.displayName || "",
      photoURL: userData.photoURL || "",
      isVerified: userData.isVerified || false,
      role: userData.role || "standard",
      companyName:
        userData.businessProfile?.companyName ||
        userData.businessProfile?.name ||
        userData.company ||
        "",
    };

    const syncData = {
      authorSnapshot,
      comp: authorSnapshot.companyName || userData.displayName || "Kompanija",
      logo: userData.businessProfile?.logo || userData.photoURL || "",
      isCompanyVerified: userData.isVerified || false,
    };

    const collections = ["listings", "marketplaces", "machine_listings"];
    
    for (const coll of collections) {
      const snap = await db.collection(coll).where("authorId", "==", userId).count().get();
      if (snap.data().count > 0) {
        this.logger.info(`Audit: Need to fan-out profile update for ${snap.data().count} items in ${coll}`);
      }
    }
  }
}
