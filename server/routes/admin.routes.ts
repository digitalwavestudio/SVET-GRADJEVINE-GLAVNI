import express from "express";
import { AdminMonitoringController } from "../controllers/admin-monitoring.controller.ts";
import { logger } from "../utils/logger.ts";
import {
  verifyUser, syncClaims, updateUser,
  getUsers, suspendUser, shutdownUserAccount,
} from "../controllers/admin-users.controller.ts";
import {
  getModerationQueue, editListing, moderateListing,
} from "../controllers/admin-ads.controller.ts";
import {
  getCheckouts, updateUserWallet, confirmCheckoutPayment,
} from "../controllers/admin-finance.controller.ts";
import {
  runMigrations, reindexAll, updateSettings, getSettings,
  clearDashboardCache, sendBroadcast, getBroadcasts,
  getSupportTickets, getAbuseReports, getAuditLogs,
  runAuditLogsCleanup, resetCircuitBreakerOrCache, setupAlgolia,
} from "../controllers/admin-settings.controller.ts";
import { validateRequest, validateSettings } from "../middleware/validate.ts";
import { verifyUserSchema } from "@svet-gradjevine/shared";
import { adminTriggerLimiter } from "../middleware/rate-limit.middleware.ts";


export const adminRouter = express.Router();


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

import { getRedis } from "../utils/redis.ts";

adminRouter.get("/seo/crawler-telemetry", adminTriggerLimiter, async (req, res) => {
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

adminRouter.get("/moderation-queue", adminTriggerLimiter, getModerationQueue);
adminRouter.get("/settings/:type", getSettings);
adminRouter.get("/users", adminTriggerLimiter, getUsers);
adminRouter.get("/checkouts", adminTriggerLimiter, getCheckouts);
adminRouter.get("/support-tickets", adminTriggerLimiter, getSupportTickets);
adminRouter.get("/abuse-reports", adminTriggerLimiter, getAbuseReports);
adminRouter.post("/verify-user", validateRequest(verifyUserSchema), verifyUser);
adminRouter.patch("/users/:id", adminTriggerLimiter, updateUser);
adminRouter.post("/circuit-breakers/reset", adminTriggerLimiter, resetCircuitBreakerOrCache);
adminRouter.post("/sync-claims", adminTriggerLimiter, syncClaims);
adminRouter.post("/migrations/run", adminTriggerLimiter, runMigrations);
adminRouter.post("/sync/reindex", adminTriggerLimiter, reindexAll);
adminRouter.post("/sync/algolia-setup", adminTriggerLimiter, setupAlgolia);
adminRouter.patch("/settings/:type", adminTriggerLimiter, validateSettings, updateSettings);
adminRouter.post("/cache/clear-dashboard", adminTriggerLimiter, clearDashboardCache);
adminRouter.post("/housekeeping/cleanup-audit-logs", adminTriggerLimiter, runAuditLogsCleanup);
adminRouter.post("/broadcast", adminTriggerLimiter, sendBroadcast);
adminRouter.get("/broadcasts", adminTriggerLimiter, getBroadcasts);

adminRouter.get("/audit-logs", adminTriggerLimiter, getAuditLogs);
adminRouter.post(
  "/moderate/:collection/:id",
  adminTriggerLimiter,
  moderateListing,
);
adminRouter.patch(
  "/moderate/:collection/:id",
  adminTriggerLimiter,
  editListing,
);
adminRouter.post("/users/:id/balance", adminTriggerLimiter, updateUserWallet);
adminRouter.post("/users/:id/suspend", adminTriggerLimiter, suspendUser);
adminRouter.post("/users/:id/shutdown", adminTriggerLimiter, shutdownUserAccount);
adminRouter.post(
  "/checkouts/:id/confirm",
  adminTriggerLimiter,
  confirmCheckoutPayment,
);

import {
  getReportTranscript,
  resolveReport,
} from "../controllers/admin-ads.controller.ts";
adminRouter.get("/monitoring/diagnostics", AdminMonitoringController.getDiagnostics);
adminRouter.post("/monitoring/run-diagnostics", AdminMonitoringController.runDiagnosticsScript);

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
