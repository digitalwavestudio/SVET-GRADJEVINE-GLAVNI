import { AdminUsersService } from "./admin/admin-users.service.ts";
import { AdminAdsService } from "./admin/admin-ads.service.ts";
import { AdminFinanceService } from "./admin/admin-finance.service.ts";
import { AdminLogsService } from "./admin/admin-logs.service.ts";
import { AdminSettingsService } from "./admin/admin-settings.service.ts";
import { AdminCleanupService } from "./admin/admin-cleanup.service.ts";

export class AdminService {
  static async runMigrations() {
    return AdminSettingsService.runMigrations();
  }

  static async updateUser(targetUserId: string, updates: Record<string, unknown>, adminId: string) {
    return AdminUsersService.updateUser(targetUserId, updates, adminId);
  }

  static async verifyUser(targetUserId: string, isVerified: boolean, adminId: string) {
    return AdminUsersService.verifyUser(targetUserId, isVerified, adminId);
  }

  static async editListing(collection: string, id: string, updates: Record<string, unknown>, adminId: string) {
    return AdminAdsService.editListing(collection, id, updates, adminId);
  }

  static async moderateListing(collection: string, id: string, status: "approved" | "rejected", adminId: string, feedback?: string) {
    return AdminAdsService.moderateListing(collection, id, status, adminId, feedback);
  }

  static async updateUserWallet(userId: string, amount: number, type: "add" | "set", adminId: string, reason: string) {
    return AdminFinanceService.updateUserWallet(userId, amount, type, adminId, reason);
  }

  static async suspendUser(userId: string, status: "active" | "suspended", adminId: string, reason: string) {
    return AdminUsersService.suspendUser(userId, status, adminId, reason);
  }

  static async shutdownUserAccount(targetUserId: string, adminId: string) {
    return AdminCleanupService.shutdownUserAccount(targetUserId, adminId);
  }

  static async getAuditLogs(limitCount = 50, lastDocId?: string) {
    return AdminLogsService.getAuditLogs(limitCount, lastDocId);
  }

  static async syncClaims(uid: string, userAuthOriginalEmail?: string) {
    return AdminUsersService.syncClaims(uid, userAuthOriginalEmail);
  }

  static async reindexAll(adminId: string) {
    return AdminSettingsService.reindexAll(adminId);
  }

  static async updateSettings(type: string, updates: Record<string, unknown>, adminId: string) {
    return AdminSettingsService.updateSettings(type, updates, adminId);
  }

  static async getSettings(type: string) {
    return AdminSettingsService.getSettings(type);
  }

  static async getCheckouts(limit = 20, lastDocId?: string, searchQ?: string) {
    return AdminFinanceService.getCheckouts(limit, lastDocId, searchQ);
  }

  static async getUsers(limit = 15, lastDocId?: string, searchQ?: string) {
    return AdminUsersService.getUsers(limit, lastDocId, searchQ);
  }

  static async getSupportTickets(searchQ?: string) {
    return AdminLogsService.getSupportTickets(searchQ);
  }

  static async getAbuseReports(limitCount = 20, lastDocId?: string) {
    return AdminLogsService.getAbuseReports(limitCount, lastDocId);
  }

  static async confirmInvoicePayment(checkoutId: string, adminId: string) {
    return AdminFinanceService.confirmInvoicePayment(checkoutId, adminId);
  }

  static async getModerationQueue(limitCount: number = 25, cursorStr?: string, searchQ?: string) {
    return AdminAdsService.getModerationQueue(limitCount, cursorStr, searchQ);
  }
}

