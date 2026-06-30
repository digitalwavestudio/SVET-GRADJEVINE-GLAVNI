import express from "express";
import { AdminMonitoringController } from "../controllers/admin-monitoring.controller.ts";
import { MonitoringService } from "../services/monitoring.service.ts";
import { performanceBenchmark } from "../middleware/benchmark.middleware.ts";
import { logger } from "../utils/logger.ts";
import {
  verifyUser,
  syncClaims,
  runMigrations,
  updateUser,
  reindexAll,
  updateSettings,
  getSettings,
  getModerationQueue,
  getUsers,
  getCheckouts,
  getSupportTickets,
  getAbuseReports,
  setupAlgolia,
  getCircuitBreakers,
  resetCircuitBreakerOrCache,
  moderateListing,
  editListing,
  updateUserWallet,
  suspendUser,
  getAuditLogs,
  confirmCheckoutPayment,
  clearDashboardCache,
  sendBroadcast,
  getBroadcasts,
  runAuditLogsCleanup,
  shutdownUserAccount,
} from "../controllers/admin.controller.ts";
import { validateRequest, validateSettings } from "../middleware/validate.ts";
import { verifyUserSchema } from "@svet-gradjevine/shared";
import { adminTriggerLimiter } from "../middleware/rate-limit.middleware.ts";
import { requireScope } from "../middleware/auth.middleware.ts";
import { AppScope } from "../services/authorization.service.ts";

export const adminRouter = express.Router();

adminRouter.use(performanceBenchmark);

adminRouter.get("/monitoring", async (req, res) => {
  const { breaker } = await import("./bff.routes.ts");

  const currentState = await breaker.getState();
  if (currentState === "OPEN") {
    logger.warn("[CircuitBreaker] Admin /monitoring serving sandbox admin data due to OPEN state or active Quota protection.");
    return res.json({
      status: "warning",
      message: "Platforma radi u bezbednosnom (Sandbox) režimu zbog preopterećenja ili iscrpljene kvote.",
      quotaProtectionActive: true,
      circuitBreakerOpen: currentState === "OPEN",
      errors: []
    });
  }

  try {
    const bypass = req.query.bypassCache === "true";
    const stats = await MonitoringService.getStats(bypass);
    if (stats && (stats as { status?: string }).status !== "error") {
      breaker.recordSuccess().catch(err => console.error("[CircuitBreaker] recordSuccess failed:", err));
    } else {
      breaker.recordFailure().catch(err => console.error("[CircuitBreaker] recordFailure failed:", err));
    }
    res.json(stats);
  } catch (err) {
    console.error("[CircuitBreaker] Admin /monitoring failed", err);
    await breaker.recordFailure().catch(err => console.error("[CircuitBreaker] recordFailure failed:", err));
    res.status(503).json({
      status: "warning",
      message: "Platforma radi u bezbednosnom (Sandbox) režimu zbog preopterećenja ili iscrpljene kvote.",
      quotaProtectionActive: true,
      circuitBreakerOpen: true,
      errors: []
    });
  }
});

import { AlertingService } from "../services/alerting.service.ts";
import { getRedis } from "../utils/redis.ts";

adminRouter.get("/seo/crawler-telemetry", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), async (req, res) => {
  try {
    const redis = getRedis();
    if (!redis) {
      return res.status(503).json({ error: "Redis not available" });
    }

    const [
      botHits,
      botPaths,
      edgeHitsStr,
      edgeMissesStr,
      trapBlocksStr,
    ] = await Promise.all([
      redis.hgetall("metrics:bot_hits"),
      redis.hgetall("metrics:bot_paths"),
      redis.get("metrics:seo_edge_hits"),
      redis.get("metrics:seo_edge_misses"),
      redis.get("metrics:bot_trap_blocks")
    ]);

    const edgeHits = parseInt(edgeHitsStr || "0", 10);
    const edgeMisses = parseInt(edgeMissesStr || "0", 10);
    const totalRequests = edgeHits + edgeMisses;
    const hitRatio = totalRequests > 0 ? (edgeHits / totalRequests) * 100 : 0;
    
    // Check Discord alerting condition
    if (totalRequests > 1000 && hitRatio < 90) {
      await AlertingService.sendCacheHitDropAlert(hitRatio.toFixed(2) + "%");
    }

    // AI scraper share
    let aiScraperCount = 0;
    let totalBotCount = 0;
    if (botHits) {
      for (const [key, valStr] of Object.entries(botHits)) {
          if (key.startsWith("total:")) {
              const val = parseInt((valStr as string) || "0", 10);
              totalBotCount += val;
              if (key === "total:AI_SCRAPER") {
                  aiScraperCount += val;
              }
          }
      }
    }

    const aiScraperShare = totalBotCount > 0 ? (aiScraperCount / totalBotCount) * 100 : 0;

    let totalDurationMs = 0;
    const totalDurationSamples = 0;
    if (botPaths) {
      for (const [key, valStr] of Object.entries(botPaths)) {
        if (key.includes(":duration")) {
            const val = parseInt((valStr as string) || "0", 10);
            totalDurationMs += val;
        }
      }
    }
    
    // avgLatencyMs approx assuming totalBotCount ~ totalDurationSamples for bots
    const avgLatencyMs = totalBotCount > 0 ? totalDurationMs / totalBotCount : 0;

    res.json({
      crawlerTelemetry: {
        edgeCacheHitRatio: hitRatio.toFixed(2) + "%",
        edgeHits,
        edgeMisses,
        spamBotsBlockedByInlineTrap: parseInt(trapBlocksStr || "0", 10),
        aiScraperShare: aiScraperShare.toFixed(2) + "%",
        aiScraperTotal: aiScraperCount,
        ssrAverageLatencyMs: avgLatencyMs.toFixed(2),
        totalAnalyzedBotHits: totalBotCount
      }
    });

  } catch (err) {
    console.error("[Admin Monitoring] Crawler telemetry error", err);
    res.status(500).json({ error: "Failed to fetch crawler telemetry" });
  }
});

