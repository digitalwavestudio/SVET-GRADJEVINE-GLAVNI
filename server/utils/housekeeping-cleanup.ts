import { db } from "../config/firebase.ts";
import { Logger } from "./logger.ts";

const logger = new Logger({ service: "TelemetryHousekeeping" });

/**
 * Housekeeping cleanup for stale telemetry logs in Firestore.
 * Deletes "_logs" records older than 15 days, preserving those marked as "critical_security_incident".
 */
export async function cleanupTelemetryLogs() {
  logger.info("Starting cleanup of telemetry logs older than 15 days...");
  
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const fifteenDaysAgoIso = fifteenDaysAgo.toISOString();

    // Single-field range query is automatic and does not require complex composite indexes
    const snapshot = await db.collection("_logs")
      .where("timestamp", "<", fifteenDaysAgoIso)
      .limit(500) // Safely limit to prevent Firestore timeouts and memory issues
      .get();

    if (snapshot.empty) {
      logger.info("No telemetry logs found that are older than 15 days.");
      return;
    }

    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const isCriticalSecurityIncident = 
        data.action === "critical_security_incident" || 
        data.status === "critical_security_incident" || 
        data.severity === "critical_security_incident" ||
        data.error?.status === "critical_security_incident";

      if (!isCriticalSecurityIncident) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
      logger.info(`Successfully cleared ${deletedCount} older telemetry logs to prevent storage cost build-up.`);
    } else {
      logger.info("All scanned older logs are critical security incidents and were preserved.");
    }
  } catch (err: unknown) {
    const errObj = err as Record<string, unknown> | null | undefined;
    const errorMsg = String(errObj?.message || errObj?.details || err || "");
    const isQuotaError = 
      errorMsg.toLowerCase().includes("quota") || 
      errorMsg.toLowerCase().includes("resourceexhausted") ||
      errObj?.code === 8 ||
      errObj?.status === "RESOURCE_EXHAUSTED";

    if (isQuotaError) {
      logger.warn("Telemetry cleanup bypassed: Google Cloud/Firestore free-tier daily query/read units quota exceeded. Retrying in next interval.");
    } else {
      logger.error("Failed to execute telemetry cleanup housekeeping:", err);
    }
  }
}
