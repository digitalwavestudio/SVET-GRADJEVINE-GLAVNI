// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";
import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { adminRouter } from "./admin.routes.ts";
import { z } from "zod";
import { authRouter } from "./auth.routes.ts";
import { usersRouter } from "./users.routes.ts";
import { jobsRouter } from "./jobs.routes.ts";
import { metricsRouter } from "./metrics.routes.ts";
import { mastersRouter } from "./masters.routes.ts";
import dashboardRouter from "./dashboard.routes.ts";
import { bffRouter } from "./bff.routes.ts";
import { adsRouter } from "./ads.routes.ts";
import { messagesRouter } from "./messages.routes.ts";
import { calendarRouter } from "./calendar.routes.ts";
import { constructionRouter } from "./construction.routes.ts";
import { partnersRouter } from "./partners.routes.ts";
import { checkoutRouter } from "./checkout.routes.ts";
import { walletRouter } from "./wallet.routes.ts";
import { supportRouter } from "./support.routes.ts";
import { notificationsRouter } from "./notifications.routes.ts";
import { applicationsRouter } from "./applications.routes.ts";
import { reportsRouter } from "./reports.routes.ts";
import { verificationRouter } from "./verification.routes.ts";
import { favoritesRouter } from "./favorites.routes.ts";
import { analyticsRouter } from "./analytics.routes.ts";
import { systemRouter } from "./system.routes.ts";
import { mediaRouter } from "./media.routes.ts";
import { rfqRouter } from "./rfq.routes.ts";
import telemetryRouter from "./telemetry.routes.ts";

import {
  runCleanup,
  runSitemapRebuild,
} from "../controllers/housekeeping.controller.ts";
import { firebaseConfig, ensureInitialized, db, admin } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { cacheMiddleware } from "../middleware/cache.middleware.ts";
import { requestCoalescingMiddleware } from "../middleware/coalesce.middleware.ts";
import {
  apiLimiter,
  heavyOperationsLimiter,
  adminTriggerLimiter,
} from "../middleware/rate-limit.middleware.ts";

import { requireAdmin, requireAuth, authMiddleware } from "../middleware/auth.middleware.ts";
import { RateLimiterService } from "../services/rate-limiter.service.ts";
import { JobApplicationService, applyJobContractSchema } from "../services/job-application.service.ts";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedis } from "../utils/redis.ts";

const redisInstance = getRedis();

// AGRESSIVE FIREBASE QUOTA PROTECTION LIMITER
const firestoreLimiter = rateLimit({
  windowMs: 1000, 
  limit: 100, // Increased limit for general stability
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Sačekajte trenutak, server je pod velikim opterećenjem." },
  // Optional: Skip Redis if it's down to prevent hangs
  store: new RedisStore({
    //@ts-expect-error - RedisStore expects specific sendCommand signature
    sendCommand: async (...args: string[]) => {
        try {
            const [command, ...rest] = args;
            return await redisInstance.call(command, ...rest);
        } catch (e) {
            logger.warn("[RateLimit] Redis command failed, falling back to local memory logic (simulated)", e);
            return null; 
        }
    },
  }),
});

import { statsRouter } from "./stats.routes.ts";

import { aiRouter } from "./ai.routes.ts";
import { autoValidateMiddleware, validateRequest } from "../middleware/validate.ts";


import { SSEService } from "../services/sse.service.ts";

export const apiRouter = Router();

// --- DEV ERROR LOGGER (dev only, bounded + async + rate-limited) ---
import fs from 'fs';
import path from 'path';

const DEV_LOG_ENABLED = env.NODE_ENV !== "production";
const DEV_LOG_PATH = path.join(process.cwd(), 'frontend_errors_dev.log');
// Hard cap so the log file cannot grow unbounded (rotate-truncate at 5MB)
const DEV_LOG_MAX_BYTES = 5 * 1024 * 1024;
let devLogWriteLock = Promise.resolve();

// Lightweight per-IP limiter (avoids pulling rate-limit-redis plumbing here)
const devLogHits = new Map<string, { count: number; reset: number }>();
const DEV_LOG_WINDOW_MS = 60_000;
const DEV_LOG_MAX_PER_MIN = 20;

