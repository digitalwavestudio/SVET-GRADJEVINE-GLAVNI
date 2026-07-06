import { Server } from "http";
import express from "express";
import path from "path";
import fs from "fs";
import { env } from "./server/config/env.ts";

async function startServer() {
  const mode = env.APP_MODE;
  const PORT = parseInt(env.PORT, 10);
  let server: Server;
  const app = express();

  let isReady = false;

  // Phase 0: Absolute Liveness Priority
  app.get("/api/health", (_req, res) => res.json({ status: "ok", mode, commit: "00527a4", premiumFix: true }));
  app.get("/api/system/liveness", (_req, res) => res.status(200).send("OK"));
  app.get("/api/system/readiness", async (_req, res) => {
    if (!isReady) return res.status(503).json({ error: "Service Unavailable", message: "Sistem se pokreće, pokušajte ponovo za par sekundi." });

    const { getRedis } = await import("./server/utils/redis.ts");
    const { db } = await import("./server/config/firebase.ts");

    const redisOk = await getRedis()?.ping().then(() => true).catch(() => false) ?? false;
    const firestoreOk = await db.collection("users").limit(1).get().then(() => true).catch(() => false);

    const allOk = redisOk && firestoreOk;
    res.status(allOk ? 200 : 503).json({ database: firestoreOk, redis: redisOk, resources: true });
  });

  // Stateless Guard middleware to prevent 404s and connection starvation
  app.use((req, res, next) => {
    if (isReady) return next();
    
    // Protection for API routes: instant 503 to force Cloud Run LB retry
    if (req.originalUrl.startsWith("/api")) {
      return res.status(503).json({ error: "Service Unavailable", message: "Sistem se pokreće, pokušajte ponovo za par sekundi." });
    }
    
    // Bots get the SPA shell during startup (no 503) so they never index error pages
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    if (/bot|crawler|spider|gptbot|claudebot|perplexity|chatgpt|qwen/i.test(ua)) {
      try {
        const distPath = path.join(process.cwd(), "dist");
        const shell = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
        return res.send(shell);
      } catch {
        return res.status(503).send("Service Unavailable");
      }
    }

    // Stateless Loading Screen for human web requests (Auto-Refresh)
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
        <script>
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(reg) { reg.unregister(); });
            }).catch(err => console.warn('[SW] Registration error:', err));
          }
        </script>
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
      if (env.NODE_ENV !== "production") console.log(`[Server] Phase 0: Liveness server active on port ${PORT} (mode: ${mode})`);
    });
  }

  try {
    // Phase 1: Heavy lazy imports and observability foundation
    if (env.NODE_ENV !== "production") console.log("[Server] Starting Phase 1 initialization");
    let ensureInitialized: any;
    try {

      
      if (env.NODE_ENV !== "production") console.log("[Server] Phase 1 initialization almost complete");
      const firebaseModule = await import("./server/config/firebase.ts");
      ensureInitialized = firebaseModule.ensureInitialized;
      if (env.NODE_ENV !== "production") console.log("[Server] Firebase imported");
      
      const { initZodLocalization } = await import("@svet-gradjevine/shared");
      initZodLocalization();
      if (env.NODE_ENV !== "production") console.log("[Server] Phase 1 initialization complete");
    } catch (e) {
      console.error("[Server] Phase 1 initialization error:", e);
    }

    // Background Init (Non-blocking)
    (async () => {
      try {
        const { DynamicConfigService } = await import("./server/services/dynamic-config.service.ts");
        const { initializeEventSubscribers } = await import("./server/config/events.ts");

        if (ensureInitialized) {
          ensureInitialized();
        }
        DynamicConfigService.init().catch(e => console.error("[CONFIG] Dynamic config skipped", e));
        initializeEventSubscribers();

        const { initMigrations } = await import("./server/migrations/index.ts");
        const { runPendingMigrations } = await import("./server/services/migration.service.ts");
        initMigrations();
        if (process.env.NODE_ENV === "production") {
          runPendingMigrations().catch(e => console.error("Migration failed", e));
        }

        const { SSEService } = await import("./server/services/sse.service.ts");
        SSEService.init().catch(e => console.error("SSE Init failed", e));
        
        const { AdminSettingsService } = await import("./server/services/admin/admin-settings.service.ts");
        await AdminSettingsService.prewarm().catch(e => console.error("AdminSettings Pre-warm failed", e));

        // 1. Worker Initialization (for WORKER or FULL mode)
        if (mode === "worker" || mode === "full") {
          const { AlgoliaSync } = await import("./server/services/algolia-sync.service.ts");
          const { OutboxWorker } = await import("./server/services/outbox.worker.ts");
          
          setTimeout(async () => {
            try {
              await AlgoliaSync.init();
              await OutboxWorker.start();

              const { ChatBufferService } = await import("./server/services/chat-buffer.service");
              await ChatBufferService.init();
              const { SystemCron } = await import("./server/utils/system-cron.ts");
              await SystemCron.init();
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
    const { canonicalHostMiddleware, botPrerenderMiddleware } = await import("./server/middleware/seo.middleware.ts");
    const { authMiddleware } = await import("./server/middleware/auth.middleware.ts");
    const { xssMiddleware } = await import("./server/middleware/xss.middleware.ts");
    const { globalErrorHandler } = await import("./server/middleware/error.middleware.ts");
    const { apiRouter } = await import("./server/routes/api.routes.ts");
    const { seoRouter } = await import("./server/routes/seo.routes.ts");
    const { default: feedRouter } = await import("./server/routes/feed.routes.ts");
    
    const helmet = (await import("helmet")).default;
    const compression = (await import("compression")).default;
    const Sentry = await import("@sentry/node");

    app.use(requestLogger);
    app.set("trust proxy", 1);
    app.use(compression());

    // Najraniji mogući www redirect — pre svih middleware-a i ruta
    app.use(canonicalHostMiddleware);

    const { createProxyMiddleware } = await import("http-proxy-middleware");
    app.use(
      "/__/auth",
      createProxyMiddleware({
        target: "https://gen-lang-client-0548525213.firebaseapp.com/__/auth",
        changeOrigin: true,
      })
    );

    app.use(rateLimitShield);

    // Content-Security-Policy: mirrors the meta tag in index.html, but enforced
    // by the server too (defense-in-depth).
    const isDev = env.NODE_ENV !== "production";
    const cspDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://apis.google.com",
        "https://accounts.google.com",
        "https://www.googletagmanager.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "https://www.svetgradjevine.com",
        "https://lh3.googleusercontent.com",
        "https://firebasestorage.googleapis.com",
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'",
        "https://www.svetgradjevine.com",
        "https://api.svet-gradjevine.com",
        "https://accounts.google.com",
        "https://*.googleapis.com",
        "https://*.firebaseapp.com",
        "https://*.firebaseio.com",
        "https://*.algolia.net",
        "https://*.algolianet.com",
        "https://fonts.gstatic.com",
        "wss://*",
        ...(isDev ? ["ws://localhost:24678", "ws://localhost:3000"] : []),
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://*.googleusercontent.com",
        "https://*.firebaseapp.com",
      ],
      // PWA manifest
      manifestSrc: ["'self'"],
      // Hard defenses (defense-in-depth)
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      ...(isDev ? {} : { upgradeInsecureRequests: [] }),
    };

    app.use(
      helmet({
        contentSecurityPolicy: { directives: cspDirectives },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "unsafe-none" },
        // frame-ancestors 'none' in CSP supersedes X-Frame-Options; keep both for legacy browsers
        xFrameOptions: { action: "deny" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      }),
    );
    app.use((req, res, next) => {
      const url = req.url || "";
      if (url.includes("/api/messages/upload") || url.includes("/api/verification/upload")) {
        return next();
      }
      const contentLength = req.headers["content-length"];
      if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
        return res.status(413).json({ error: "Payload prevelik. Maksimalna veličina je 5MB." });
      }
      next();
    });

    app.use(express.json({ limit: "5mb" }));

    app.use("/api", authMiddleware, xssMiddleware, apiRouter);
    app.use("/feed", feedRouter);
    app.use(botPrerenderMiddleware);
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
        server: { middlewareMode: true, hmr: env.DISABLE_HMR !== 'true' },
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
      const { createSpaMiddleware } = await import("./server/middleware/spa.middleware.ts");
      app.use(createSpaMiddleware());
    }

    Sentry.setupExpressErrorHandler(app);
    app.use(globalErrorHandler);

    isReady = true;
    if (env.NODE_ENV !== "production") console.log(`[Server] Phase 4: Application fully initialized and traffic unlocked.`);

    // Shutdown Handler
    const shutdown = async (signal: string) => {
      console.log(`[Server] Received ${signal}. Starting shutdown.`);
      const { LockManager } = await import("./server/services/lock.service");
      const { shutdownRedis } = await import("./server/utils/redis.ts");
      const { OutboxWorker } = await import("./server/services/outbox.worker.ts");
          const { AlgoliaSync } = await import("./server/services/algolia-sync.service.ts");
          const { DynamicConfigService } = await import("./server/services/dynamic-config.service.ts");
          const { SystemCron } = await import("./server/utils/system-cron.ts");
          const { ChatBufferService } = await import("./server/services/chat-buffer.service.ts");
          
          try {
            if (mode === "worker" || mode === "full") {
              await OutboxWorker.gracefulShutdown();
              await AlgoliaSync.gracefulShutdown();
              await SystemCron.gracefulShutdown();
              await ChatBufferService.gracefulShutdown();
            }
            await DynamicConfigService.gracefulShutdown();
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
    process.on("uncaughtException", (err) => {
      console.error("[Process] Uncaught Exception — force exiting:", err);
      process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
      console.error("[Process] Unhandled Rejection — force exiting:", reason);
      process.exit(1);
    });

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
