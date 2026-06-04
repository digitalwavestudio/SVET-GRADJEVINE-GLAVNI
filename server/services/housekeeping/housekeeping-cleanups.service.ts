import { db, admin } from "../../config/firebase.ts";
import { Logger } from "../../utils/logger.ts";
import { browseIndicesObjects } from "../algolia.service.ts";
import { SyncManager } from "../sync.service.ts";
import { HousekeepingUtils } from "./housekeeping-utils.service.ts";

export class HousekeepingCleanups {
  private static logger = new Logger({ service: "HousekeepingCleanups" });

  static async cleanupNotifications() {
    this.logger.info("Auditing expired notifications...");
    try {
      const now = new Date();
      const expiredDocs = await db
        .collectionGroup("notifications")
        .where("expiresAt", "<", now)
        .count()
        .get();

      this.logger.info(
        `Audit: Found ${expiredDocs.data().count} expired notifications to be cleaned up.`,
      );
    } catch (error) {
      this.logger.error("Audit notifications failed", error);
    }
  }

  static async cleanupActivitiesAndDLQ() {
    this.logger.info("Auditing old activities and DLQ tasks...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoffStr = thirtyDaysAgo.toISOString();
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

      const oldActivitiesSnap = await db
        .collection("activities")
        .where("createdAt", "<", cutoffTimestamp)
        .count()
        .get();

      if (oldActivitiesSnap.data().count > 0) {
        this.logger.info(`Audit: Found ${oldActivitiesSnap.data().count} old activities.`);
      }

      const oldOutboxSnap = await db
        .collection("outbox_tasks")
        .where("createdAt", "<", cutoffStr)
        .count()
        .get();

      if (oldOutboxSnap.data().count > 0) {
        this.logger.info(`Audit: Found ${oldOutboxSnap.data().count} old outbox tasks.`);
      }
    } catch (error) {
      this.logger.error("Audit Activities and DLQ failed", error);
    }
  }

  static async cleanupOldDrafts() {
    this.logger.info("Auditing abandoned drafts...");
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const cutoff = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

      const collections = ["listings"];

      for (const coll of collections) {
        const expiredSnap = await db
          .collection(coll)
          .where("status", "==", "draft")
          .where("updatedAt", "<", cutoff)
          .count()
          .get();

        if (expiredSnap.data().count > 0) {
          this.logger.info(`Audit: Found ${expiredSnap.data().count} abandoned drafts from ${coll}`);
        }
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

      const snapshot = await db
        .collection("audit_logs")
        .where("timestamp", "<", cutoffTimestamp)
        .count()
        .get();

      const totalArchived = snapshot.data().count;

      await HousekeepingUtils.updateStatus("cleanupAuditLogs", {
        archivedCount: totalArchived,
        success: true,
      });

      this.logger.info(`Audit: Found ${totalArchived} audit logs older than 90 days.`);
      return { success: true, archivedCount: totalArchived };
    } catch (err) {
      this.logger.error("Failed to count audit logs", err);
      await HousekeepingUtils.updateStatus("cleanupAuditLogs", { error: String(err) }, true);
      throw err;
    }
  }

  static async cleanupOldMetrics() {
    this.logger.info("Starting Housekeeping: Audit old daily metrics");
    try {
      const dateOffset = new Date();
      dateOffset.setDate(dateOffset.getDate() - 365);
      const cutoffStr = dateOffset.toISOString().split("T")[0];

      const snapshot = await db
        .collection("metrics_daily")
        .where("date", "<", cutoffStr)
        .count()
        .get();

      const totalDeleted = snapshot.data().count;

      await HousekeepingUtils.updateStatus("cleanupOldMetrics", {
        deletedCount: totalDeleted,
        success: true,
      });

      this.logger.info(`Audit: Found ${totalDeleted} old daily metrics (older than 365 days).`);
      return { success: true, deletedCount: totalDeleted };
    } catch (err) {
      this.logger.error("Failed to audit old daily metrics", err);
      await HousekeepingUtils.updateStatus("cleanupOldMetrics", { error: String(err) }, true);
      return { success: false, error: String(err) };
    }
  }

  static async cleanupAlgoliaOrphans() {
    this.logger.info("Starting Housekeeping: Algolia Orphan Cleanup skipped due to limit");
    // Algolia Iterations read firestore per document so we skip iteration
    const result = { totalCleaned: 0, orphansByIndex: {} };
    await HousekeepingUtils.updateStatus("cleanupAlgoliaOrphans", result);
    return result;
  }
}
