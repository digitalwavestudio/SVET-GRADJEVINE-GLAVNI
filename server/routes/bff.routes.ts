import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import compression from "compression";


import {
  getDashboardBff,
  getHomepageBff,
  getDashboardMetrics
} from "../controllers/bff.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { dashboardAuthMiddleware } from "../middleware/dashboard-auth.middleware.ts";
import { dashboardLimiter } from "../middleware/rate-limit.middleware.ts";
import { CacheService } from "../services/cache.service.ts";
import { getErrorMessage } from "../utils/error-handler.ts";
import { logger } from "../utils/logger.ts";

export const bffRouter = Router();

// Strict validation patterns for user IDs and roles to prevent injections
const firebaseUidPattern = /^[a-zA-Z0-9_-]+$/;
const rolePattern = /^[a-zA-Z0-9_-]+$/;

const bffParamsSchema = z.object({
  userId: z.string().min(5).max(128).regex(firebaseUidPattern, "Neispravan format za userId").optional(),
  targetUserId: z.string().min(5).max(128).regex(firebaseUidPattern, "Neispravan format za targetUserId").optional(),
  role: z.string().min(2).max(50).regex(rolePattern, "Neispravan format za ulogu").optional(),
}).strict();

// Middleware to sanitize and validate BFF inputs
export function validateBffInputs(req: Request, res: Response, next: NextFunction) {
  try {
    const inputsToCheck: any = {};

    // Collect variables if defined
    const queryUid = req.query?.userId || req.query?.uid;
    const queryTargetUid = req.query?.targetUserId;
    const queryRole = req.query?.role;

    const bodyUid = req.body?.userId || req.body?.uid;
    const bodyTargetUid = req.body?.targetUserId;
    const bodyRole = req.body?.role;

    const paramsUid = req.params?.userId || req.params?.uid;
    const paramsTargetUid = req.params?.targetUserId;
    const paramsRole = req.params?.role;

    if (queryUid !== undefined) inputsToCheck.userId = queryUid;
    if (queryTargetUid !== undefined) inputsToCheck.targetUserId = queryTargetUid;
    if (queryRole !== undefined) inputsToCheck.role = queryRole;

    if (bodyUid !== undefined) inputsToCheck.userId = bodyUid;
    if (bodyTargetUid !== undefined) inputsToCheck.targetUserId = bodyTargetUid;
    if (bodyRole !== undefined) inputsToCheck.role = bodyRole;

    if (paramsUid !== undefined) inputsToCheck.userId = paramsUid;
    if (paramsTargetUid !== undefined) inputsToCheck.targetUserId = paramsTargetUid;
    if (paramsRole !== undefined) inputsToCheck.role = paramsRole;

    // Validate if any keys were gathered
    if (Object.keys(inputsToCheck).length > 0) {
      bffParamsSchema.parse(inputsToCheck);
    }

    next();
  } catch (err: unknown) {
    console.error("[BFF Validation Error] Malicious or invalid input pattern detected:", err);
    return res.status(400).json({
      success: false,
      error: "Odbijen nebezbedan ili nevalidan format parametara.",
      details: (err && typeof err === 'object' && 'errors' in err) ? (err as any).errors : []
    });
  }
}



// State-machine based Circuit Breaker pattern implementation to protect Firestore database performance
class BffDashboardCircuitBreaker {
  private readonly FAILURE_THRESHOLD = 5;
  private readonly FAILURE_WINDOW_MS = 10000; // 10 seconds
  private readonly COOLING_PERIOD_MS = 60000; // 60 seconds cooling off period
  private readonly STATE_KEY = "cb:dashboard:state";
  private readonly FAILURE_KEY = "cb:dashboard:failures";
  private readonly LAST_CHANGE_KEY = "cb:dashboard:lastChange";

  // Cache fallback state locally for speed or if Redis goes down, but write to Redis
  private localState: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private localFailures: number[] = [];
  private localLastStateChange: number = Date.now();

  public async getState(): Promise<"CLOSED" | "OPEN" | "HALF_OPEN"> {
    await this.syncFromRedis();
    await this.updateState();
    return this.localState;
  }

