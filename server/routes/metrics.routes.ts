import { logger } from "../utils/logger.ts";
import express from "express";
import {
  recordEvent,
  bulkRecordEvents,
  getUserAnalytics,
  getPrometheusMetrics,
} from "../controllers/metrics.controller.ts";
import { validateRequest } from "../middleware/validate.ts";
import { viewMetricSchema } from "@svet-gradjevine/shared";
import { viewLimiter, telemetryLimiter, statsAggregationLimiter } from "../middleware/rate-limit.middleware.ts";
import { db } from "../config/firebase.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

export const metricsRouter = express.Router();

metricsRouter.get("/prometheus", getPrometheusMetrics);
metricsRouter.post(
  "/view",
  viewLimiter,
  validateRequest(viewMetricSchema),
  recordEvent,
);
metricsRouter.post("/event", viewLimiter, recordEvent);
metricsRouter.post("/bulk", bulkRecordEvents);
metricsRouter.get("/user/:userId", statsAggregationLimiter, getUserAnalytics);

// Central enterprise-level endpoint to track, filter, and save critical telemetry errors
metricsRouter.post("/telemetry", authMiddleware, telemetryLimiter, async (req: import("express").Request & { user?: { uid: string } }, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: "Nevažeći telemetrijski payload." });
    }

    const errorMsg = payload.error?.message || "";
    const errorStatus = payload.error?.status || null;
    const clientVersion = payload.clientVersion || "unknown";

    // 1. Filter out minor network fluctuations to protect Firestore write volume & cost.
    // E.g., status 0, offline drops, simple aborted requests, chunk load errors.
    const isFlapping = 
      errorMsg.includes("Failed to fetch") || 
      errorMsg.includes("NetworkError") || 
      errorMsg.includes("Network Error") || 
      errorMsg.includes("status 0") ||
      errorMsg.includes("chunk") ||
      errorMsg.includes("dynamically imported module") ||
      payload.isOffline === true;

    if (isFlapping) {
      return res.json({ success: true, filtered: true, reason: "temporary_network_fluctuation" });
    }

    // 2. Identify and classify critical errors (crashes, uploads, timeout failures)
    let isCritical = false;
    let category = "unclassified_telemetry";

    const isTimeout = errorMsg.toLowerCase().includes("timeout") || errorMsg.toLowerCase().includes("exceeded") || errorStatus === 408;
    const isUploadFailure = errorMsg.toLowerCase().includes("upload") || errorMsg.toLowerCase().includes("multermemory") || errorMsg.toLowerCase().includes("signature");
    const isClientCrash = payload.type === "client_crash" || errorMsg.toLowerCase().includes("cannot read property") || errorMsg.toLowerCase().includes("is not defined") || errorMsg.toLowerCase().includes("null");

    if (isTimeout) {
      isCritical = true;
      category = "timeout_anomaly";
    } else if (isUploadFailure) {
      isCritical = true;
      category = "upload_failure_anomaly";
    } else if (isClientCrash) {
      isCritical = true;
      category = "client_crash_anomaly";
    } else if (payload.severity === "error" || errorStatus >= 500) {
      isCritical = true;
      category = "critical_mutation_error";
    }

    // Only store significant anomalies in DB to avoid cost inflation
    if (isCritical) {
      logger.warn(`Anomaly detected: ${category}`, {
        action: category,
        uid: req.user?.uid || payload.uid || "anonymous",
        clientVersion,
        url: payload.url || "unknown",
        error: {
          name: payload.error?.name || "TelemetryError",
          message: errorMsg,
          stack: payload.error?.stack || null,
          status: errorStatus,
        },
        mutation: payload.mutation || null,
        ip: req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress || "unknown",
      });
    }

    return res.json({ success: true, logged: isCritical, category });
  } catch (err) {
    console.error("[Telemetry API Error] Failed to write telemetry event:", err);
    return res.status(500).json({ error: "Interna greška pri obradi telemetrijskih podataka." });
  }
});

