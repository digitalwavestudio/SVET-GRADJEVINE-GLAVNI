import type { Request, Response, NextFunction } from "express";
import { MonitoringService } from "../services/monitoring.service.ts";

let totalReads = 0;
let totalWrites = 0;

export function trackFirestoreOp(op: "read" | "write", count: number = 1) {
  if (op === "read") totalReads += count;
  if (op === "write") totalWrites += count;
}

export function getFirestoreOpsStats() {
  return { reads: totalReads, writes: totalWrites };
}

export function telemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.originalUrl.split("?")[0];
    const statusCode = res.statusCode;

    // Record high-granularity telemetry
    MonitoringService.recordRouteMetric(route, statusCode, duration);

    // Log slow requests internally
    if (duration > 3000) {
      console.warn(`[Telemetry] Slow request: ${req.method} ${req.originalUrl} (${duration}ms)`);
    }
  });

  next();
}
