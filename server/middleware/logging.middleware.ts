import { Request, Response, NextFunction } from "express";
import { TraceContext } from "../utils/trace.ts";
import { logger } from "../utils/logger.ts";
import { db, admin } from "../config/firebase.ts";

let lastSlowQueryLogTime = 0;

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingTraceId = req.header("X-Trace-ID") || req.header("x-trace-id");

  TraceContext.run(incomingTraceId, () => {
    res.setHeader("X-Trace-ID", TraceContext.getTraceId());

    const userAgent = req.get("User-Agent") || "";
    const isBot = /googlebot|bingbot|yandex|baidu|slurp|duckduckbot|sogou|spider|crawl|bot|gptbot|claudebot/i.test(userAgent);
    TraceContext.set("userAgent", userAgent);
    TraceContext.set("isBot", isBot ? "true" : "false");

    const start = Date.now();

    const requestId =
      req.headers["x-request-id"] ||
      req.headers["x-cloud-trace-context"] ||
      Math.random().toString(36).substring(7);

    (req).requestId = requestId;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;

      const contentType = res.getHeader("Content-Type")?.toString() || "";
      const isSsr = contentType.includes("text/html");

      const meta = {
        requestId,
        method,
        url: originalUrl,
        status: statusCode,
        durationMs: duration,
        userAgent,
        ip: req.ip || req.socket.remoteAddress,
        isSsr,
      };

      if (duration > 3000) {
        logger.warn(`[Slow Request] ${method} ${originalUrl} (${duration}ms)`, meta);
      }

      const SLOW_THRESHOLD_MS = 1000;
      const SLOW_SSR_THRESHOLD_MS = 500;

      const isDevAssets =
        originalUrl.startsWith("/@") ||
        originalUrl.startsWith("/src/") ||
        originalUrl.startsWith("/node_modules/") ||
        originalUrl.includes("?import") ||
        originalUrl.includes("?v=");

      if (isSsr && duration > SLOW_SSR_THRESHOLD_MS) {
        logger.warn(
          `[Slow Render SSR] ${method} ${originalUrl} took ${duration}ms (Threshold: ${SLOW_SSR_THRESHOLD_MS}ms)`,
          meta,
        );
      }

      if (statusCode >= 500) {
        logger.error(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      } else if (statusCode >= 400) {
        logger.warn(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      } else if (duration > SLOW_THRESHOLD_MS && !isSsr && !isDevAssets) {
        logger.warn(`[HTTP SLOW] ${method} ${originalUrl} ${statusCode} taking ${duration}ms`, meta);
      } else if (!isDevAssets) {
        logger.info(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      }
    });

    next();
  });
};
