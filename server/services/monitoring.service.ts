import os from "os";
import * as Sentry from "@sentry/node";
import { AsyncLocalStorage } from "async_hooks";
import { getRedis } from "../utils/redis.ts";
import { env } from "../config/env.ts";
import { Logger } from "../utils/logger.ts";
import { AlertingService } from "./alerting.service.ts";
import { getErrorMessage } from "../utils/error-handler.ts";

export interface TraceSegment {
  name: string;
  start: bigint;
  end?: bigint;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface RequestTraceContext {
  traceId: string;
  url: string;
  method: string;
  start: bigint;
  segments: TraceSegment[];
  dbQueries: {
    collection: string;
    params: Record<string, unknown>;
    durationMs?: number;
    timestamp: string;
  }[];
}

/**
 * Servis za monitoring sistema (Health check + Metrics + Error Tracking)
 * Koristi Redis za globalne metrike u stateless režimu.
 */
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
  private static traceStorage = new AsyncLocalStorage<RequestTraceContext>();

  static runWithTrace<T>(reqInfo: { url: string; method: string; traceId: string }, fn: () => T): T {
    const context: RequestTraceContext = {
      traceId: reqInfo.traceId,
      url: reqInfo.url,
      method: reqInfo.method,
      start: process.hrtime.bigint(),
      segments: [],
      dbQueries: [],
    };
    return this.traceStorage.run(context, fn);
  }

  static getActiveTrace(): RequestTraceContext | undefined {
    return this.traceStorage.getStore();
  }

