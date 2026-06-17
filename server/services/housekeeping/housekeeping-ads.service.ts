import { db, admin } from "../../config/firebase.ts";
import { Logger } from "../../utils/logger.ts";
import { SyncManager } from "../sync.service.ts";
import { HousekeepingUtils } from "./housekeeping-utils.service.ts";

export class HousekeepingAds {
  private static logger = new Logger({ service: "HousekeepingAds" });

  static async archiveDeletedAds() {
    this.logger.info("Starting Housekeeping: Audit Archive Deleted Ads");
    const result = { totalArchived: 0, processedCollections: ["listings"] };

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - HousekeepingUtils.ARCHIVE_AFTER_MONTHS);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

    try {
      const snapshot = await db
        .collection("listings")
        .where("status", "==", "deleted")
        .count()
        .get();

      result.totalArchived = snapshot.data().count;
    } catch (error) {
      this.logger.error(`Error auditing listings`, error);
    }

    await HousekeepingUtils.updateStatus("archiveDeletedAds", result);
    return result;
  }

  static async expirePremiums() {
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
        batch.update(doc.ref, {
          isPremium: false,
          premiumUntil: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        batchCount++;
      });

      if (batchCount > 0) {
        await batch.commit();
        result.totalExpired = batchCount;
        this.logger.info(`Expired ${batchCount} premium listings`);
      }

      // Also expire premium profile status on users collection
      try {
        const userBatch = db.batch();
        let userBatchCount = 0;

        const userSnap = await db.collection("users")
          .where("isPremiumProfile", "==", true)
          .where("premiumUntil", "<", now)
          .limit(400)
          .get();

        userSnap.docs.forEach((doc) => {
          userBatch.update(doc.ref, {
            isPremiumProfile: false,
            premiumUntil: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          userBatchCount++;
        });

        if (userBatchCount > 0) {
          await userBatch.commit();
          result.totalExpired += userBatchCount;
          this.logger.info(`Expired ${userBatchCount} premium user profiles`);
        }
      } catch (err) {
        result.totalErrors++;
        this.logger.error(`Error expiring user premium profiles`, err);
      }
    } catch (error) {
      this.logger.error(`Error in expirePremiums`, error);
    }

    await HousekeepingUtils.updateStatus("expirePremiums", result);
    return result;
  }
}
