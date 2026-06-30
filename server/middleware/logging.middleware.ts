import { Request, Response, NextFunction } from "express";
import { TraceContext } from "../utils/trace.ts";
import { LoggerService } from "../services/logger.service.ts";
import { MonitoringService } from "../services/monitoring.service.ts";
import { db, admin } from "../config/firebase.ts";

function resolveRegionFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const city = (
    headers["x-appengine-city"] ||
    headers["x-client-city"] ||
    headers["x-geo-city"] ||
    ""
  ).toString().toLowerCase().trim();

  const regHeader = (
    headers["x-appengine-region"] ||
    headers["x-client-region"] ||
    headers["x-geo-region"] ||
    headers["x-cloud-run-region"] ||
    ""
  ).toString().toLowerCase().trim();

  if (
    city.includes("novi sad") ||
    city.includes("subotica") ||
    city.includes("zrenjanin") ||
    city.includes("sombor") ||
    city.includes("pancevo") ||
    city.includes("sremska mitrovica") ||
    city.includes("kikinda") ||
    city.includes("vrsac") ||
    city.includes("vršac") ||
    regHeader.includes("vojvodina") ||
    regHeader.includes("north-serbia") ||
    regHeader.includes("north_serbia")
  ) {
    return "vojvodina";
  }

  if (
    city.includes("nis") ||
    city.includes("niš") ||
    city.includes("leskovac") ||
    city.includes("vranje") ||
    city.includes("pirot") ||
    city.includes("prokuplje") ||
    regHeader.includes("juzna") ||
    regHeader.includes("južna") ||
    regHeader.includes("south-serbia") ||
    regHeader.includes("south_serbia")
  ) {
    return "juzna-srbija";
  }

  if (
    city.includes("kragujevac") ||
    city.includes("cacak") ||
    city.includes("čačak") ||
    city.includes("kraljevo") ||
    city.includes("krusevac") ||
    city.includes("kruševac") ||
    city.includes("novi pazar") ||
    city.includes("valjevo") ||
    city.includes("sabac") ||
    city.includes("šabac") ||
    city.includes("uzice") ||
    city.includes("užice") ||
    regHeader.includes("sumadija") ||
    regHeader.includes("šumadija") ||
    regHeader.includes("centralna") ||
    regHeader.includes("central-serbia") ||
    regHeader.includes("central_serbia")
  ) {
    return "centralna-srbija";
  }

  if (
    city.includes("beograd") ||
    city.includes("belgrade") ||
    regHeader.includes("beograd") ||
    regHeader.includes("belgrade")
  ) {
    return "beograd";
  }

  return "beograd";
}

let totalReads = 0;
let totalWrites = 0;
let lastSlowQueryLogTime = 0;

export function trackFirestoreOp(op: "read" | "write", count: number = 1) {
  if (op === "read") totalReads += count;
  if (op === "write") totalWrites += count;
}

export function getFirestoreOpsStats() {
  return { reads: totalReads, writes: totalWrites };
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const incomingTraceId = req.header("X-Trace-ID") || req.header("x-trace-id");

  TraceContext.run(incomingTraceId, () => {
    res.setHeader("X-Trace-ID", TraceContext.getTraceId());

    const resolvedRegion = resolveRegionFromHeaders(req.headers);
    TraceContext.set("resolvedRegion", resolvedRegion);

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
      const route = req.route ? req.route.path : originalUrl.split("?")[0];

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

      MonitoringService.recordRouteMetric(route, statusCode, duration);
      MonitoringService.recordResponseTime(duration);

      // Slow Query Tracking (iznad 2000ms) — upis u DLQ, max 1/min
      if (duration > 2000) {
        const now = Date.now();
        if (now - lastSlowQueryLogTime > 60000) {
          lastSlowQueryLogTime = now;
          db.collection("dlq").add({
            jobType: "slow_query",
            status: "pending_review",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            error: "Slow query detected (>2000ms)",
            payload: { url: originalUrl, durationMs: duration, method },
          }).catch(() => {});
        }
      }

      if (duration > 3000) {
        LoggerService.warn(`[Slow Request] ${method} ${originalUrl} (${duration}ms)`, meta);
      }

      let botType = "";
      if (userAgent.includes("Googlebot")) botType = "Googlebot";
      else if (userAgent.includes("GPTBot")) botType = "GPTBot";
      else if (userAgent.includes("ClaudeBot")) botType = "ClaudeBot";
      if (botType) {
        MonitoringService.recordBotHit(botType, req.path, statusCode);
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
        LoggerService.error(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      } else if (statusCode >= 400) {
        LoggerService.warn(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      } else if (duration > SLOW_THRESHOLD_MS && !isSsr && !isDevAssets) {
        LoggerService.warn(`[HTTP SLOW] ${method} ${originalUrl} ${statusCode} taking ${duration}ms`, meta);
      } else if (!isDevAssets) {
        LoggerService.info(`[HTTP] ${method} ${originalUrl} ${statusCode} in ${duration}ms`, meta);
      }
    });

    next();
  });
};
