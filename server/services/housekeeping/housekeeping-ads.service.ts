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
    this.logger.info("Starting Housekeeping: Audit Expire Premiums skipped iteration");
    const result = { totalExpired: 0 };

    try {
      const collectionsToCheck = [
        "listings",
        "companies",
        "caterings",
        "jobs",
        "machines",
        "accommodations",
        "marketplace",
        "plots",
        "real_estate",
        "users"
      ];

      for (const coll of collectionsToCheck) {
        const snap = await db.collection(coll).where("isPremium", "==", true).count().get();
        result.totalExpired += snap.data().count;
      }
    } catch (error) {
      this.logger.error(`Error counting premiums`, error);
    }

    await HousekeepingUtils.updateStatus("expirePremiums", result);
    return result;
  }
}
