import { Request, Response, NextFunction } from "express";
import * as Sentry from "@sentry/node";
import { MonitoringService } from "../services/monitoring.service.ts";
import { TraceContext } from "../utils/trace.ts";
import { Logger } from "../utils/logger.ts";

const logger = new Logger({ middleware: "Performance" });
const SLOW_THRESHOLD_MS = 200; // Profiling threshold: 200ms as requested

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const traceId = TraceContext.getTraceId();

  MonitoringService.runWithTrace(
    { url: req.originalUrl, method: req.method, traceId },
    () => {
      const start = process.hrtime.bigint();
      const spanName = `${req.method} ${req.originalUrl}`;

      Sentry.startSpan(
        {
          name: spanName,
          op: "http.server",
          attributes: {
            "http.method": req.method,
            "http.target": req.originalUrl,
          },
        },
        () => {
          // Prati završetak zahteva
          res.on("finish", () => {
            const end = process.hrtime.bigint();
            const durationMs = Number(end - start) / 1_000_000;

            // Globalne metrike
            MonitoringService.recordResponseTime(durationMs).catch(() => {});

            // Log status tag for the active span if possible
            try {
              const activeSpan = Sentry.getActiveSpan();
              activeSpan?.setAttribute("http.status_code", res.statusCode);
            } catch (err) {
              // safe fallback
            }

            // Identifikacija sporih zahteva (APM behavior)
            if (durationMs >= SLOW_THRESHOLD_MS) {
              const activeTrace = MonitoringService.getActiveTrace();
              logger.warn(
                `🐌 Slow Request Detected: ${req.method} ${req.originalUrl} took ${Math.round(durationMs)}ms`,
                {
                  durationMs: Math.round(durationMs),
                  thresholdMs: SLOW_THRESHOLD_MS,
                  method: req.method,
                  url: req.originalUrl,
                  ip: req.ip,
                  segments: activeTrace?.segments.map((s) => ({
                    name: s.name,
                    durationMs: s.durationMs ? Math.round(s.durationMs) : undefined,
                    metadata: s.metadata,
                  })),
                  dbQueries: activeTrace?.dbQueries,
                },
              );
            }
          });

          next();
        }
      );
    }
  );
}