  private async syncFromRedis() {
    try {
      const state = await CacheService.get<"CLOSED" | "OPEN" | "HALF_OPEN">(this.STATE_KEY);
      const failures = await CacheService.get<number[]>(this.FAILURE_KEY);
      const lastChange = await CacheService.get<number>(this.LAST_CHANGE_KEY);

      if (state) this.localState = state;
      if (failures) this.localFailures = failures;
      if (lastChange) this.localLastStateChange = lastChange;
    } catch (err) {
      logger.warn("[CircuitBreaker] Failed to sync circuit breaker state from Redis. Using local memory fallback.", err);
    }
  }

  private async writeToRedis() {
    try {
      // Keep state in Redis with generous TTL (e.g. 1 day)
      const ttl = 24 * 60 * 60 * 1000;
      await CacheService.set(this.STATE_KEY, this.localState, ttl);
      await CacheService.set(this.FAILURE_KEY, this.localFailures, ttl);
      await CacheService.set(this.LAST_CHANGE_KEY, this.localLastStateChange, ttl);
    } catch (err) {
      logger.warn("[CircuitBreaker] Failed to write circuit breaker state to Redis.", err);
    }
  }

  private async updateState() {
    const now = Date.now();
    if (this.localState === "OPEN" && now - this.localLastStateChange > this.COOLING_PERIOD_MS) {
      this.localState = "HALF_OPEN";
      this.localLastStateChange = now;
      logger.debug("[CircuitBreaker] Transitioned to HALF_OPEN (distributed). Probing connection with next request.");
      await this.writeToRedis();
    }
  }

  public async recordSuccess() {
    await this.syncFromRedis();
    if (this.localState === "HALF_OPEN") {
      this.localState = "CLOSED";
      this.localFailures = [];
      this.localLastStateChange = Date.now();
      logger.debug("[CircuitBreaker] Transitioned to CLOSED (distributed). Connection is healthy.");
      await this.writeToRedis();
    }
  }

  public async recordFailure() {
    await this.syncFromRedis();
    const now = Date.now();
    this.localFailures.push(now);
    // keep only failures in the last 10 seconds
    this.localFailures = this.localFailures.filter(t => now - t <= this.FAILURE_WINDOW_MS);

    if (this.localState === "CLOSED" || this.localState === "HALF_OPEN") {
      if (this.localFailures.length >= this.FAILURE_THRESHOLD) {
        this.localState = "OPEN";
        this.localLastStateChange = now;
        logger.warn(`[CircuitBreaker] TRIPPED to OPEN (distributed) due to ${this.localFailures.length} failures in 10s. Cooling down for 60s.`);
      }
    }
    await this.writeToRedis();
  }
}

export const breaker = new BffDashboardCircuitBreaker();
export { BffDashboardCircuitBreaker };

