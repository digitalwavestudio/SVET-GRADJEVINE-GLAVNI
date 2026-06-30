import os from "os";
import * as Sentry from "@sentry/node";
import { getRedis } from "../utils/redis.ts";
import { env } from "../config/env.ts";
import { Logger } from "../utils/logger.ts";
import { AlertingService } from "./alerting.service.ts";
import { getErrorMessage } from "../utils/error-handler.ts";

export class MonitoringService {
  private static startTime = Date.now();
  private static instanceStartTime = Date.now();
  private static _redis: any = null;
  private static get redis() {
    if (!this._redis) {
      this._redis = getRedis();
    }
    return this._redis;
  }
  private static logger = new Logger({ service: "Monitoring" });
  private static monitoringInterval: NodeJS.Timeout | null = null;

  static init() {
    if (env.SENTRY_DSN) {
      Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,
        tracesSampleRate: 1.0,
      });
      this.logger.info("Sentry initialized successfully.");
    } else {
      this.logger.warn("SENTRY_DSN not found. Sentry disabled.");
    }

    if (env.NODE_ENV === "production") {
      this.monitoringInterval = setInterval(
        async () => {
        const lockKey = "lock:monitoring_check";
        let lockId: string | null = null;
        try {
          const { LockManager } = await import("./lock.service");
          lockId = await LockManager.acquire(lockKey, 4 * 60 * 1000);
          if (!lockId) return;

          const stats = await this.getStats();

          if (stats.redisHealth && stats.redisHealth.mem_fragmentation_ratio !== undefined && stats.redisHealth.mem_fragmentation_ratio > 1.5) {
            AlertingService.sendRedisFragmentationAlert(stats.redisHealth.mem_fragmentation_ratio);
          }

          const cacheRatioFloat = parseFloat(stats.cacheHitRatio);
          const reqs = stats.totalRequests || 0;
          if (reqs > 100 && cacheRatioFloat < 50) {
            AlertingService.sendCacheHitDropAlert(stats.cacheHitRatio);
          }
        } catch (err: unknown) {
          this.logger.error("[MonitoringService] Health check interval failed", getErrorMessage(err));
        } finally {
          const { LockManager } = await import("./lock.service");
          if (lockId) await LockManager.release(lockKey, lockId);
        }
      },
      5 * 60 * 1000,
    );
    }
  }

  static gracefulShutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  static getResourceUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = (usedMem / totalMem) * 100;
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0];
    const cpuUsagePercent = (loadAvg / cpus) * 100;

    return {
      memUsagePercent,
      cpuUsagePercent,
      isHealthy: memUsagePercent < 80 && cpuUsagePercent < 90,
    };
  }

  private static localMetrics = {
    totalRequests: 0,
    totalResponseTime: 0,
  };

  static async recordEvent(eventName: string, data: Record<string, unknown>) {
    if (this.redis) {
      try {
        const payload = JSON.stringify({ ...data, time: new Date().toISOString() });
        await this.redis.lpush(`metrics:events:${eventName}`, payload);
        await this.redis.ltrim(`metrics:events:${eventName}`, 0, 99);
      } catch (err: unknown) {
        this.logger.error(`[MonitoringService] Failed to record event ${eventName}`, getErrorMessage(err));
      }
    }

    if (eventName === "slow_render_ssr" && data.url && data.durationMs) {
      AlertingService.sendSlowRenderAlert(data.url as string, data.durationMs as number);
    }
  }

  private static async getMetric(key: string): Promise<number> {
    if (!this.redis) return 0;
    const val = await this.redis.get(`metrics:${key}`);
    return val ? parseInt(val, 10) : 0;
  }

  private static async incrMetric(key: string, amount: number = 1) {
    if (this.redis) {
      const rounded = Math.round(amount);
      const safeAmount = isNaN(rounded) || !isFinite(rounded) ? 1 : rounded;
      try {
        await this.redis.incrby(`metrics:${key}`, safeAmount);
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("not an integer")) {
          try {
            await this.redis.del(`metrics:${key}`);
            await this.redis.incrby(`metrics:${key}`, safeAmount);
          } catch (healErr: unknown) {
            console.error(`[MonitoringService] Failed to self-heal metrics:${key}`, getErrorMessage(healErr));
          }
        } else {
          console.error("[MonitoringService] Redis error", errorMsg);
        }
      }
    }
  }

  static recordSyncSuccess() { this.incrMetric("syncSuccess"); }
  static recordSyncFail() { this.incrMetric("syncFail"); }

  static recordCacheHit(layer: "L1" | "L2" = "L2", keyPrefix?: string) {
    this.incrMetric("cacheHits");
    if (keyPrefix) this.incrMetric(`cacheHits:${keyPrefix}`);
  }

  static recordCacheMiss(keyPrefix?: string) {
    this.incrMetric("cacheMisses");
    if (keyPrefix) this.incrMetric(`cacheMisses:${keyPrefix}`);
  }

  static recordRouteMetric(route: string, statusCode: number, durationMs: number) {
    if (!this.redis) return;
    const today = new Date().toISOString().split("T")[0];
    const baseKey = `metrics:routes:${today}:${route}`;
    const rounded = Math.round(durationMs);
    const safeDuration = isNaN(rounded) || !isFinite(rounded) ? 0 : rounded;

    const pipeline = this.redis.pipeline();
    pipeline.hincrby(baseKey, "total", 1);
    pipeline.hincrby(baseKey, `status:${statusCode}`, 1);
    pipeline.hincrby(baseKey, "totalDuration", safeDuration);
    if (statusCode >= 500) pipeline.hincrby(baseKey, "errors", 1);
    pipeline.sadd(`metrics:routes_set:${today}`, route);
    pipeline.expire(`metrics:routes_set:${today}`, 172800);
    pipeline.expire(baseKey, 172800);

    pipeline.exec().catch(async (err: unknown) => {
      const errorMsg = getErrorMessage(err);
      if (errorMsg.toLowerCase().includes("not an integer")) {
        try { await this.redis!.del(baseKey); } catch { }
      }
      console.error("[Monitoring] Route metric error", errorMsg);
    });
  }

  static async recordResponseTime(ms: number) {
    this.localMetrics.totalResponseTime += ms;
    this.localMetrics.totalRequests++;
    if (this.redis) {
      await this.incrMetric("totalRequests");
      await this.incrMetric("totalResponseTime", ms);
    }
  }

  static async recordBotHit(botName: string, path: string, statusCode: number) {
    if (this.redis) {
      const dateStr = new Date().toISOString().split("T")[0];
      const key = `metrics:bots:${dateStr}`;
      try {
        await this.redis.hincrby(key, `${botName}:total`, 1);
        if (statusCode >= 500) {
          await this.redis.hincrby(key, `${botName}:errors`, 1);
        } else if (statusCode >= 400 && statusCode < 500) {
          await this.redis.hincrby(key, `${botName}:40x`, 1);
        }
        const logEntry = JSON.stringify({ path, statusCode, time: new Date().toISOString() });
        await this.redis.lpush(`metrics:bots:${botName}:latest`, logEntry);
        await this.redis.ltrim(`metrics:bots:${botName}:latest`, 0, 19);
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("not an integer")) {
          try { await this.redis.del(key); } catch { }
        }
        this.logger.error("[MonitoringService] Bot log err", errorMsg);
      }
    }
  }

  static async getBotStats() {
    if (!this.redis) return {};
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const key = `metrics:bots:${dateStr}`;
      const stats = await this.redis.hgetall(key);
      const bots = ["Googlebot", "GPTBot", "ClaudeBot"];
      const botData: Record<string, { total: number; errors: number; clientErrors: number; latestPaths: string[] }> = {};

      for (const bot of bots) {
        const latestRaw = await this.redis.lrange(`metrics:bots:${bot}:latest`, 0, -1);
        botData[bot] = {
          total: parseInt(stats[`${bot}:total`] || "0"),
          errors: parseInt(stats[`${bot}:errors`] || "0"),
          clientErrors: parseInt(stats[`${bot}:40x`] || "0"),
          latestPaths: latestRaw.map((r: string) => { try { return JSON.parse(r) as string; } catch { return String(r); } }),
        };
      }
      return botData;
    } catch { return {}; }
  }

  static async recordError(msg: string, error?: Error) {
    if (msg.includes("RESOURCE_EXHAUSTED") || (error && error.message.includes("RESOURCE_EXHAUSTED"))) {
      this.logger.error(`[QUOTA ALERT] ${msg}`);
      AlertingService.sendGeneralAlert(`🚨 **FIRESTORE EXHAUSTION (QUOTA REACHED)**:\n${msg}`);
      return;
    }

    this.logger.error(`[MONITORING ERROR] ${msg}`, { error: error?.message });

    if (env.SENTRY_DSN) {
      if (error) Sentry.captureException(error);
      else Sentry.captureMessage(msg);
    }

    if (this.redis) {
      const errorMsg = `[${new Date().toISOString()}] ${msg}`;
      await this.redis.lpush("metrics:errors", errorMsg);
      await this.redis.ltrim("metrics:errors", 0, 49);
    }
  }

  static async getRedisHealth() {
    if (!this.redis) return { status: "disconnected" };
    try {
      const info = await this.redis.info("memory");
      const lines = info.split("\n");
      const memoryObj: Record<string, string> = {};
      for (const line of lines) {
        if (!line || line.startsWith("#")) continue;
        const [key, value] = line.split(":");
        if (key && value) memoryObj[key.trim()] = value.trim();
      }
      return {
        status: "connected",
        used_memory_human: memoryObj["used_memory_human"],
        used_memory_peak_human: memoryObj["used_memory_peak_human"],
        used_memory: parseInt(memoryObj["used_memory"] || "0"),
        total_system_memory: parseInt(memoryObj["total_system_memory"] || "0"),
        mem_fragmentation_ratio: parseFloat(memoryObj["mem_fragmentation_ratio"] || "0"),
        evicted_keys: parseInt(memoryObj["evicted_keys"] || "0"),
        instantaneous_ops_per_sec: parseInt(memoryObj["instantaneous_ops_per_sec"] || "0"),
        warnings: parseFloat(memoryObj["mem_fragmentation_ratio"] || "0") > 1.5 ? "High memory fragmentation detected." : null,
      };
    } catch (err: unknown) {
      return { status: "error", message: getErrorMessage(err) };
    }
  }

  static async getRouteMetrics() {
    if (!this.redis) return [];
    const today = new Date().toISOString().split("T")[0];
    const routes = await this.redis.smembers(`metrics:routes_set:${today}`);
    const results = [];
    for (const route of routes) {
      const stats = await this.redis.hgetall(`metrics:routes:${today}:${route}`);
      const total = parseInt(stats.total || "0");
      if (total === 0) continue;
      const errors = parseInt(stats.errors || "0");
      const duration = parseInt(stats.totalDuration || "0");
      results.push({
        route, total, errors,
        errorRate: ((errors / total) * 100).toFixed(2),
        avgDuration: Math.round(duration / total),
        statusBreakdown: Object.keys(stats)
          .filter(k => k.startsWith("status:"))
          .reduce((acc: Record<string, number>, k) => { acc[k.replace("status:", "")] = parseInt(stats[k]); return acc; }, {})
      });
    }
    return results.sort((a, b) => b.total - a.total);
  }

  static async getCachePartitionStats() {
    if (!this.redis) return {};
    const prefixes = ["unified_search", "swr", "metrics", "ad", "myAds", "seo", "branding"];
    const results: Record<string, { hits: number; misses: number; ratio: string }> = {};
    for (const pref of prefixes) {
      const hits = await this.getMetric(`cacheHits:${pref}`);
      const misses = await this.getMetric(`cacheMisses:${pref}`);
      const total = hits + misses;
      results[pref] = { hits, misses, ratio: total > 0 ? ((hits / total) * 100).toFixed(2) + "%" : "0%" };
    }
    return results;
  }

  static async getStats(bypassCache: boolean = false) {
    const cacheKey = "admin:monitoring:stats:v1";
    if (this.redis && !bypassCache) {
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.instanceUptimeSeconds = Math.floor((Date.now() - this.instanceStartTime) / 1000);
          return parsed;
        }
      } catch { }
    }

    const redisStats = this.redis ? {
      syncSuccess: await this.getMetric("syncSuccess"),
      syncFail: await this.getMetric("syncFail"),
      cacheHits: await this.getMetric("cacheHits"),
      cacheMisses: await this.getMetric("cacheMisses"),
      totalRequests: await this.getMetric("totalRequests"),
      totalResponseTime: await this.getMetric("totalResponseTime"),
      errors: this.redis ? await this.redis.lrange("metrics:errors", 0, -1) : [],
    } : { syncSuccess: 0, syncFail: 0, cacheHits: 0, cacheMisses: 0, totalRequests: 0, totalResponseTime: 0, errors: [] };

    let adminStats: Record<string, number> = { systemOutboxPending: 0, systemOutboxDlq: 0 };
    let hasStatsInRedis = false;

    if (this.redis) {
      try {
        const cachedRaw = await this.redis.get("admin_global_metrics:cache");
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          adminStats = { ...parsed, systemOutboxPending: parsed.systemOutboxPending || 0, systemOutboxDlq: parsed.systemOutboxDlq || 0 };
          hasStatsInRedis = true;
        }
      } catch { }
    }

    if (!hasStatsInRedis) {
      if (env.NODE_ENV !== "production") {
        adminStats = { systemOutboxPending: 0, systemOutboxDlq: 0, activeAds: 850, pendingAds: 5, totalUsers: 914 };
      } else {
        const db = (await import("../config/firebase.ts")).db;
        try {
          const snap = await db.collection("metadata").doc("admin_stats").get();
          const docData = snap.data();
          if (docData) {
            adminStats = docData;
            if (this.redis) await this.redis.set("admin_global_metrics:cache", JSON.stringify(docData), "EX", 3600);
          }
        } catch (err: unknown) {
          const errorMsg = getErrorMessage(err);
          if (!errorMsg.includes("Quota limit exceeded")) throw err;
        }
      }
    }

    const avgResponseTime = redisStats.totalRequests > 0 ? Math.round(redisStats.totalResponseTime / redisStats.totalRequests) : 0;
    const cacheHits = redisStats.cacheHits || 0;
    const cacheMisses = redisStats.cacheMisses || 0;
    const cacheTotal = cacheHits + cacheMisses;
    const cacheHitRatio = cacheTotal > 0 ? ((cacheHits / cacheTotal) * 100).toFixed(2) + "%" : "0%";

    const result = {
      instanceUptimeSeconds: Math.floor((Date.now() - this.instanceStartTime) / 1000),
      outbox: { pending: adminStats.systemOutboxPending || 0, dlq: adminStats.systemOutboxDlq || 0 },
      ...redisStats,
      cacheHitRatio,
      avgResponseTime,
      botStats: await this.getBotStats(),
      redisHealth: await this.getRedisHealth(),
    };

    if (this.redis) {
      try { await this.redis.setex(cacheKey, 600, JSON.stringify(result)); } catch { }
    }
    return result;
  }
}
