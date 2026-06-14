import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";

/**
 * Performance benchmarking middleware to track slow requests (>100ms)
 * specifically for high-load dashboard and BFF routes.
 */
export const performanceBenchmark = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  const path = req.originalUrl || req.url || "unknown";

  // Cleanup/Finalization listener
  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    if (durationMs > 100) {
      const user = req.user;
      const uid = String(user?.uid || req.query?.userId || "anonymous");
      const role = String(user?.role || user?.userType || "anonymous");
      const contentLength = res.get("Content-Length") || "unknown";
      
      // Determine cache level if header exists (standard practice in our CacheService)
      const cacheStatus = res.get("X-Cache") || "MISS/NONE";

      const logPayload = {
        action: durationMs > 1000 ? "slow_query_warning" : "slow_query_info",
        path,
        method: req.method,
        durationMs: Math.round(durationMs),
        uid,
        role,
        responseSize: contentLength,
        cacheStatus,
        timestamp: new Date().toISOString(),
        ip: req.headers["x-forwarded-for"] || req.ip || req.socket?.remoteAddress || "unknown",
      };

      // 1. Local Logging
      if (durationMs > 1000) {
        console.warn(`[SlowQuery Warning] ${req.method} ${path} took ${logPayload.durationMs}ms`, logPayload);
        
        // 2. Sentry Profiling (Only on extremely slow requests >1000ms)
        try {
          Sentry.withScope((scope) => {
            scope.setTag("slow_query", "true");
            scope.setTag("path", path);
            scope.setTag("user_role", role);
            scope.setUser({ id: uid });
            scope.setExtra("performance_profile", logPayload);
            
            Sentry.captureMessage(
              `Slow query warning: ${req.method} ${path} took ${logPayload.durationMs}ms`,
              "warning"
            );
          });
        } catch (err) {
          console.error('[Benchmark Middleware] Failed to record slow query warning to Sentry:', err);
        }
      } else {
        console.info(`[SlowQuery Info] ${req.method} ${path} took ${logPayload.durationMs}ms`, logPayload);
      }
    }
  });

  next();
};
