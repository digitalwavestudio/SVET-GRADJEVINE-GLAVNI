import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service.ts";
import { AdminDlqService } from "../services/admin-dlq.service.ts";
import { AdminModerationService } from "../services/admin-moderation.service.ts";
import { AdminSystemService } from "../services/admin-system.service.ts";
import { initMigrations } from "../migrations/001_initial_schema.ts";
import { db, admin } from "../config/firebase.ts";
import { logDestructiveAction } from "../utils/destructive-audit.ts";
import { NotificationService, NotificationType } from "../services/notification.service.ts";
import { getRedis } from "../utils/redis.ts";
import { resetCircuitBreakerOrCacheSchema, clearDashboardCacheSchema, sendBroadcastSchema, basePaginationQuerySchema, idParamSchema, retryDlqItemSchema, resolveReportSchema, verifyUserSchema, updateUserSchema, updateUserWalletSchema, suspendUserSchema } from "../dto/admin.dto.ts";
import { logger } from "../utils/logger.ts";

// Initialize registrations - REMOVED: Initialized in server.ts at startup
// initMigrations();

export const runMigrations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const result = await AdminService.runMigrations();
    logDestructiveAction(req, "system", "RUN_MIGRATIONS", { success: true });
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { targetUserId, isVerified } = verifyUserSchema.parse(req.body);
    const result = await AdminService.verifyUser(
      targetUserId,
      isVerified,
      req.user.uid,
    );
    logDestructiveAction(req, targetUserId, "USER_VERIFICATION", { isVerified });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { id } = idParamSchema.parse(req.params);
    const { updates } = updateUserSchema.parse(req.body);
    const result = await AdminService.updateUser(id, updates, req.user.uid);
    logDestructiveAction(req, id, "ADMIN_UPDATE_USER", { updates });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const syncClaims = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const uid = req.user.uid;
  const email = req.user.email;

  try {
    const result = await AdminService.syncClaims(uid, email);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const reindexAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const result = await AdminService.reindexAll(req.user.uid);
    logDestructiveAction(req, "system", "FORCED_REINDEX_ALL", { success: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

import { setupAlgoliaIndexSettings } from "../services/algolia.service.ts";
import { CircuitBreaker } from "../utils/circuit-breaker.ts";

export const getCircuitBreakers = (req: Request, res: Response) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  res.json(CircuitBreaker.getRegistryStats());
};

export const resetCircuitBreakerOrCache = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { name, invalidateCache, cachePrefix } = resetCircuitBreakerOrCacheSchema.parse(req.body);

    let message = "";
    if (name) {
      const resetOk = CircuitBreaker.resetByName(name);
      if (resetOk) {
        message += `Circuit breaker "${name}" je uspešno resetovan. `;
      } else {
        message += `Circuit breaker "${name}" nije pronađen. `;
      }
    }

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
  } catch (err) {
    next(err);
  }
};

