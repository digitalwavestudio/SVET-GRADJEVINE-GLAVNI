import { db } from "../config/firebase.ts";

/**
 * Centrally log any destructive actions (deletions, profile deactivations, etc.)
 * asynchronously into the "_logs" collection for security audit tracking.
 */
export async function logDestructiveAction(
  req: import("express").Request & { user?: { uid: string, email?: string, role?: string } },
  resourceId: string,
  actionType: string,
  additionalDetails: Record<string, unknown> = {}
) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.ip || req?.socket?.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const userObj = req.user as Record<string, unknown> | undefined;
    const uid = req.user?.uid || userObj?.id || userObj?.uid || "unknown";
    const timestamp = new Date().toISOString();

    const logPayload = {
      ip: ipStr,
      timestamp,
      uid,
      resourceId,
      action: actionType,
      details: additionalDetails,
    };

    // Asynchronously log to console for Google Cloud Logging, avoiding unnecessary Firestore writes
    console.log("[AUDIT]", JSON.stringify(logPayload));
  } catch (err) {
    console.error("[AUDIT] Error during logDestructiveAction execution:", err);
  }
}
