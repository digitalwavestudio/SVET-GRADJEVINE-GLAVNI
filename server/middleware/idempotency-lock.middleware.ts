import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { RedisLockManager } from "../utils/redis-lock.ts";

/**
 * Per-route idempotency middleware based on a short-lived Redis lock.
 *
 * Distinct from `idempotency.middleware.ts` (global, which caches full responses
 * via IdempotencyService). This one only guarantees that two identical
 * state-changing requests cannot execute concurrently within the TTL window —
 * useful for ad/application/user creation buttons that can be double-clicked.
 *
 * Moved from server/middlewares/ → server/middleware/ for folder consistency.
 */
interface IdempotencyOptions {
  ttl?: number; // TTL in seconds
}

export const idempotency = (options: IdempotencyOptions = { ttl: 5 }) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply to state-changing methods
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    // Try to get X-Idempotency-Key from header, fallback to hashing body + user
    let idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!idempotencyKey) {
      const payloadString = JSON.stringify(req.body || {});
      const userStr = (req as Request & { user?: { uid: string } }).user?.uid || req.ip || "anonymous";
      idempotencyKey = crypto
        .createHash("sha256")
        .update(`${req.method}:${req.originalUrl}:${userStr}:${payloadString}`)
        .digest("hex");
    }

    const lockKey = `idempotency:${idempotencyKey}`;
    const ttlMs = (options.ttl || 5) * 1000;

    try {
      const lockId = await RedisLockManager.acquire(lockKey, ttlMs);

      if (!lockId) {
        res.status(409).json({
          success: false,
          error: "Idempotency conflict: A request with this payload or key is already being processed. Please try again later.",
          code: "CONFLICT",
        });
        return;
      }

      // We attach the lockId to res.locals so we can release it early if needed,
      // but standard idempotency relies on TTL to expire so that duplicate rapid requests are blocked.
      res.locals.idempotencyLockId = lockId;
      res.locals.idempotencyKey = lockKey;

      next();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[Idempotency] Middleware Error:", errorMsg);
      next(); // Fail open if Redis is down
    }
  };
};
