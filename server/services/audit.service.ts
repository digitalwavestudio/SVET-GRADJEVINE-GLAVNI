import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

export enum AuditAction {
  USER_VERIFIED = "USER_VERIFIED",
  USER_REJECTED = "USER_REJECTED",
  USER_SUSPENDED = "USER_SUSPENDED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  AD_APPROVED = "AD_APPROVED",
  AD_REJECTED = "AD_REJECTED",
  AD_DELETED = "AD_DELETED",
  AD_EDITED = "AD_EDITED",
  AD_CREATED = "AD_CREATED",
  CONFIG_CHANGED = "CONFIG_CHANGED",
  ADMIN_ACCESS = "ADMIN_ACCESS",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  WALLET_ADJUSTED = "WALLET_ADJUSTED",
  AUDIT_EXPORT = "AUDIT_EXPORT",
  // Auth events
  AUTH_REGISTER = "AUTH_REGISTER",
  AUTH_LOGIN = "AUTH_LOGIN",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_PASSWORD_RESET = "AUTH_PASSWORD_RESET",
  // Security events
  SECURITY_THREAT = "SECURITY_THREAT"
}

export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  adminId?: string;
  adminEmail?: string;
  userId?: string;
  action: AuditAction | string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  severity?: ThreatSeverity;
  details?: Record<string, unknown>;
  timestamp: any;
}

export class AuditService {
  private static COLLECTION = "audit_logs";
  private static logger = new Logger({ service: "AuditService" });

  /**
   * Unified Audit Logger with multi-channel export (Firestore + BigQuery)
   */
  static async log(log: Partial<AuditLog>) {
    try {
      const entry: AuditLog = {
        action: log.action || "UNKNOWN",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ...log
      };

      // 1. Permanent Store (Firestore)
      await db.collection(this.COLLECTION).add(entry).catch(err => 
        this.logger.error("Firestore audit write failed", err)
      );

      this.logger.info(`Audit Registered: ${entry.action}`);
    } catch (error) {
      this.logger.error("Failed to process unified audit log", error);
    }
  }

  static async logAdminAction(
    adminId: string,
    action: AuditAction,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>,
  ) {
    try {
      const adminDoc = await db.collection("users").doc(adminId).get();
      if (!adminDoc.exists) return;
      const adminEmail = adminDoc.data()?.email || "unknown";

      return this.log({
        adminId,
        adminEmail,
        action,
        targetType,
        targetId,
        details,
      });
    } catch (error) {
      this.logger.error("Error logging admin action", error);
    }
  }

  static async logAction(
    adminId: string,
    action: AuditAction,
    targetType: string,
    targetId: string,
    details?: Record<string, unknown>,
  ) {
    return this.logAdminAction(adminId, action, targetType, targetId, details);
  }

  static async logDestructive(
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

      console.info("[AUDIT]", JSON.stringify(logPayload));
    } catch (err) {
      console.error("[AUDIT] Error during logDestructive execution:", err);
    }
  }
}