adminRouter.get("/moderation-queue", adminTriggerLimiter, requireScope(AppScope.ADS_MODERATE), getModerationQueue);
adminRouter.get("/settings/:type", requireScope(AppScope.SYSTEM_ADMIN), getSettings);
adminRouter.get("/users", adminTriggerLimiter, requireScope(AppScope.USER_READ), getUsers);
adminRouter.get("/checkouts", adminTriggerLimiter, requireScope(AppScope.FINANCE_READ), getCheckouts);
adminRouter.get("/support-tickets", adminTriggerLimiter, requireScope(AppScope.USER_MODERATE), getSupportTickets);
adminRouter.get("/abuse-reports", adminTriggerLimiter, requireScope(AppScope.USER_MODERATE), getAbuseReports);
adminRouter.post("/verify-user", validateRequest(verifyUserSchema), requireScope(AppScope.USER_MODERATE), verifyUser);
adminRouter.patch("/users/:id", adminTriggerLimiter, requireScope(AppScope.USER_EDIT), updateUser);
adminRouter.get("/circuit-breakers", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), getCircuitBreakers);
adminRouter.post("/circuit-breakers/reset", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), resetCircuitBreakerOrCache);
adminRouter.post("/sync-claims", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), syncClaims);
adminRouter.post("/migrations/run", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), runMigrations);
adminRouter.post("/sync/reindex", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), reindexAll);
adminRouter.post("/sync/algolia-setup", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), setupAlgolia);
adminRouter.patch("/settings/:type", adminTriggerLimiter, validateSettings, requireScope(AppScope.SYSTEM_ADMIN), updateSettings);
adminRouter.post("/cache/clear-dashboard", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), clearDashboardCache);
adminRouter.post("/housekeeping/cleanup-audit-logs", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), runAuditLogsCleanup);
adminRouter.post("/broadcast", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), sendBroadcast);
adminRouter.get("/broadcasts", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), getBroadcasts);

adminRouter.get("/audit-logs", adminTriggerLimiter, requireScope(AppScope.SYSTEM_ADMIN), getAuditLogs);
adminRouter.post(
  "/moderate/:collection/:id",
  adminTriggerLimiter,
  requireScope(AppScope.ADS_MODERATE),
  moderateListing,
);
adminRouter.patch(
  "/moderate/:collection/:id",
  adminTriggerLimiter,
  requireScope(AppScope.ADS_EDIT),
  editListing,
);
adminRouter.post("/users/:id/balance", adminTriggerLimiter, requireScope(AppScope.FINANCE_ADJUST), updateUserWallet);
adminRouter.post("/users/:id/suspend", adminTriggerLimiter, requireScope(AppScope.USER_SUSPEND), suspendUser);
adminRouter.post("/users/:id/shutdown", adminTriggerLimiter, requireScope(AppScope.USER_DELETE), shutdownUserAccount);
adminRouter.post(
  "/checkouts/:id/confirm",
  adminTriggerLimiter,
  requireScope(AppScope.FINANCE_ADJUST),
  confirmCheckoutPayment,
);

import {
  getDlqItems,
  retryDlqItem,
  getReportTranscript,
  resolveReport,
  retryDlqBulk,
} from "../controllers/admin.controller.ts";
adminRouter.get("/monitoring/diagnostics", AdminMonitoringController.getDiagnostics);
adminRouter.post("/monitoring/run-diagnostics", AdminMonitoringController.runDiagnosticsScript);
adminRouter.post("/monitoring/circuit-breakers/:name/reset", AdminMonitoringController.resetCircuitBreaker);
adminRouter.get("/dlq", adminTriggerLimiter, getDlqItems);
adminRouter.post("/dlq/retry", adminTriggerLimiter, retryDlqBulk);
adminRouter.post("/dlq/:id/retry", adminTriggerLimiter, retryDlqItem);

adminRouter.get(
  "/abuse-reports/:id/transcript",
  adminTriggerLimiter,
  getReportTranscript,
);
adminRouter.post(
  "/abuse-reports/:id/resolve",
  adminTriggerLimiter,
  resolveReport,
);
