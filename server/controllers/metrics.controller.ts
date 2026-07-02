import { Request, Response, NextFunction } from "express";
import { MonitoringService } from "../services/monitoring.service.ts";

export const getPrometheusMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await MonitoringService.getStats();

    const lines = [];
    lines.push(`# HELP system_uptime_seconds Total uptime in seconds`);
    lines.push(`# TYPE system_uptime_seconds counter`);
    lines.push(`system_uptime_seconds ${stats.instanceUptimeSeconds}`);

    lines.push(
      `# HELP outbox_pending_tasks Number of pending tasks in DLQ/Outbox`,
    );
    lines.push(`# TYPE outbox_pending_tasks gauge`);
    lines.push(`outbox_pending_tasks ${stats.outbox.pending}`);
    lines.push(`outbox_dlq_tasks ${stats.outbox.dlq}`);

    lines.push(`# HELP cache_hits Number of successful cache hits`);
    lines.push(`# TYPE cache_hits counter`);
    lines.push(`cache_hits ${stats.cacheHits || 0}`);

    lines.push(`# HELP cache_misses Number of cache misses`);
    lines.push(`# TYPE cache_misses counter`);
    lines.push(`cache_misses ${stats.cacheMisses || 0}`);

    const cacheRatio = parseFloat(stats.cacheHitRatio) || 0;
    lines.push(`# HELP cache_hit_ratio_percent Hit ratio in percent`);
    lines.push(`# TYPE cache_hit_ratio_percent gauge`);
    lines.push(`cache_hit_ratio_percent ${cacheRatio}`);

    lines.push(`# HELP redis_fragmentation Redis memory fragmentation ratio`);
    lines.push(`# TYPE redis_fragmentation gauge`);
    if (stats.redisHealth && stats.redisHealth.mem_fragmentation_ratio) {
      lines.push(
        `redis_fragmentation ${stats.redisHealth.mem_fragmentation_ratio}`,
      );
    } else {
      lines.push(`redis_fragmentation 0`);
    }

    lines.push(`# HELP http_avg_response_time_ms Average response time`);
    lines.push(`# TYPE http_avg_response_time_ms gauge`);
    lines.push(`http_avg_response_time_ms ${stats.avgResponseTime || 0}`);

    // Bot stats exposed to Prometheus
    if (stats.botStats) {
      for (const [botName, botData] of Object.entries(stats.botStats)) {
        const typedData = botData as unknown as { total: number; errors: number };
        lines.push(
          `bot_requests_total{bot="${botName}"} ${typedData.total || 0}`,
        );
        lines.push(
          `bot_errors_total{bot="${botName}"} ${typedData.errors || 0}`,
        );
      }
    }

    res.set("Content-Type", "text/plain; version=0.0.4");
    res.send(lines.join("\n"));
  } catch (err) {
    next(err);
  }
};

export const bulkRecordEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: "Invalid events payload" });
    }

    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;

    // Obradi batch u pozadini, bez blokiranja (ili sa minimalnim await)
    const result = await ProductAnalyticsService.bulkRecordEvents(events, ipStr);

    return res.json({ success: true, processed: result.processed });
  } catch (err) {
    next(err);
  }
};

export const recordEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { type, collectionName, targetId, authorId, source } = req.body;

    if (!type || !collectionName || !targetId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;

    const result = await ProductAnalyticsService.recordEvent(
      type,
      collectionName,
      targetId,
      authorId,
      ipStr,
      source || "direct",
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getUserAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    if (!userId) return res.status(400).json({ error: "User ID required" });

    const result = await ProductAnalyticsService.getUserAnalytics(
      userId,
      Number(days) || 30,
    );
    res.json(stats(result));
  } catch (err) {
    next(err);
  }
};

function stats(data: any) {
  // Pomoćna funkcija za dodatnu transformaciju ako zatreba
  return data;
}
