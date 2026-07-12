import { Request, Response, NextFunction } from "express";
import { AdminSettingsService } from "../services/admin/admin-settings.service.ts";
import { AdminSystemService } from "../services/admin/admin-system.service.ts";
import { AdminLogsService } from "../services/admin/admin-logs.service.ts";
import { AuditService } from "../services/audit.service.ts";
import { basePaginationQuerySchema, sendBroadcastSchema, clearDashboardCacheSchema } from "../dto/admin.dto.ts";

export const runMigrations = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const result = await AdminSettingsService.runMigrations();
    AuditService.logDestructive(req, "system", "RUN_MIGRATIONS", { success: true });
    res.json({ success: true, result });
  } catch (err) { next(err); }
};

export const reindexAll = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const result = await AdminSettingsService.reindexAll(req.user.uid);
    AuditService.logDestructive(req, "system", "FORCED_REINDEX_ALL", { success: true });
    res.json(result);
  } catch (err) { next(err); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { type } = req.params;
    const { updates } = req.body;
    if (!type) return res.status(400).json({ error: "Missing type" });
    if (!updates) return res.status(400).json({ error: "Missing updates" });
    const result = await AdminSettingsService.updateSettings(type, updates, req.user.uid);
    AuditService.logDestructive(req, type, "SYSTEM_SETTINGS_UPDATE", { updates });
    res.json(result);
  } catch (err) { next(err); }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    if (!type) return res.status(400).json({ error: "Missing type" });
    const result = await AdminSettingsService.getSettings(type);
    res.json(result);
  } catch (err) { next(err); }
};

export const clearDashboardCache = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { userId, targetUserId, reason } = clearDashboardCacheSchema.parse(req.body);
    const uid = (targetUserId || userId) as string;
    await AdminSystemService.clearDashboardCache(uid);
    const adminId = req.user?.uid || "unknown";
    const ip = req.headers["x-forwarded-for"] || req.ip || req?.socket?.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    AuditService.logDestructive(req, uid, "ADMIN_CLEAR_DASHBOARD_CACHE", { success: true, reason: reason.trim(), adminId, requestIp: ipStr, targetUserId: uid, timestamp: new Date().toISOString() });
    res.json({ success: true, message: "Dashboard caches invalidated." });
  } catch (err) { next(err); }
};

export const sendBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { audience, title, body } = sendBroadcastSchema.parse(req.body);
    const result = await AdminSystemService.sendBroadcast(audience, title, body);
    AuditService.logDestructive(req, "system", "SEND_BROADCAST_CAMPAIGN", { broadcastId: result.broadcastId, audience, reach: result.reach });
    res.json(result);
  } catch (err) { next(err); }
};

export const getBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const limitNum = Math.min(basePaginationQuerySchema.parse(req.query).limit || 50, 200);
    const broadcasts = await AdminSystemService.getBroadcasts(limitNum);
    res.json(broadcasts);
  } catch (err) { next(err); }
};

export const getSupportTickets = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminLogsService.getSupportTickets(searchQ);
    res.json(result);
  } catch (err) { next(err); }
};

export const getAbuseReports = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminLogsService.getAbuseReports(limit || 20, lastDocId);
    res.json(result);
  } catch (err) { next(err); }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminLogsService.getAuditLogs(limit || 50, lastDocId);
    res.json(result);
  } catch (err) { next(err); }
};

export const runAuditLogsCleanup = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { HousekeepingService } = await import("../services/housekeeping.service.ts");
    const result = await HousekeepingService.cleanupAuditLogs();
    AuditService.logDestructive(req, "system", "ADMIN_RUN_AUDIT_LOGS_CLEANUP", {
      success: true, adminId: req.user?.uid || "unknown",
      archivedCount: result.archivedCount, timestamp: new Date().toISOString()
    });
    res.json({ success: true, message: "Proces čišćenja i arhiviranja starih audit logova (starijih od 90 dana) uspešno završen.", archivedCount: result.archivedCount });
  } catch (err) { next(err); }
};

export const setupAlgolia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { setupAlgoliaIndexSettings } = await import("../services/algolia.service.ts");
    const success = await setupAlgoliaIndexSettings();
    if (!success) {
      AuditService.logDestructive(req, "system", "ALGOLIA_SETUP_FAILED", {});
      return res.status(500).json({ error: "Algolia API keys not configured or setup failed" });
    }
    AuditService.logDestructive(req, "system", "ALGOLIA_SETUP_SUCCESS", {});
    return res.json({ success: true, message: "Algolia pretraživač uspešno konfigurisan" });
  } catch (err) { next(err); }
};

export const resetCircuitBreakerOrCache = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { invalidateCache, cachePrefix } = req.body as { invalidateCache?: boolean; cachePrefix?: string };
    let message = "";
    if (invalidateCache) {
      const { CacheService } = await import("../services/cache.service.ts");
      if (cachePrefix) {
        await CacheService.invalidateByPrefix(cachePrefix);
        message += `Keš sa prefiksom "${cachePrefix}" je uspešno očišćen. `;
      } else {
        await CacheService.clear();
        message += "Kompletan keš je uspešno očišćen. ";
      }
    }
    res.json({ success: true, message });
  } catch (err) { next(err); }
};

export const flushCache = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { prefix } = req.query as { prefix?: string };
    const { CacheService } = await import("../services/cache.service.ts");
    const { CACHE_PREFIXES } = await import("../constants/cache-keys.ts");

    if (prefix) {
      await CacheService.invalidateByPrefix(prefix);
      AuditService.logDestructive(req, "system", "ADMIN_FLUSH_CACHE", { prefix, type: "prefix" });
      return res.json({ success: true, message: `Keš sa prefiksom "${prefix}" očišćen.` });
    }

    // Clear ALL known prefixes
    const prefixes = Object.values(CACHE_PREFIXES).filter(v => typeof v === "string");
    await CacheService.invalidateByPrefixes(prefixes);
    AuditService.logDestructive(req, "system", "ADMIN_FLUSH_CACHE", { type: "all", prefixes });
    res.json({ success: true, message: `Kompletan keš (${prefixes.length} prefiksa) očišćen.` });
  } catch (err) { next(err); }
};
