import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

export class CleanupService {
  private static logger = new Logger({ service: "CleanupService" });
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Proverava korisnike i resetuje pakete ako su istekli
   */
  static async cleanupExpiredPackages() {
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      const { CacheService } = await import("./cache.service.ts");
      const lastRun = await CacheService.get<string>("last_cleanup_run");
      if (lastRun === todayStr) {
        this.logger.info(`Cleanup already run today (${todayStr}), skipping.`);
        return;
      }
    } catch (e) {
      this.logger.error("Failed to check last_cleanup_run in Redis", e);
    }

    const lockKey = "lock:cleanup_expired_packages";
    let lockId: string | null = null;
    try {
      const { LockManager } = await import("./lock.service.ts");
      lockId = await LockManager.acquire(lockKey, 2 * 60 * 60 * 1000); // 2 hours 
      if (!lockId) {
        this.logger.info("Cleanup already running (locked), skipping.");
        return;
      }
    } catch (e) {
      this.logger.error("Failed to acquire lock for cleanupExpiredPackages", e);
      return;
    }

    try {
      const { CacheService } = await import("./cache.service.ts");
      await CacheService.set("last_cleanup_run", todayStr, 25 * 60 * 60 * 1000);
    } catch (e) {
      this.logger.error("Failed to set last_cleanup_run in Redis", e);
    }



    this.logger.info("Pokretanje provere isteklih premium oglasa...");
    const now = admin.firestore.Timestamp.now();
    try {
      const snap = await db
        .collection("listings")
        .where("isPremium", "==", true)
        .where("premiumUntil", "<", now)
        .limit(200)
        .get();

      if (!snap.empty) {
        const docs = snap.docs;
        const chunkSize = 50;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const chunk = docs.slice(i, i + chunkSize);
          const batch = db.batch();
          chunk.forEach((doc) => {
            batch.update(doc.ref, {
              isPremium: false,
              premiumUntil: null,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            this.logger.info(`Resetovan premium status za oglas: ${doc.id}`);

            // Emit AD_UPDATED into outbox
            const outboxRef = db.collection("outbox").doc();
            batch.set(outboxRef, {
              type: "AD_UPDATED", 
              payload: { id: doc.id },
              status: "pending",
              attempts: 0,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              version: 1,
            });
          });

          await batch.commit();
          this.logger.info(`Uspešno resetovan batch od ${chunk.length} premium oglasa.`);
          if (i + chunkSize < docs.length) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      } else {
        this.logger.info("Nema isteklih premium oglasa za obradu.");
      }
    } catch (error: any) {
      if (
        error?.message?.includes("Quota limit exceeded") ||
        error?.details?.includes("Quota limit exceeded")
      ) {
        this.logger.warn(
          "Greška tokom čišćenja premium oglasa - Quota exceeded, preskačem...",
        );
      } else {
        this.logger.error("Greška tokom čišćenja premium oglasa:", error);
      }
    }

    // Delete all listings (including non-premium)
    this.logger.info("Brisanje svih oglasa iz Firestore...");
    try {
      const allSnap = await db.collection("listings").limit(200).get();
      if (!allSnap.empty) {
        const allDocs = allSnap.docs;
        const chunkSize = 50;
        for (let i = 0; i < allDocs.length; i += chunkSize) {
          const chunk = allDocs.slice(i, i + chunkSize);
          const batch = db.batch();
          chunk.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          this.logger.info(`Obrisano ${chunk.length} oglasa.`);
          if (i + chunkSize < allDocs.length) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        }
      } else {
        this.logger.info("Nema oglasa za brisanje.");
      }
    } catch (error: any) {
      this.logger.error("Greška tokom brisanja oglasa:", error);
    }

    // Pokreni asinhroni telemetry housekeeping cleanup
    try {
      const { cleanupTelemetryLogs } = await import("../utils/housekeeping-cleanup.ts");
      await cleanupTelemetryLogs();
    } catch (err) {
      this.logger.error("Failed to trigger telemetry housekeeping cleanup:", err);
    } finally {
      const { LockManager } = await import("./lock.service.ts");
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static async removeZombieFavorites(adId: string) {
    this.logger.info(`Pokretanje čišćenja Zombie oglasa iz favorites kolekcije za oglas: ${adId}`);
    try {
      const snap = await db
        .collection("favorites")
        .where("adId", "==", adId)
        .limit(500)
        .get();

      if (!snap.empty) {
        const batch = db.batch();
        snap.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        this.logger.info(`Uspešno obrisano ${snap.size} unosa iz favorites kolekcije za oglas ${adId}`);
      }

      // Nakon brisanja iz 'favorites' kolekcije, brišemo iz users 'favorites' niza
      try {
         const usersSnap = await db
           .collection("users")
           .where("favorites", "array-contains", adId)
           .limit(500)
           .get();
           
         if (!usersSnap.empty) {
           const userBatch = db.batch();
           usersSnap.forEach((doc) => {
             userBatch.update(doc.ref, {
               favorites: admin.firestore.FieldValue.arrayRemove(adId)
             });
           });
           await userBatch.commit();
           this.logger.info(`Uspešno obrisan zombie ad ${adId} iz ${usersSnap.size} korisničkih favorites nizova.`);
         }
         
         // Ukoliko je obrisano tačno 500 u bilo kom od dva slučaja, pozivamo ponovo
         if ((!snap.empty && snap.size === 500) || (!usersSnap.empty && usersSnap.size === 500)) {
            await this.removeZombieFavorites(adId);
         }
      } catch (uErr: any) {
         this.logger.error("Greška tokom brisanja zombie favorites iz users kolekcije", uErr);
      }
    } catch (error: any) {
      if (error?.message?.includes("Quota")) {
         this.logger.warn("Greška tokom brisanja zombie favorites - Quota exceeded.");
      } else {
         this.logger.error("Greška tokom brisanja zombie favorites", error);
      }
    }
  }

  /**
   * Registruje BullMQ zadatak
   */
  static startInterval() {
    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
         SystemCron.register("cleanup_expired_packages_cron", { pattern: "0 4 * * *" }, async () => {
             await this.cleanupExpiredPackages();
         }).catch(err => this.logger.error("Failed to register cleanup cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static gracefulShutdown() {
    // handled by SystemCron
  }
}