  static recordDbQuery(collection: string, params: Record<string, unknown>, durationMs?: number) {
    const context = this.traceStorage.getStore();
    if (context) {
      context.dbQueries.push({
        collection,
        params,
        durationMs,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static startSegment(name: string, metadata?: Record<string, unknown>): { end: (extraMetadata?: Record<string, unknown>) => void } {
    const context = this.traceStorage.getStore();
    const segment: TraceSegment = {
      name,
      start: process.hrtime.bigint(),
      metadata: metadata ? { ...metadata } : {},
    };

    if (context) {
      context.segments.push(segment);
    }

    // Capture Sentry span if an active span exists
    let sSpan: { setAttribute(key: string, value: unknown): void; end(): void } | undefined;
    try {
      if (Sentry.getActiveSpan()) {
        sSpan = Sentry.startInactiveSpan({
          name,
          op: name === "db_transaction" ? "db" : name === "cache_lookup" ? "cache" : "http",
        }) as unknown as { setAttribute(key: string, value: unknown): void; end(): void };
        if (metadata) {
          Object.entries(metadata).forEach(([k, v]) => {
            sSpan?.setAttribute(k, typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean));
          });
        }
      }
    } catch (err: unknown) {
      // safe fallback
    }

    const start = process.hrtime.bigint();
    return {
      end: (extraMetadata?: Record<string, unknown>) => {
        const end = process.hrtime.bigint();
        segment.end = end;
        segment.durationMs = Number(end - start) / 1_000_000;
        if (extraMetadata) {
          segment.metadata = { ...segment.metadata, ...extraMetadata };
        }
        if (sSpan) {
          try {
            if (extraMetadata) {
              Object.entries(extraMetadata).forEach(([k, v]) => {
                sSpan?.setAttribute(k, typeof v === "object" ? JSON.stringify(v) : (v as string | number | boolean));
              });
            }
            sSpan.end();
          } catch (err: unknown) {
            // safe fallback
          }
        }
      }
    };
  }

  static async tracePhase<T>(
    name: string,
    fn: () => Promise<T> | T,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const tracker = this.startSegment(name, metadata);
    try {
      const result = await fn();
      tracker.end();
      return result;
    } catch (err: unknown) {
      tracker.end({ error: getErrorMessage(err) });
      throw err;
    }
  }

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

    // Proaktivno nadgledanje zdravlja sistema svakih 5 minuta (NOC Alerts)
    if (process.env.NODE_ENV === "production") {
      this.monitoringInterval = setInterval(
        async () => {
        const lockKey = "lock:monitoring_check";
        let lockId: string | null = null;
        try {
          const { LockManager } = await import("./lock.service");
          lockId = await LockManager.acquire(lockKey, 4 * 60 * 1000); // 4 minuta
          if (!lockId) return; // Drugi pod vec radi

          const stats = await this.getStats();

          // 1. Provera Redis fragmentacije
          if (
            stats.redisHealth &&
            stats.redisHealth.mem_fragmentation_ratio !== undefined &&
            stats.redisHealth.mem_fragmentation_ratio > 1.5
          ) {
            AlertingService.sendRedisFragmentationAlert(
              stats.redisHealth.mem_fragmentation_ratio,
            );
          }

          // 2. Provera Cache Hit Rate (ako je pao ispod 50% i ima više od 100 requestova)
          const cacheRatioFloat = parseFloat(stats.cacheHitRatio);
          const reqs = stats.totalRequests || 0;
          if (reqs > 100 && cacheRatioFloat < 50) {
            AlertingService.sendCacheHitDropAlert(stats.cacheHitRatio);
          }
        } catch (err: unknown) {
          this.logger.error(
            "[MonitoringService] Health check interval failed",
            getErrorMessage(err),
          );
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

    // CPU Load (1 minute average)
    const cpus = os.cpus().length;
    const loadAvg = os.loadavg()[0]; // 1 min load
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
        const payload = JSON.stringify({
          ...data,
          time: new Date().toISOString(),
        });
        await this.redis.lpush(`metrics:events:${eventName}`, payload);
        await this.redis.ltrim(`metrics:events:${eventName}`, 0, 99); // keep last 100
      } catch (err: unknown) {
        this.logger.error(
          `[MonitoringService] Failed to record event ${eventName}`,
          getErrorMessage(err),
        );
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

  static recordSyncSuccess() {
    this.incrMetric("syncSuccess");
  }
  static recordSyncFail() {
    this.incrMetric("syncFail");
  }
  static recordCacheHit(layer: "L1" | "L2" = "L2", keyPrefix?: string) {
    this.incrMetric("cacheHits");
    if (keyPrefix) {
      this.incrMetric(`cacheHits:${keyPrefix}`);
    }
  }
  static recordCacheMiss(keyPrefix?: string) {
    this.incrMetric("cacheMisses");
    if (keyPrefix) {
      this.incrMetric(`cacheMisses:${keyPrefix}`);
    }
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
    
    if (statusCode >= 500) {
      pipeline.hincrby(baseKey, "errors", 1);
    }
    
    // Maintain a set of active routes for today
    pipeline.sadd(`metrics:routes_set:${today}`, route);
    pipeline.expire(`metrics:routes_set:${today}`, 172800); // 2 days
    pipeline.expire(baseKey, 172800);
    
    pipeline.exec().catch(async (err: unknown) => {
      const errorMsg = getErrorMessage(err);
      if (errorMsg.toLowerCase().includes("not an integer")) {
        try {
          await this.redis!.del(baseKey);
        } catch (healErr) {
          // ignore
        }
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
      const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const key = `metrics:bots:${dateStr}`;
      try {
        // Count request
        await this.redis.hincrby(key, `${botName}:total`, 1);

        // Count errors (50x)
        if (statusCode >= 500) {
          await this.redis.hincrby(key, `${botName}:errors`, 1);
        } else if (statusCode >= 400 && statusCode < 500) {
          await this.redis.hincrby(key, `${botName}:40x`, 1);
        }

        // Log latest path
        const logEntry = JSON.stringify({
          path,
          statusCode,
          time: new Date().toISOString(),
        });
        await this.redis.lpush(`metrics:bots:${botName}:latest`, logEntry);
        await this.redis.ltrim(`metrics:bots:${botName}:latest`, 0, 19); // keep last 20
      } catch (err: unknown) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("not an integer")) {
          try {
            await this.redis.del(key);
          } catch (healErr) {
            // ignore
          }
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
        const latestRaw = await this.redis.lrange(
          `metrics:bots:${bot}:latest`,
          0,
          -1,
        );
        botData[bot] = {
          total: parseInt(stats[`${bot}:total`] || "0"),
          errors: parseInt(stats[`${bot}:errors`] || "0"),
          clientErrors: parseInt(stats[`${bot}:40x`] || "0"),
          latestPaths: latestRaw.map((r: string) => {
            try {
              return JSON.parse(r) as string;
            } catch {
              return String(r);
            }
          }),
        };
      }
      return botData;
    } catch (err: unknown) {
      return {};
    }
  }

  static recordRequest() {
    this.incrMetric("totalRequests");
  }

  static async recordError(msg: string, error?: Error) {
    if (
      msg.includes("RESOURCE_EXHAUSTED") ||
      (error && error.message.includes("RESOURCE_EXHAUSTED"))
    ) {
      // Don't send quota errors to Sentry/Redis to avoid extra overhead during quota crisis
      this.logger.error(`[QUOTA ALERT] ${msg}`);
      AlertingService.sendGeneralAlert(
        `🚨 **FIRESTORE EXHAUSTION (QUOTA REACHED)**:\n${msg}`,
      );
      return;
    }

    this.logger.error(`[MONITORING ERROR] ${msg}`, { error: error?.message });

    if (env.SENTRY_DSN) {
      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(msg);
      }
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
        if (key && value) {
          memoryObj[key.trim()] = value.trim();
        }
      }

      return {
        status: "connected",
        used_memory_human: memoryObj["used_memory_human"],
        used_memory_peak_human: memoryObj["used_memory_peak_human"],
        used_memory: parseInt(memoryObj["used_memory"] || "0"),
        total_system_memory: parseInt(memoryObj["total_system_memory"] || "0"),
        mem_fragmentation_ratio: parseFloat(
          memoryObj["mem_fragmentation_ratio"] || "0",
        ),
        evicted_keys: parseInt(memoryObj["evicted_keys"] || "0"),
        instantaneous_ops_per_sec: parseInt(memoryObj["instantaneous_ops_per_sec"] || "0"),
        warnings:
          parseFloat(memoryObj["mem_fragmentation_ratio"] || "0") > 1.5
            ? "High memory fragmentation detected. Eviction policy might be struggling."
            : null,
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
        route,
        total,
        errors,
        errorRate: ((errors / total) * 100).toFixed(2),
        avgDuration: Math.round(duration / total),
        statusBreakdown: Object.keys(stats)
          .filter(k => k.startsWith("status:"))
          .reduce((acc: Record<string, number>, k) => {
            acc[k.replace("status:", "")] = parseInt(stats[k]);
            return acc;
          }, {})
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
      results[pref] = {
        hits,
        misses,
        ratio: total > 0 ? ((hits / total) * 100).toFixed(2) + "%" : "0%"
      };
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
          parsed.instanceUptimeSeconds = Math.floor(
            (Date.now() - this.instanceStartTime) / 1000
          );
          return parsed;
        }
      } catch (err) {
        this.logger.warn("Neuspešno učitavanje keširanih monitoring statistika", err);
      }
    }

    const redisStats = this.redis
      ? {
          syncSuccess: await this.getMetric("syncSuccess"),
          syncFail: await this.getMetric("syncFail"),
          cacheHits: await this.getMetric("cacheHits"),
          cacheMisses: await this.getMetric("cacheMisses"),
          totalRequests: await this.getMetric("totalRequests"),
          totalResponseTime: await this.getMetric("totalResponseTime"),
          errors: this.redis
            ? await this.redis.lrange("metrics:errors", 0, -1)
            : [],
        }
      : {
          syncSuccess: 0,
          syncFail: 0,
          cacheHits: 0,
          cacheMisses: 0,
          totalRequests: 0,
          totalResponseTime: 0,
          errors: [],
        };

    // Get stats from admin_stats to avoid full table scans/counts
    let adminStats: Record<string, number> = { systemOutboxPending: 0, systemOutboxDlq: 0 };
    let hasStatsInRedis = false;

    if (this.redis) {
      try {
        const cachedRaw = await this.redis.get("admin_global_metrics:cache");
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          adminStats = {
            ...parsed,
            systemOutboxPending: parsed.systemOutboxPending || 0,
            systemOutboxDlq: parsed.systemOutboxDlq || 0,
          };
          hasStatsInRedis = true;
          this.logger.info("[MonitoringService] Read admin_stats from Redis cache metric shield.");
        }
      } catch (err) {
        this.logger.warn("[MonitoringService] Failed to read admin_stats cache from Redis:", err);
      }
    }

    if (!hasStatsInRedis) {
      if (env.NODE_ENV !== "production") {
        this.logger.info("[MonitoringService] Sandbox mode: Bypassing Firestore metadata/admin_stats check.");
        adminStats = {
          systemOutboxPending: 0,
          systemOutboxDlq: 0,
          activeAds: 850,
          pendingAds: 5,
          totalUsers: 914,
        };
      } else {
        const db = (await import("../config/firebase.ts")).db;
        try {
          const snap = await db.collection("metadata").doc("admin_stats").get();
          const docData = snap.data();
          if (docData) {
            adminStats = docData;
            if (this.redis) {
              await this.redis.set("admin_global_metrics:cache", JSON.stringify(docData), "EX", 3600);
            }
          }
        } catch (err: unknown) {
          const errorMsg = getErrorMessage(err);
          if (
            errorMsg.includes("Quota limit exceeded")
          ) {
            this.logger.warn(
              "[MonitoringService] Quota exceeded fetching admin_stats, using defaults",
            );
          } else {
            throw err;
          }
        }
      }
    }

    const avgResponseTime =
      redisStats.totalRequests > 0
          ? Math.round(redisStats.totalResponseTime / redisStats.totalRequests)
          : 0;

    const cacheHits = redisStats.cacheHits || 0;
    const cacheMisses = redisStats.cacheMisses || 0;
    const cacheTotal = cacheHits + cacheMisses;
    const cacheHitRatio =
      cacheTotal > 0 ? ((cacheHits / cacheTotal) * 100).toFixed(2) + "%" : "0%";

    const result = {
      instanceUptimeSeconds: Math.floor(
        (Date.now() - this.instanceStartTime) / 1000,
      ),
      outbox: {
        pending: adminStats.systemOutboxPending || 0,
        dlq: adminStats.systemOutboxDlq || 0,
      },
      ...redisStats,
      cacheHitRatio,
      avgResponseTime,
      botStats: await this.getBotStats(),
      redisHealth: await this.getRedisHealth(),
      firestoreAudit: this.getFirestoreAuditStats(),
    };

    if (this.redis) {
      try {
        await this.redis.setex(cacheKey, 120, JSON.stringify(result));
      } catch (err) {
        // fallback
      }
    }

    return result;
  }

  // =========================================================================
  // 🛡️ [Firestore Runtime Audit Storage & Tracker]
  // =========================================================================
  private static auditEndpoints = new Map<string, { reads: number; executions: number }>();
  private static auditCollections = new Map<string, { reads: number; executions: number }>();
  private static auditBackgroundSources = new Map<string, { reads: number; executions: number }>();
  private static auditLogs: Array<{
    timestamp: string;
    collection: string;
    path: string;
    readsCount: number;
    size?: number;
    endpoint: string;
    source?: string;
  }> = [];
  private static auditUnsavedEvents = 0;
  private static auditLastFlush = Date.now();
  private static auditLoaded = false;
  private static auditInitPromise: Promise<void> | null = null;
  private static readonly AUDIT_CACHE_KEY = "admin:monitoring:firestore_audit_v2";

  static recordFirestoreAudit(collection: string, path: string, readsCount: number, size?: number, customEndpoint?: string) {
    if (!this.auditLoaded && this.redis && !this.auditInitPromise) {
      const client = this.redis;
      this.auditInitPromise = (async () => {
        try {
          const data = await client.get(this.AUDIT_CACHE_KEY);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed.endpoints)) {
              parsed.endpoints.forEach(([k, v]: [string, any]) => {
                const curr = this.auditEndpoints.get(k) || { reads: 0, executions: 0 };
                this.auditEndpoints.set(k, { reads: curr.reads + v.reads, executions: curr.executions + v.executions });
              });
            }
            if (Array.isArray(parsed.collections)) {
              parsed.collections.forEach(([k, v]: [string, any]) => {
                const curr = this.auditCollections.get(k) || { reads: 0, executions: 0 };
                this.auditCollections.set(k, { reads: curr.reads + v.reads, executions: curr.executions + v.executions });
              });
            }
            if (Array.isArray(parsed.backgroundSources)) {
              parsed.backgroundSources.forEach(([k, v]: [string, any]) => {
                const curr = this.auditBackgroundSources.get(k) || { reads: 0, executions: 0 };
                this.auditBackgroundSources.set(k, { reads: curr.reads + v.reads, executions: curr.executions + v.executions });
              });
            }
            if (Array.isArray(parsed.logs)) {
              this.auditLogs = [...this.auditLogs, ...parsed.logs]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 1000);
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to load audit from redis: ${e}`);
        } finally {
          this.auditLoaded = true;
        }
      })();
    }

    // Detekcija source i da li je pozadinski proces
    let source = "Unknown";
    let isBackground = false;

    const activeTrace = this.getActiveTrace();
    
    // Get stack trace
    const err = new Error();
    const stack = err.stack || "";
    
    if (stack.includes("NotificationFeedWorker") || stack.includes("notification-feed.worker")) {
      source = "NotificationFeedWorker";
      isBackground = true;
    } else if (stack.includes("DashboardPrewarmService") || stack.includes("dashboard-prewarm.service")) {
      source = "DashboardPrewarmService";
      isBackground = true;
    } else if (stack.includes("ScheduledPostsWorker") || stack.includes("scheduled-posts.worker")) {
      source = "ScheduledPostsWorker";
      isBackground = true;
    } else if (stack.includes("AutonomousEditorialWorker") || stack.includes("autonomous-editorial.worker")) {
      source = "AutonomousEditorialWorker";
      isBackground = true;
    } else if (stack.includes("PageViewsAggregatorWorker") || stack.includes("page-views-aggregator.worker")) {
      source = "PageViewsAggregatorWorker";
      isBackground = true;
    } else if (stack.includes("MagazineCtrWorker") || stack.includes("magazine-ctr.worker") || stack.includes("MagazineCtrService") || stack.includes("magazine-ctr.service")) {
      source = "MagazineCtrWorker";
      isBackground = true;
    } else if (stack.includes("DLQMonitoringService") || stack.includes("dlq-monitoring.service")) {
      source = "DLQMonitoringService";
      isBackground = true;
    } else if (stack.includes("ChatArchiverService") || stack.includes("chat-archiver.service") || stack.includes("ChatArchiver")) {
      source = "ChatArchiverService";
      isBackground = true;
    } else if (stack.includes("ReconciliationService") || stack.includes("reconciliation.service") || stack.includes("reconciliation_cron") || stack.includes("admin_stats_cron")) {
      source = "ReconciliationService";
      isBackground = true;
    } else if (stack.includes("CleanupService") || stack.includes("cleanup.service") || stack.includes("cleanup_expired_packages_cron")) {
      source = "CleanupService";
      isBackground = true;
    } else if (stack.includes("HousekeepingService") || stack.includes("housekeeping.service") || stack.includes("housekeeping_")) {
      source = "HousekeepingService";
      isBackground = true;
    } else if (stack.includes("CostAnalyticsService") || stack.includes("cost-analytics.service") || stack.includes("daily_cost_analytics_cron")) {
      source = "CostAnalyticsService";
      isBackground = true;
    } else if (stack.includes("cron") || stack.includes("Cron") || stack.includes("worker") || stack.includes("Worker") || stack.includes("Scheduler") || stack.includes("scheduler")) {
      isBackground = true;
      const match = stack.match(/at\s+async\s+(\w+Worker|\w+Service|\w+Job|\w+Cron)/);
      if (match && match[1]) {
        source = match[1];
      } else {
        source = "OtherBackgroundJob";
      }
    }

    if (!activeTrace) {
      isBackground = true;
      if (source === "Unknown") {
        const lines = stack.split("\n");
        for (const line of lines) {
          if (line.includes("node_modules") || line.includes("monitoring.service") || line.includes("config/firebase") || line.includes("Error")) {
            continue;
          }
          const funcMatch = line.match(/at\s+(?:async\s+)?([^\s(]+)/);
          const fileMatch = line.match(/\((.*?):(\d+):(\d+)\)/) || line.match(/at\s+(.*?):(\d+):(\d+)/);
          if (funcMatch && funcMatch[1]) {
            source = funcMatch[1];
            break;
          } else if (fileMatch && fileMatch[1]) {
            const fileName = fileMatch[1].split("/").pop() || "unknown";
            source = fileName;
            break;
          }
        }
        if (source === "Unknown") {
          source = "BACKGROUND_SYSTEM";
        }
      }
    }

    let endpoint = customEndpoint;
    if (isBackground) {
      endpoint = "BACKGROUND_SYSTEM";
    }

    if (!endpoint) {
      endpoint = activeTrace ? `${activeTrace.method} ${activeTrace.url}` : "BACKGROUND_SYSTEM";
    }

    if (endpoint === "BACKGROUND_SYSTEM") {
      isBackground = true;
      if (source === "Unknown") {
        source = "BACKGROUND_SYSTEM";
      }
    }

    // 1. Agregacija po endpoint-u
    const epData = this.auditEndpoints.get(endpoint) || { reads: 0, executions: 0 };
    this.auditEndpoints.set(endpoint, { reads: epData.reads + readsCount, executions: epData.executions + 1 });

    // 2. Agregacija po kolekciji
    const collData = this.auditCollections.get(collection) || { reads: 0, executions: 0 };
    this.auditCollections.set(collection, { reads: collData.reads + readsCount, executions: collData.executions + 1 });

    // 2.5. Agregacija po background izvoru
    if (isBackground) {
      const srcData = this.auditBackgroundSources.get(source) || { reads: 0, executions: 0 };
      this.auditBackgroundSources.set(source, { reads: srcData.reads + readsCount, executions: srcData.executions + 1 });
    }

    // 3. Detaljan log
    this.auditLogs.unshift({
      timestamp: new Date().toISOString(),
      collection,
      path,
      readsCount,
      size,
      endpoint,
      source: isBackground ? source : undefined,
    });

    // Zadržavamo samo poslednjih 1000 zapisa radi očuvanja memorije
    if (this.auditLogs.length > 1000) {
      this.auditLogs.pop();
    }

    this.logger.info(`🔍 [Firestore Audit] Endpoint: ${endpoint} | Source: ${isBackground ? source : "WebClient"} | Coll: ${collection} | Path: ${path} | Reads: ${readsCount} (Records: ${size ?? 1})`);

    this.auditUnsavedEvents++;
    const now = Date.now();
    if (this.auditLoaded && (this.auditUnsavedEvents >= 1 || (now - this.auditLastFlush) >= 300000)) {
      this.auditLastFlush = now;
      this.auditUnsavedEvents = 0;
      
      if (this.redis) {
        const payload = {
          endpoints: Array.from(this.auditEndpoints.entries()),
          collections: Array.from(this.auditCollections.entries()),
          backgroundSources: Array.from(this.auditBackgroundSources.entries()),
          logs: this.auditLogs
        };
        // TTL 24h = 86400 sekundi
        this.redis.setex(this.AUDIT_CACHE_KEY, 86400, JSON.stringify(payload)).catch((e: unknown) => {
          this.logger.warn(`Failed to flush audit to redis: ${e}`);
        });
      }
    }
  }

  static getFirestoreAuditStats() {
    // Top 20 endpoints
    let totalSystemReads = 0;
    Array.from(this.auditEndpoints.values()).forEach(v => totalSystemReads += v.reads);

    const sortedEndpoints = Array.from(this.auditEndpoints.entries())
      .map(([endpoint, data]) => ({ 
        endpoint, 
        totalReads: data.reads, 
        executions: data.executions, 
        avgReads: Number((data.reads / data.executions).toFixed(2)),
        percentage: totalSystemReads > 0 ? Number(((data.reads / totalSystemReads) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, 20);

    // Top 20 collections
    const sortedCollections = Array.from(this.auditCollections.entries())
      .map(([collection, data]) => ({ 
        collection, 
        totalReads: data.reads, 
        executions: data.executions, 
        avgReads: Number((data.reads / data.executions).toFixed(2)),
        percentage: totalSystemReads > 0 ? Number(((data.reads / totalSystemReads) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, 20);

    // Top 20 background sources
    let totalBackgroundReads = 0;
    Array.from(this.auditBackgroundSources.values()).forEach(v => totalBackgroundReads += v.reads);

    const sortedBackgroundSources = Array.from(this.auditBackgroundSources.entries())
      .map(([sourceName, data]) => ({
        source: sourceName,
        totalReads: data.reads,
        executions: data.executions,
        avgReads: Number((data.reads / data.executions).toFixed(2)),
        percentage: totalBackgroundReads > 0 ? Number(((data.reads / totalBackgroundReads) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, 20);

    return {
      top20Endpoints: sortedEndpoints,
      top20Collections: sortedCollections,
      topBackgroundSources: sortedBackgroundSources,
      recentLogs: this.auditLogs.slice(0, 100),
    };
  }
}
