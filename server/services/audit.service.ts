import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { BigQueryService } from "./bigquery.service.ts";
import crypto from 'crypto';

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

      // 2. High-Severity Security Export (BigQuery)
      if (log.severity === 'high' || log.severity === 'critical' || log.action === AuditAction.SECURITY_THREAT) {
        await this.exportToBigQuery(entry).catch(err => 
          this.logger.error("BigQuery audit export failed", err)
        );
      }

      this.logger.info(`Audit Registered: ${entry.action}`);
    } catch (error) {
      this.logger.error("Failed to process unified audit log", error);
    }
  }

  private static async exportToBigQuery(log: AuditLog) {
    const rawIp = log.ip || "0.0.0.0";
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');
    const ua = log.userAgent || 'unknown';
    
    // Automation classification logic from legacy SecurityAuditService
    const automationSigs = ['curl', 'python', 'playwright', 'puppeteer', 'selenium', 'postman', 'axios', 'headless', 'bot', 'crawler'];
    const isAutomated = automationSigs.some(sig => ua.toLowerCase().includes(sig));

    const bqRow = {
      timestamp: new Date().toISOString(),
      threat_type: log.action === AuditAction.SECURITY_THREAT ? (log.details?.type || 'unauthorized_access') : 'audit_high_severity',
      severity: log.severity || 'medium',
      user_id: log.userId || log.adminId || 'anonymous',
      ip_hash: ipHash,
      user_agent: ua,
      path: log.path || 'unknown',
      metadata: {
        ...log.details,
        client_fingerprint: crypto.createHash('sha256').update(`${ua}-${ipHash}`).digest('hex'),
        is_automated: isAutomated,
        detection_engine: "enterprise_unified_audit_v1"
      }
    };

    return BigQueryService.export('threat_analytics', [bqRow]);
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
}