apiRouter.post("/dev/log-error", (req, res) => {
  // Guard: never active in production
  if (!DEV_LOG_ENABLED) return res.status(404).json({ error: "Not found" });

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) as string || req.ip || 'unknown';

  // In-memory rate limit per IP (prevents log flooding / event-loop DoS)
  const now = Date.now();
  const entry = devLogHits.get(ip);
  if (!entry || now > entry.reset) {
    devLogHits.set(ip, { count: 1, reset: now + DEV_LOG_WINDOW_MS });
  } else {
    entry.count++;
    if (entry.count > DEV_LOG_MAX_PER_MIN) {
      return res.status(429).json({ error: "Too many error logs" });
    }
  }

  // Bound payload size (refuse huge bodies that could be used to bloat the log)
  const body = req.body;
  if (body && typeof body === 'object') {
    try {
      const serialized = JSON.stringify(body);
      if (serialized.length > 8192) {
        return res.status(413).json({ error: "Payload too large for error log" });
      }
    } catch {
      return res.status(400).json({ error: "Invalid payload" });
    }
  }

  const errStr = `\n[${new Date().toISOString()}] FRONTEND ERROR:\n${JSON.stringify(body, null, 2)}\n----------------------------------------\n`;

  // Serialize writes via a promise chain + async fs (no blocking event loop)
  devLogWriteLock = devLogWriteLock
    .then(() =>
      new Promise<void>((resolve) => {
        fs.stat(DEV_LOG_PATH, (statErr, stats) => {
          const open = () =>
            fs.appendFile(DEV_LOG_PATH, errStr, (e) => {
              if (e) console.error("[dev/log-error] write failed:", e);
              resolve();
            });
          if (statErr || !stats || stats.size < DEV_LOG_MAX_BYTES) {
            open();
          } else {
            // Truncate (rotate) by overwriting instead of growing forever
            fs.writeFile(DEV_LOG_PATH, errStr, () => resolve());
          }
        });
      })
    )
    .catch(() => {});

  res.status(200).send("logged");
});
// --------------------------------------


// Atomic Outbox Endpoint za poslove:
apiRouter.post(
  "/jobs/apply",
  authMiddleware,
  validateRequest(z.object({ body: applyJobContractSchema })),
  async (req, res, next) => {
    try {
      const userObj = getReqUser(req);
      const uid = userObj?.uid;
      const email = userObj?.email || "";
      const name = userObj?.name || "Korisnik";
      
      const payload = req.body;

      // Rate Limiting Security
      const canApply = await RateLimiterService.isAllowed(`job_apply:${uid}`, 1, 30);
      if (!canApply) {
        return res.status(429).json({ error: "Sačekajte trenutak pre sledeće prijave." });
      }

      const result = await JobApplicationService.applyForJobAtomic(payload, { uid, email, name });
      res.json(result);
    } catch (error) {
      console.error("[JOB_APPLY_ERR]", error);
      next(error);
    }
  }
);

apiRouter.get("/stream", requireAuth, (req, res) => {
  const uid = getReqUser(req).uid;
  SSEService.subscribe(req, res, uid);
});

// Apply auto validation and standard security middleware
apiRouter.use(autoValidateMiddleware);
apiRouter.use(apiLimiter);

// Optional Turnstile Middleware (Anti-Spam Forme)
apiRouter.use(async (req, res, next) => {
  if (req.method === "POST" && req.headers["x-turnstile-response"]) {
    const token = req.headers["x-turnstile-response"] as string;
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;

    try {
      const secretKey = env.TURNSTILE_SECRET_KEY;
      if (!secretKey) {
        logger.warn(
          "[Turnstile] TURNSTILE_SECRET_KEY is not configured on server.",
        );
        return next();
      }

      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            secret: secretKey,
            response: token,
            remoteip: ipStr,
          }).toString(),
        },
      );

      const body = (await response.json()) as {
        success: boolean;
        "error-codes"?: string[];
      };
      if (!body.success) {
        logger.warn(
          `[Turnstile] Verification failed from ${ipStr}:`,
          body["error-codes"],
        );
        await RateLimiterService.blockIp(ipStr, 1);
        return res.status(403).json({
          error: "Turnstile verifikacija nije uspela",
          details: body["error-codes"],
        });
      }
    } catch (err) {
      console.error("[Turnstile] Error during verification:", err);
      return res
        .status(403)
        .json({
          error:
            "Turnstile verifikacijski servis trenutno nedostupan ili neuspešan",
        });
    }
  }
  next();
});

// P-SEO Compute Guardrails: Restrict API generation rate for SEO bots
apiRouter.use("/stats/pseo-insights", async (req, res, next) => {
  const ua = (req.headers["user-agent"] || "").toLowerCase();
  const isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(ua);

  if (isBot) {
    const pathKey = `pseo_compute:${req.url}`;
    const allowed = await RateLimiterService.isAllowed(pathKey, 1, 86400); // 1 per 24h per location/profession metric
    if (!allowed) {
      return res
        .status(429)
        .json({ error: "P-SEO compute limit reached for today." });
    }
  }

  next();
});



