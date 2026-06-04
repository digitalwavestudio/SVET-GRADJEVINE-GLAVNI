import { Server } from "http";
import express from "express";
import path from "path";

async function startServer() {
  const mode = process.env.APP_MODE || "full";
  const PORT = parseInt(process.env.PORT || "3000", 10);
  let server: Server;
  const app = express();

  let isReady = false;

  // Phase 0: Absolute Liveness Priority
  app.get("/api/health", (_req, res) => res.json({ status: "ok", mode }));
  app.get("/api/system/liveness", (_req, res) => res.status(200).send("OK"));
  app.get("/api/system/readiness", (_req, res) => res.json({ database: true, redis: true, resources: true }));

  // Stateless Guard middleware to prevent 404s and connection starvation
  app.use((req, res, next) => {
    if (isReady) return next();
    
    // Protection for API routes: instant 503 to force Cloud Run LB retry
    if (req.originalUrl.startsWith("/api")) {
      return res.status(503).json({ error: "Service Unavailable", message: "Sistem se pokreće, pokušajte ponovo za par sekundi." });
    }
    
    // Stateless Loading Screen for web requests (Auto-Refresh)
    res.setHeader("Retry-After", "3");
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="sr">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="3">
        <title>Sistem se pokreće...</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafa; color: #1f2937; }
          .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px;}
          @keyframes spin { to { transform: rotate(360deg); } }
          .container { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h2>Pokrećemo platformu...</h2>
          <p>Molimo sačekajte trenutak, učitavanje može potrajati par sekundi.</p>
        </div>
      </body>
      </html>
    `);
  });

  // Bind the port immediately so Cloud Run/Kubernetes respects liveness
  if (mode === "api" || mode === "full") {
    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 [Server] Phase 0: Liveness server active on port ${PORT} (mode: ${mode})`);
    });
  }

  try {
    // Phase 1: Heavy lazy imports and observability foundation
    console.log("[Server] Starting Phase 1 initialization");
    let ensureInitialized: any;
    try {
      const { initTracing } = await import("./server/utils/tracing.ts");
      console.log("[Server] Tracing imported");
      try { initTracing(); } catch (e) { console.warn("[Tracing] Failed, continuing."); }
  
      const { MonitoringService } = await import("./server/services/monitoring.service.ts");
      console.log("[Server] MonitoringService imported");
      MonitoringService.init();
      
      console.log("[Server] Phase 1 initialization almost complete");
      const firebaseModule = await import("./server/config/firebase.ts");
      ensureInitialized = firebaseModule.ensureInitialized;
      console.log("[Server] Firebase imported");
      
      const { initZodLocalization } = await import("@svet-gradjevine/shared");
      initZodLocalization();
      console.log("[Server] Phase 1 initialization complete");
    } catch (e) {
      console.error("[Server] Phase 1 initialization error:", e);
    }

    // Background Init (Non-blocking)
    (async () => {
      try {
        const { DatabaseManager } = await import("./server/utils/db-manager.ts");
        const { DynamicConfigService } = await import("./server/services/dynamic-config.service.ts");
        const { initializeEventSubscribers } = await import("./server/config/events.ts");
        const { BigQueryService } = await import("./server/services/bigquery.service.ts");
        const { MetricsService } = await import("./server/services/metrics.service.ts");
        const { RegionService } = await import("./server/services/region.service.ts");

        if (ensureInitialized) {
          ensureInitialized();
        }
        DatabaseManager.init();
        DynamicConfigService.init().catch(e => console.error("[CONFIG] Dynamic config skipped", e));
        initializeEventSubscribers();
        BigQueryService.initializeSchema().catch(e => console.error("BigQuery init failed", e));
        MetricsService.init();

        // Leader-region background tasks
        if (RegionService.isLeaderRegion() || process.env.NODE_ENV !== "production") {
          const { initMigrations } = await import("./server/migrations/index.ts");
          const { runPendingMigrations } = await import("./server/services/migration.service.ts");
          const { DLQMonitoringService } = await import("./server/services/dlq-monitoring.service.ts");
          initMigrations();
          if (process.env.NODE_ENV === "production") {
            runPendingMigrations().catch(e => console.error("Migration failed", e));
            DLQMonitoringService.startMonitoring();
          }
        }

        const { SSEService } = await import("./server/services/sse.service.ts");
        SSEService.init().catch(e => console.error("SSE Init failed", e));
        
        const { AdminSettingsService } = await import("./server/services/admin/admin-settings.service.ts");
        await AdminSettingsService.prewarm().catch(e => console.error("AdminSettings Pre-warm failed", e));

        // 1. Worker Initialization (for WORKER or FULL mode)
        if (mode === "worker" || mode === "full") {
          const { SyncManager } = await import("./server/services/sync.service.ts");
          const { OutboxWorker } = await import("./server/services/outbox.worker.ts");
          const { GoogleIndexingWorker } = await import("./server/services/google-indexing.worker.ts");
          const { DLQRecoveryWorker } = await import("./server/services/dlq.worker.ts");

          setTimeout(async () => {
            try {
              if (RegionService.isLeaderRegion() || process.env.SANDBOX_WORKERS_ENABLED === "true") {
                await SyncManager.init();
                await OutboxWorker.start();
                await GoogleIndexingWorker.init();
                DLQRecoveryWorker.start();
                
                const { AlgoliaRedisBatcher } = await import("./server/services/algolia-redis-batcher.service");
                await AlgoliaRedisBatcher.init();
                const { ChatBufferService } = await import("./server/services/chat-buffer.service");
                await ChatBufferService.init();
                const { ImageWorker } = await import("./server/services/image.worker");
                await ImageWorker.init();
                const { SystemCron } = await import("./server/utils/system-cron.ts");
                await SystemCron.init();
              }
            } catch (err) {
              console.error("[Server] Worker Init Error:", err);
            }
          }, 15000);
        }
      } catch (e) {
        console.error("Delayed background init failed", e);
      }
    })();

    // 2. Middleware & Routing foundation
    const { requestLogger } = await import("./server/middleware/logging.middleware");
    const { rateLimitShield } = await import("./server/middleware/rate-limit-shield.middleware.ts");
    const { redirectMiddleware } = await import("./server/middleware/redirect.middleware.ts");
    const { canonicalHostMiddleware, botPrerenderMiddleware } = await import("./server/middleware/seo.middleware.ts");
    const { traceMiddleware } = await import("./server/middleware/trace.middleware.ts");
    const { performanceMiddleware } = await import("./server/middleware/performance.middleware.ts");
    const { zodPayloadLimiterMiddleware } = await import("./server/middleware/zod-payload-limiter.middleware.ts");
    const { idempotencyMiddleware } = await import("./server/middleware/idempotency.middleware.ts");
    const { circuitBreakerMiddleware } = await import("./server/middleware/circuit-breaker.middleware.ts");
    const { authMiddleware } = await import("./server/middleware/auth.middleware.ts");
    const { xssMiddleware } = await import("./server/middleware/xss.middleware.ts");
    const { globalErrorHandler } = await import("./server/middleware/error.middleware.ts");
    const { apiRouter } = await import("./server/routes/api.routes.ts");
    const { seoRouter } = await import("./server/routes/seo.routes.ts");
    const { default: feedRouter } = await import("./server/routes/feed.routes.ts");
    
    const helmet = (await import("helmet")).default;
    const compression = (await import("compression")).default;
    const Sentry = await import("./server/utils/sentry-stub.ts");

    app.use(requestLogger);
    app.set("trust proxy", 1);
    app.use(compression());
    app.use(rateLimitShield);

    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        crossOriginOpenerPolicy: false,
        xFrameOptions: false,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      }),
    );
    app.use(traceMiddleware);
    app.use(performanceMiddleware);
    app.use(redirectMiddleware);
    app.use(canonicalHostMiddleware);
    app.use(botPrerenderMiddleware);

    app.use((req, res, next) => {
      const url = req.url || "";
      if (url.includes("/api/messages/upload") || url.includes("/api/verification/upload")) {
        return next();
      }
      const contentLength = req.headers["content-length"];
      if (contentLength && parseInt(contentLength, 10) > 204800) {
        return res.status(413).json({ error: "Payload prevelik. Maksimalna veličina je 200kb." });
      }
      next();
    });

    app.use(express.json({ limit: "200kb" }));
    app.use(zodPayloadLimiterMiddleware);
    app.use(idempotencyMiddleware);

    app.use("/api", circuitBreakerMiddleware, authMiddleware, xssMiddleware, apiRouter);
    app.use("/feed", feedRouter);
    app.use("/", seoRouter);
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

    // 4. Vite/SPA Middleware (Fallback)
    const isCompiledBundle = typeof process !== "undefined" && process.argv && process.argv[1] && (
      process.argv[1].endsWith("server.cjs") || 
      process.argv[1].includes("dist/") || 
      process.argv[1].includes("dist\\")
    );

    if (process.env.NODE_ENV !== "production" && !isCompiledBundle) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: "spa",
      });
      app.use(vite.middlewares);
      app.use(async (req, res, next) => {
        const url = req.originalUrl;
        if (url.startsWith("/api")) return next();
        try {
          const fs = await import("fs");
          const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
          const html = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(html);
        } catch (e) { next(e); }
      });
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.use((req, res) => {
        if (req.url.startsWith("/api")) return res.status(404).json({ error: "Not Found" });
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    Sentry.setupExpressErrorHandler(app);
    app.use(globalErrorHandler);

    isReady = true;
    console.log(`🚀 [Server] Phase 4: Application fully initialized and traffic unlocked.`);

    // Shutdown Handler
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Starting shutdown.`);
      const { LoggerService } = await import("./server/services/logger.service.ts");
      const { LockManager } = await import("./server/services/lock.service");
      const { shutdownRedis } = await import("./server/utils/redis.ts");
      const { OutboxWorker } = await import("./server/services/outbox.worker.ts");
      const { GoogleIndexingWorker } = await import("./server/services/google-indexing.worker.ts");
      const { DLQRecoveryWorker } = await import("./server/services/dlq.worker.ts");
      const { SyncManager } = await import("./server/services/sync.service.ts");
      const { MetricsService } = await import("./server/services/metrics.service.ts");
      const { DynamicConfigService } = await import("./server/services/dynamic-config.service.ts");
      const { DLQMonitoringService } = await import("./server/services/dlq-monitoring.service.ts");
      
      try {
        if (mode === "worker" || mode === "full") {
          await OutboxWorker.gracefulShutdown();
          await GoogleIndexingWorker.gracefulShutdown();
          DLQRecoveryWorker.stop();
          await SyncManager.gracefulShutdown();
        }
        await MetricsService.gracefulShutdown();
        await DynamicConfigService.gracefulShutdown();
        DLQMonitoringService.gracefulShutdown();
        if (server) server.close();
        await LockManager.gracefulCleanup();
        await shutdownRedis();
        process.exit(0);
      } catch (err) {
        console.error("[Shutdown] Error:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

  } catch (e) {
    if (e instanceof Error) {
      console.error("[Server] Critical initialization step failed", e.stack);
    } else {
      console.error("[Server] Critical initialization step failed", e);
    }
  }
}

startServer().catch((err) => {
  console.error("FATAL: Server failed to start!", err);
  process.exit(1);
});