bffRouter.get(
  "/dashboard",
  compression({ threshold: 512 }),
  requireAuth,
  validateBffInputs,
  dashboardAuthMiddleware,
  dashboardLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const state = await breaker.getState();
    const role = req.user?.role || req.user?.userType || "";
    const isAdmin = role === "admin" || req.user?.isAdmin === true;

    // 1. If Circuit Breaker is OPEN, serve fallback sandbox dataset immediately without hitting database
    if (state === "OPEN") {
      logger.warn(`[CircuitBreaker] Circuit is OPEN. Serving STALE cache fallback for user: ${req.user?.uid || "unknown"}`);
      const staleData = (await CacheService.get(`bff_cache_tiered:${req.user?.uid || req.user?.id}:${role}`, true)) || {};
      return res.json({
         ...(typeof staleData === "object" ? staleData : {}),
         success: true,
         _metaWarning: "Sistem je trenutno ekstremno opterećen usled povišenog saobraćaja, prikazujemo poslednju sačuvanu verziju podataka."
      });
    }

    // Wrap Express response mechanisms to intercept outcome
    const originalJson = res.json;
    res.json = function (body) {
      if (res.headersSent) return this as unknown as import("express").Response;
      if (body && body.success) {
        breaker.recordSuccess().catch((err) => {
          console.error("[CircuitBreaker] Failed to record success", err);
        });
      } else {
        breaker.recordFailure().catch((err) => {
          console.error("[CircuitBreaker] Failed to record failure", err);
        });
      }
      return originalJson.call(this, body);
    };

    try {
      const originalNext = next;
      // Overwrite next to capture errors passed to error handlers
      const customNext = async (err?: unknown) => {
        if (err) {
          const error = err as Error;
          console.error("[CircuitBreaker] Intercepted database/BFF error:", error.message || err);
          await breaker.recordFailure().catch(err => console.error("[CircuitBreaker] recordFailure in customNext failed:", err));

          const currentState = await breaker.getState();
          if (currentState === "OPEN") {
            logger.warn("[CircuitBreaker] Circuit is OPEN or Quota protection is active. Rendering cache fallback.");
            const staleData = (await CacheService.get(`bff_cache_tiered:${req.user?.uid || req.user?.id}:${role}`, true)) || {};
            if (!res.headersSent) {
              return res.json({
                 ...(typeof staleData === "object" ? staleData : {}),
                 success: true,
                 _metaWarning: "Sistem je trenutno ekstremno opterećen usled povišenog saobraćaja, prikazujemo poslednju sačuvanu verziju podataka."
              });
            }
          }
        }
        return originalNext(err);
      };

      // Bezbednosni Caching Breaker
      const breakerTimeout = setTimeout(async () => {
        if (!res.headersSent) {
          logger.warn(`[LatencyBreaker] Request exceeded 15000ms for user: ${req.user?.uid}. Serving L1 memory cache fallback.`);
          const staleData = (await CacheService.get(`bff_cache_tiered:${req.user?.uid || req.user?.id}:${role}`, true)) || {};
          // Temporarily disable the breaker success/failure recording for timeout response
          res.json({
            ...(typeof staleData === "object" ? staleData : {}),
            success: true,
            _metaWarning: "Sistem je trenutno opterećen (latencija > 15000ms), prikazujemo poslednju sačuvanu verziju podataka."
          });
          breaker.recordFailure().catch(err => console.error("[CircuitBreaker] recordFailure in breakerTimeout failed:", err));
        }
      }, 15000);

      res.on("finish", () => clearTimeout(breakerTimeout));
      res.on("close", () => clearTimeout(breakerTimeout));

      await getDashboardBff(req as any, res, customNext);
    } catch (err: unknown) {
      console.error("[CircuitBreaker] Controller thrown exception:", getErrorMessage(err));
      await breaker.recordFailure().catch(err => console.error("[CircuitBreaker] recordFailure at catch block failed:", err));

      const currentState = await breaker.getState();
      if (currentState === "OPEN") {
        logger.warn("[CircuitBreaker] Circuit is OPEN. Rendering cache fallback.");
        const staleData = (await CacheService.get(`bff_cache_tiered:${req.user?.uid || req.user?.id}:${role}`, true)) || {};
        return res.json({
           ...(typeof staleData === "object" ? staleData : {}),
           success: true,
           _metaWarning: "Sistem je trenutno ekstremno opterećen usled povišenog saobraćaja, prikazujemo poslednju sačuvanu verziju podataka."
        });
      }
      next(err);
    }
  }
);

bffRouter.get(
  "/dashboard-metrics",
  compression({ threshold: 512 }),
  requireAuth,
  validateBffInputs,
  dashboardAuthMiddleware,
  dashboardLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const _origJson = res.json;
      res.json = function (body: unknown) {
        if (res.headersSent) return this as unknown as import("express").Response;
        return _origJson.call(this, body);
      };
      const originalNext = next;
      const customNext = async (err?: unknown) => {
        if (err) {
          const staleData = (await CacheService.get(`dashboard_metrics_${req.user?.uid || req.user?.id}`, true)) || {};
          if (!res.headersSent) {
            return res.json({
               success: true,
               data: typeof staleData === "object" ? staleData : {},
               _metaWarning: "Sistem je trenutno ekstremno opterećen, prikazujemo poslednje poznate podatke."
            });
          }
        }
        return originalNext(err);
      };

      const breakerTimeout = setTimeout(async () => {
        if (!res.headersSent) {
          logger.warn(`[LatencyBreaker] Request exceeded 15000ms for metrics user: ${req.user?.uid}.`);
          const staleData = (await CacheService.get(`dashboard_metrics_${req.user?.uid || req.user?.id}`, true)) || {};
          res.json({
            success: true,
            data: typeof staleData === "object" ? staleData : {},
            _metaWarning: "Sistem opterećen (latencija > 15000ms), prikazujemo poslednje poznate podatke."
          });
        }
      }, 15000);

      res.on("finish", () => clearTimeout(breakerTimeout));
      res.on("close", () => clearTimeout(breakerTimeout));

      await getDashboardMetrics(req as any, res, customNext);
    } catch (err: unknown) {
      next(err);
    }
  }
);

bffRouter.get(
  "/homepage", 
  validateBffInputs, 
  getHomepageBff
);
