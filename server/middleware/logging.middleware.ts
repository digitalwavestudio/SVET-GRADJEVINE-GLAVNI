import { Request, Response, NextFunction } from "express";
import { LoggerService } from "../services/logger.service.ts";
import { MonitoringService } from "../services/monitoring.service.ts";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  // Create a correlation/request ID to trace this request
  const requestId =
    req.headers["x-request-id"] ||
    req.headers["x-cloud-trace-context"] ||
    Math.random().toString(36).substring(7);

  // Attach it to req object so other things can use it if needed
  (req).requestId = requestId;

  // We only log when the response finishes to get the status code and duration
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Check if it's an HTML (SSR) response
    const contentType = res.getHeader("Content-Type")?.toString() || "";
    const isSsr = contentType.includes("text/html");

    const meta = {
      requestId,
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
      userAgent: req.get("user-agent") || "Unknown",
      ip: req.ip || req.socket.remoteAddress,
      isSsr,
    };

    // Thresholds
    const SLOW_THRESHOLD_MS = 1000;
    const SLOW_SSR_THRESHOLD_MS = 500;

    // Skip logging noisy dev server requests unless they are slow or error out
    const isDevAssets =
      originalUrl.startsWith("/@") ||
      originalUrl.startsWith("/src/") ||
      originalUrl.startsWith("/node_modules/") ||
      originalUrl.includes("?import") ||
      originalUrl.includes("?v=");

    // KORAK 11.2 - SSR Latency Tracking & Slow Render Event
    if (isSsr && duration > SLOW_SSR_THRESHOLD_MS) {
      LoggerService.warn(
        `[Slow Render SSR] ${method} ${originalUrl} took ${duration}ms (Threshold: ${SLOW_SSR_THRESHOLD_MS}ms)`,
        meta,
      );
      MonitoringService.recordEvent("slow_render_ssr", {
        url: originalUrl,
        durationMs: duration,
      });
    }

    if (statusCode >= 500) {
      LoggerService.error(
        `[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`,
        meta,
      );
    } else if (statusCode >= 400) {
      LoggerService.warn(
        `[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`,
        meta,
      );
    } else if (duration > SLOW_THRESHOLD_MS && !isSsr && !isDevAssets) {
      LoggerService.warn(
        `[HTTP SLOW] ${method} ${originalUrl} ${statusCode} taking ${duration}ms`,
        meta,
      );
    } else if (!isDevAssets) {
      // We might want to sample this in production if volume is too high,
      // but for now log every request for Full Observability.
      LoggerService.info(
        `[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`,
        meta,
      );
    }
  });

  next();
};