// Firebase Health Check
apiRouter.get(
  "/firebase-health",
  cacheMiddleware(10000, "health"),
  async (_req, res) => {
    try {
      ensureInitialized();


      const usersSnap = await db.collection("users").limit(1).get().catch((err: any) => {
        logger.warn(`[Firebase Health Check] Quota or database request failed within get(): ${err.message || err}`);
        return null;
      });

      if (!usersSnap) {
        return res.json({
          status: "fallback",
          quotaExhausted: true,
          usersFound: 0,
          projectId: firebaseConfig.projectId,
          databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
        });
      }

      res.json({
        status: "ok",
        usersFound: usersSnap.size,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
      });
    } catch (err: any) {
      logger.error(`[Firebase Health Check] Exception caught: ${err.message || err}`);
      res.status(503).json({
        status: "fallback",
        error: err.message || String(err),
        usersFound: 0,
        projectId: firebaseConfig.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
      });
    }
  },
);

// Branding is public
import { AdminService } from "../services/admin.service.ts";
apiRouter.get(
  "/branding",
  requestCoalescingMiddleware(),
  cacheMiddleware(120000, "branding"),
  async (_req, res, next) => {
    try {
      const result = await AdminService.getSettings("branding");
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// Main Feature Routes
import { createProxyMiddleware } from "http-proxy-middleware";

// Proxy configuration for Micro-Services / Micro-Frontends Consolidation
// In a real-world multi-service deployment, we would route requests to internal VPC IPs
apiRouter.use(
  "/proxy/billing",
  createProxyMiddleware({
    target: env.BILLING_SERVICE_URL || "http://localhost:4001",
    changeOrigin: true,
    pathRewrite: { "^/api/proxy/billing": "" },
  }) as unknown as import("express").RequestHandler,
);

apiRouter.get(
  "/settings/platform",
  requestCoalescingMiddleware(),
  cacheMiddleware(120000, "settings_platform"),
  async (_req, res, next) => {
    try {
      const cacheKey = "settings_platform";
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const docSnap = await db.collection("settings").doc("platform").get();
      const data = docSnap.data() || { launchMode: true };
      await CacheService.set(cacheKey, data, 120000); // 2 minutes
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

import { searchMasters } from "../controllers/masters.controller.ts";
import { searchCompanies } from "../controllers/companies.controller.ts";

apiRouter.use("/admin", requireAdmin, adminRouter);
apiRouter.use("/ai", heavyOperationsLimiter, aiRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/user", usersRouter); // For backwards compatibility
apiRouter.use("/jobs", firestoreLimiter, heavyOperationsLimiter, jobsRouter);
apiRouter.use("/metrics", metricsRouter);
apiRouter.use("/masters", firestoreLimiter, heavyOperationsLimiter, mastersRouter);
apiRouter.use("/media", heavyOperationsLimiter, mediaRouter);
apiRouter.post("/search/masters", firestoreLimiter, heavyOperationsLimiter, searchMasters);
apiRouter.post("/search/companies", firestoreLimiter, heavyOperationsLimiter, searchCompanies);
apiRouter.use("/stats", requestCoalescingMiddleware(), statsRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/bff", bffRouter);
apiRouter.use("/ads", firestoreLimiter, heavyOperationsLimiter, adsRouter);
apiRouter.use("/partners", partnersRouter);
apiRouter.use("/checkout", checkoutRouter);
apiRouter.use("/wallet", walletRouter);
apiRouter.use("/support", supportRouter);
apiRouter.use("/rfq", heavyOperationsLimiter, rfqRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/applications", applicationsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/verification", verificationRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/telemetry", telemetryRouter);
apiRouter.use("/system", systemRouter);

// Frontend error logging (used by entry-client.tsx window.onerror handler)
apiRouter.post("/dev/log-error", async (req, res) => {
  const { message, source, lineno, colno, stack } = req.body || {};
  console.error(`[FRONTEND ERROR] ${message || "unknown"}`, { source, lineno, colno, stack });
  res.json({ success: true });
});

apiRouter.post("/logs", async (req, res) => {
  const { level, message, context, uid, url } = req.body;
  const logPrefix = `[FRONTEND LOG] [${level || "INFO"}]`;
  if (level === "error" || level === "ERROR") {
    console.error(`${logPrefix} ${message}`, { context, uid, url });
    try {
      const payload = {
        jobType: "frontend_error_sentry_fallback",
        error: message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        payload: { context, uid, url, level },
        status: "pending_review",
        source: "frontend",
        batchId: `frontend_err_${Date.now()}`,
      };
      await db.collection("dlq").add(payload);
    } catch (err) {
      console.error("Failed to write frontend log to DLQ", err);
    }
  } else {
    console.info(`${logPrefix} ${message}`, { context, uid, url });
  }
  res.json({ success: true });
});

apiRouter.use("/messages", messagesRouter);
apiRouter.use("/construction", firestoreLimiter, constructionRouter);
apiRouter.use("/calendar", calendarRouter);

// System Maintenance
apiRouter.post("/housekeeping/cleanup", adminTriggerLimiter, runCleanup);
apiRouter.post("/housekeeping/sitemap", adminTriggerLimiter, runSitemapRebuild);