export const setupAlgolia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const success = await setupAlgoliaIndexSettings();
    if (!success) {
      logDestructiveAction(req, "system", "ALGOLIA_SETUP_FAILED", {});
      return res
        .status(500)
        .json({ error: "Algolia API keys not configured or setup failed" });
    }
    logDestructiveAction(req, "system", "ALGOLIA_SETUP_SUCCESS", {});
    return res.json({
      success: true,
      message: "Algolia pretraživač uspešno konfigurisan",
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { type } = req.params;
    const { updates } = req.body;

    if (!type) return res.status(400).json({ error: "Missing type" });
    if (!updates) return res.status(400).json({ error: "Missing updates" });

    const result = await AdminService.updateSettings(
      type,
      updates,
      req.user.uid,
    );
    logDestructiveAction(req, type, "SYSTEM_SETTINGS_UPDATE", { updates });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type } = req.params;
    if (!type) return res.status(400).json({ error: "Missing type" });

    const result = await AdminService.getSettings(type);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getUsers(limit || 15, lastDocId, searchQ);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getCheckouts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getCheckouts(limit || 20, lastDocId, searchQ);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getSupportTickets = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getSupportTickets(searchQ);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAbuseReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getAbuseReports(limit || 20, lastDocId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getModerationQueue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { limit, cursor, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getModerationQueue(limit || 25, cursor, searchQ);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const editListing = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { collection, id } = req.params;
    const { updates } = req.body;

    if (!collection || !id || !updates) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await AdminService.editListing(
      collection,
      id,
      updates,
      req.user.uid,
    );
    logDestructiveAction(req, id, "ADMIN_EDIT_LISTING", { collection, updates });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const moderateListing = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { collection, id } = req.params;
    const { status, feedback } = req.body;

    if (!collection || !id || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await AdminService.moderateListing(
      collection,
      id,
      status,
      req.user.uid,
      feedback,
    );
    logDestructiveAction(req, id, "ADMIN_MODERATE_LISTING", { collection, status, feedback });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateUserWallet = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { id } = idParamSchema.parse(req.params);
    const { amount, type, reason } = updateUserWalletSchema.parse(req.body);

    const result = await AdminService.updateUserWallet(
      id,
      amount,
      type,
      req.user.uid,
      reason,
    );
    logDestructiveAction(req, id, "ADMIN_WALLET_ADJUST", { amount, type, reason });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const suspendUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, reason } = suspendUserSchema.parse(req.body);

    const result = await AdminService.suspendUser(
      id,
      status,
      req.user.uid,
      reason,
    );
    logDestructiveAction(req, id, status === "suspended" ? "ADMIN_USER_SUSPEND" : "ADMIN_USER_UNSUSPEND", { reason, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const shutdownUserAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { id } = idParamSchema.parse(req.params);
    const result = await AdminService.shutdownUserAccount(id, req.user.uid);
    logDestructiveAction(req, id, "ADMIN_USER_CASCADING_SHUTDOWN", { success: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const confirmCheckoutPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { id } = idParamSchema.parse(req.params);
    const result = await AdminService.confirmInvoicePayment(id, req.user.uid);
    logDestructiveAction(req, id, "ADMIN_CONFIRM_PAYMENT", { success: true });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

  try {
    const { limit, lastDocId } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminService.getAuditLogs(limit || 50, lastDocId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDlqItems = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const bypassCache = req.query.bypassCache === "true";
    const cacheKey = "admin:monitoring:dlq_items:v1";
    const redis = getRedis();

    if (redis && !bypassCache) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (err) {
        logger.warn("Greška pri čitanju keša za DLQ elemente", err);
      }
    }

    const limitFromQuery = basePaginationQuerySchema.parse(req.query).limit;
    const limitCount = limitFromQuery ?? 20;
    const items = await AdminDlqService.getDlqItems(limitCount);
    const response = { items };

    if (redis) {
      try {
        await redis.setex(cacheKey, 180, JSON.stringify(response)); // 3 minuta cache
      } catch (err) {
        // safe
      }
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const retryDlqItem = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { source } = retryDlqItemSchema.parse(req.body);
    const result = await AdminDlqService.retryDlqItem(id, source);

    const redis = getRedis();
    if (redis) {
      await Promise.all([
        redis.del("admin:monitoring:dlq_items:v1"),
        redis.del("admin:monitoring:diagnostics:v1"),
        redis.del("admin:monitoring:stats:v1")
      ]).catch((e: any) => logger.warn("[AdminController] Redis cache invalidation after retry:", e));
    }

    logDestructiveAction(req, id, source === 'outbox' ? "ADMIN_RETRY_OUTBOX_ITEM" : "ADMIN_RETRY_DLQ_ITEM", { source, jobType: (result as { jobType?: string }).jobType });
    res.json(result);
  } catch (err) {
    if ((err as Error).message.includes("not found") || (err as Error).message.includes("processed")) {
      return res.status(400).json({ error: (err as Error).message });
    }
    next(err);
  }
};

export const retryDlqBulk = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const retriedCount = await AdminDlqService.retryDlqBulk();

    const redis = getRedis();
    if (redis) {
      await Promise.all([
        redis.del("admin:monitoring:dlq_items:v1"),
        redis.del("admin:monitoring:diagnostics:v1"),
        redis.del("admin:monitoring:stats:v1")
      ]).catch((e: any) => logger.warn("[AdminController] Redis cache invalidation after bulk retry:", e));
    }

    logDestructiveAction(req, "system", "ADMIN_RETRY_DLQ_BULK", { retriedCount });
    res.json({ success: true, retriedCount });
  } catch (err) {
    next(err);
  }
};

export const getReportTranscript = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = req.params;
    const result = await AdminModerationService.getReportTranscript(id);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === "Report not found") return res.status(404).json({ error: "Report not found" });
    if ((err as Error).message.includes("only available for chat reports")) return res.status(400).json({ error: (err as Error).message });
    next(err);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, note } = resolveReportSchema.parse(req.body);
    const result = await AdminModerationService.resolveReport(id, status, note, req.user.uid);
    logDestructiveAction(req, id, "ADMIN_RESOLVE_REPORT", { status, note });
    res.json(result);
  } catch (err) {
    next(err);
  }
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
    logDestructiveAction(req, uid, "ADMIN_CLEAR_DASHBOARD_CACHE", { success: true, reason: reason.trim(), adminId, requestIp: ipStr, targetUserId: uid, timestamp: new Date().toISOString() });
    res.json({ success: true, message: "Dashboard caches invalidated." });
  } catch (err) {
    next(err);
  }
};

export const sendBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { audience, title, body } = sendBroadcastSchema.parse(req.body);
    
    const result = await AdminSystemService.sendBroadcast(audience, title, body);
    logDestructiveAction(req, "system", "SEND_BROADCAST_CAMPAIGN", { broadcastId: result.broadcastId, audience, reach: result.reach });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const limitNum = Math.min(basePaginationQuerySchema.parse(req.query).limit || 50, 200);
    const broadcasts = await AdminSystemService.getBroadcasts(limitNum);
    res.json(broadcasts);
  } catch (err) {
    next(err);
  }
};

export const runAuditLogsCleanup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const { HousekeepingService } = await import("../services/housekeeping.service.ts");
    const result = await HousekeepingService.cleanupAuditLogs();
    
    // Log the housekeeping event in audit logs
    const adminId = req.user?.uid || req.user?.id || "unknown";
    logDestructiveAction(req, "system", "ADMIN_RUN_AUDIT_LOGS_CLEANUP", {
      success: true,
      adminId,
      archivedCount: result.archivedCount,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: "Proces čišćenja i arhiviranja starih audit logova (starijih od 90 dana) uspešno završen.",
      archivedCount: result.archivedCount,
    });
  } catch (err) {
    next(err);
  }
};

