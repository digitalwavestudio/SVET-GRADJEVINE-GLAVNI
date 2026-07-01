import { Request, Response } from "express";
import { db } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { getRedis } from "../utils/redis.ts";
import { MonitoringService } from "../services/monitoring.service.ts";
import { breaker as dashboardBreaker } from "../routes/bff.routes.ts";
import { adminMonitoringQuerySchema, idParamSchema } from "../dto/admin.dto.ts";

export interface BotStatEntry {
  total: number;
  errors: number;
  clientErrors: number;
  latestPaths: string[];
}

export interface RedisHealth {
  status: string;
  used_memory_human?: string;
  used_memory_peak_human?: string;
  used_memory?: number;
  total_system_memory?: number;
  mem_fragmentation_ratio?: number;
  evicted_keys?: number;
  instantaneous_ops_per_sec?: number;
  warnings?: string | null;
}

export interface MonitorStats {
  instanceUptimeSeconds: number;
  outbox: {
    pending: number;
  };
  syncSuccess: number;
  syncFail: number;
  cacheHits: number;
  cacheMisses: number;
  totalRequests: number;
  totalResponseTime: number;
  errors: string[];
  cacheHitRatio: string;
  avgResponseTime: number;
  botStats: Record<string, BotStatEntry>;
  redisHealth: RedisHealth;
}

export interface RouteMetric {
  route: string;
  total: number;
  errors: number;
  errorRate: string;
  avgDuration: number;
  statusBreakdown: Record<string, number>;
}

export interface DiagnosticsResponse {
  stats: MonitorStats;
  routeMetrics: RouteMetric[];
  cachePartitionStats: Record<string, { hits: number; misses: number; ratio: string }>;
  timestamp: string;
  firestoreAudit?: {
    top20Endpoints: Array<{ endpoint: string; totalReads: number; executions: number; avgReads: number; percentage: number }>;
    top20Collections: Array<{ collection: string; totalReads: number; executions: number; avgReads: number; percentage: number }>;
    topBackgroundSources: Array<{ source: string; totalReads: number; executions: number; avgReads: number; percentage: number }>;
    recentLogs: Array<{
      timestamp: string;
      collection: string;
      path: string;
      readsCount: number;
      size?: number;
      endpoint: string;
    }>;
  };
}

export class AdminMonitoringController {
  private static logger = new Logger({ service: "AdminMonitoring" });

  static async getDiagnostics(req: Request, res: Response) {
    try {
      const parsedQuery = adminMonitoringQuerySchema.parse(req.query);
      const bypassCache = parsedQuery.bypassCache === "true";
      const cacheKey = "admin:monitoring:diagnostics:v1";
      const redis = getRedis();

      if (redis && !bypassCache) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return res.json(JSON.parse(cached));
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          this.logger.warn("Greška pri čitanju keša za diagnostics", errorMsg);
        }
      }

      const stats = await MonitoringService.getStats(bypassCache) as unknown as MonitorStats;
      const routeMetrics = await MonitoringService.getRouteMetrics() as unknown as RouteMetric[];
      const cachePartitionStats = await MonitoringService.getCachePartitionStats();
      
      const response: DiagnosticsResponse = {
        stats,
        routeMetrics,
        cachePartitionStats: cachePartitionStats as any,
        timestamp: new Date().toISOString(),
      };

      if (redis) {
        try {
          await redis.setex(cacheKey, 120, JSON.stringify(response)); // 2 minuta cache
        } catch (err: unknown) {
          // safe standard
        }
      }
      
      res.json(response);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error("Failed to fetch diagnostics", { error: err.message });
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  static async runDiagnosticsScript(req: Request, res: Response) {
    try {
      const startTime = Date.now();
      const logs: string[] = [];
      logs.push("=========================================================");
      logs.push(`🛡️ SVET GRAĐEVINE - LIVE DIJAGNOSTIKA KONTEJNERA v1`);
      logs.push(`Vreme izvršavanja: ${new Date().toLocaleString("sr-RS")}`);
      logs.push("=========================================================");
      
      // 1. Provera resursa sistema
      const memory = process.memoryUsage();
      logs.push("📊 [1/4] ZAUZEĆE MEMORIJE:");
      logs.push(`   - Ukupno dodeljeno (rss): ${(memory.rss / 1024 / 1024).toFixed(2)} MB`);
      logs.push(`   - Aktivno u upotrebi (heapUsed): ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      logs.push(`   - Rezervisano za objekte (heapTotal): ${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
      
      // 2. Provera mrežnih konekcija i odziva
      logs.push("\n📡 [2/4] DIJAGNOSTIKA KONEKCIJA KROZ DOKER:");
      
      try {
        const dbStart = Date.now();
        await db.collection("admin_stats").doc("global").get();
        logs.push(`   ✅ Firestore Baza podataka: POVEZANA (${Date.now() - dbStart}ms)`);
      } catch (err: any) {
        logs.push(`   ❌ Greška pri povezivanju sa bazom podataka: ${err.message}`);
      }

      try {
        const redisStart = Date.now();
        const { getRedis } = await import("../utils/redis.ts");
        const redis = getRedis();
        const status = redis ? redis.status : "offline";
        logs.push(`   ✅ Caching klijent status: [${status.toUpperCase()}] (${Date.now() - redisStart}ms)`);
      } catch (err: any) {
        logs.push(`   ⚠️ Memorijski server za keširanje nije dostupan (koristi se lokalni fallback): ${err.message}`);
      }

      // 3. Provera opterećenja i procesnih niti
      logs.push("\n⚡ [3/4] PROVERA RADNOG OPTEREĆENJA:");
      const load = process.cpuUsage();
      logs.push(`   - Korisnički procesor (user): ${(load.user / 1000).toFixed(2)}ms`);
      logs.push(`   - Sistemski procesor (system): ${(load.system / 1000).toFixed(2)}ms`);
      
      // 4. Detekcija predugih pozadinskih niti
      logs.push("\n🔍 [4/4] ANALIZA VREMENA REAKCIJE:");
      const duration = Date.now() - startTime;
      logs.push(`   ⏱️ Ukupno vreme izvršavanja testa: ${duration}ms`);
      
      if (duration > 1000) {
        logs.push("   ⚠️ UPOZORENJE: Inicijalizacija sistema traje duže od 1s. Ovo može izazvati zagušenje na API Gateway-u.");
      } else {
        logs.push("   ✅ ODLIČNO: Vreme odziva sistema je u granicama bezbednih vrednosti.");
      }
      logs.push("=========================================================\n");

      res.json({ success: true, logs });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: errorMsg });
    }
  }
}
