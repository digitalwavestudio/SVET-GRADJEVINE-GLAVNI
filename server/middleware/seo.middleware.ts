import { Request, Response, NextFunction } from "express";
import { APP_CONFIG } from "../../src/constants/config.ts";
import { env } from "../config/env.ts";
import { getRedis } from "../utils/redis.ts";
import { SEOMetaService } from "../services/seo/seo-meta.service.ts";
import { MatrixRouter } from "../services/matrix-router.service.ts";
import { eventBus } from "../events/event-bus.ts";
import { SEORenderEngine, SEOMetaData } from "../services/seo/seo-render-engine.ts";
import { CacheKeys } from "../constants/cache-keys.ts";
import { logger } from "../utils/logger.ts";

const DEV = env.NODE_ENV !== "production";

// Add all standard crawlers and AI bots
const BOT_AGENTS = [
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "slurp",
  "baiduspider",
  "gptbot",
  "claudebot",
  "perplexitybot",
  "oai-searchbot",
  "twitterbot",
  "facebookexternalhit",
  "linkedinbot",
  "embedly",
];

interface SEOMeta {
  isDead?: boolean;
  hasTraffic?: boolean;
  collectionName?: string;
  updatedAt?: number | string | Date;
  viewsCount?: number;
  [key: string]: unknown;
}

export const canonicalHostMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const host = req.get("x-forwarded-host") || req.get("host") || "";
  const isProdEnv = env.NODE_ENV === "production" && !host.includes("run.app");

  if (
    isProdEnv &&
    host !== APP_CONFIG.DOMAIN &&
    host !== `www.${APP_CONFIG.DOMAIN}`
  ) {
    if (DEV) console.info(
      `[SEO] Redirecting non-canonical host ${host} to ${APP_CONFIG.BASE_URL}`,
    );
    return res.redirect(301, APP_CONFIG.BASE_URL + req.originalUrl);
  }
  next();
};

export const botPrerenderMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.method !== "GET") {
    return next();
  }

  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  const botName = BOT_AGENTS.find((bot) => userAgent.includes(bot));
  const isBot = !!botName;

  if (!isBot) {
    return next();
  }

  const redis = getRedis();
  if (redis) {
    try {
      const cachedHtml = await redis.get(`seo_render_cache:${req.path}`);
      if (cachedHtml) {
        if (DEV) console.info(`[SEO Bot L1 Cache] Serving cached HTML for bot on path ${req.path}`);
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Cache-Control", "public, max-age=3600"); // 48h
        res.setHeader("X-Prerender-Cache-Hit", "L1-Redis");
        return res.send(cachedHtml);
      }
    } catch (e) {
      console.error("[SEO Bot L1 Cache] Get failed:", e);
    }
  }

  // KORAK 10.4: Dedicated Crawler Analytics & Honeypots
  const startMs = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startMs;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    let botType = "UNKNOWN_BOT";
    if (
      ["gptbot", "claudebot", "perplexitybot", "oai-searchbot"].includes(
        botName,
      )
    ) {
      botType = "AI_SCRAPER";
    } else if (
      ["googlebot", "bingbot", "yandexbot", "googleother"].includes(botName)
    ) {
      botType = "SEARCH_ENGINE";
    } else {
      botType = "SPAM_UNKNOWN";
    }

    eventBus.emit("BOT_ANALYTICS", {
      botType,
      botName,
      path: req.originalUrl,
      userAgent,
      ip,
      status: res.statusCode,
      durationMs,
    });
  });

  // CRAWL BUDGET GUARD (FAZA 8.1 - Depth 2 Rule Focus)
  // Pravilo: Osnovna kategorija indeksirana (1 nivo). Kategorija + Grad indeksirano (2 nivoa).
  // Kategorija + Grad + Cena + Stanje = ZABRANJENO za botove (X-Robots-Tag: noindex).
  const queryKeys = Object.keys(req.query);

  // Dozvoljeni parametar za crawling je iskljuÄivo paginacija
  const allowedQueryKeys = ["page"];
  const advancedFiltersCount = queryKeys.filter(
    (k) => !allowedQueryKeys.includes(k),
  ).length;

  let isFilterTrap = false;

  // Gledamo dubinu AST drveta filtera. pathSegments definiÅ¡u 1-2 nivoa u strukturi rutiranja.
  // Bilo koji query parametar menja stanje "Dubina > 2" u pogledu grananja varijacija.
  if (advancedFiltersCount > 0) {
    isFilterTrap = true;
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";

  // 11.2 - Crawl Explosion Prevention & Trap Defense (Redis Rate Limiting inline)
  if (redis) {
    try {
      const rateKey = CacheKeys.botRateLimit(ip);
      const hits = await redis.incr(rateKey);
      if (hits === 1) {
        await redis.expire(rateKey, 60); // 1 minute window
      }

      // Ako IP bot-a pogaÄ‘a preko 200 req per minute, smatramo ga eksplozivnim (moÅ¾emo da smanjimo ako treba)
      // I zaustavljamo request sa 429 Too Many Requests
      if (hits > 200) {
        if (DEV) console.info(
          `[Crawl Defense] Banning overly aggressive bot IP ${ip} (${botName}) for hitting > 200req/min.`,
        );
        res.setHeader("Retry-After", "120"); // tell bot to wait 2 mins
        await redis.incr(CacheKeys.botTrapBlocks());
        return res
          .status(429)
          .send("429 Too Many Requests - Crawl Budget Exceeded");
      }
    } catch (e) {
      console.error("[Crawl Defense] Redis error", e);
    }
  }

  if (isFilterTrap) {
    if (DEV) console.info(
      `[SEO] Crawl budget guard triggered for bot on ${req.originalUrl} (Depth > 2)`,
    );
    const canonicalBase = `https://${req.get("host")}${req.path.replace(/\/$/, "") || "/"}`;
    // X-Robots-Tag u headerima po pravilima
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache the trap!

    const noIndexHtml = `<!DOCTYPE html><html><head><meta name="robots" content="noindex, nofollow" /><link rel="canonical" href="${canonicalBase}" /></head><body></body></html>`;
    return res.send(noIndexHtml);
  }

  // Canonical Guard: Strip all query parameters for the true canonical URL
  const pathWithoutQuery = req.path.replace(/\/$/, "") || "/";
  const canonicalBaseUrl = `https://${req.get("host")}${pathWithoutQuery}`;

  if (!redis) {
    return next();
  }

  try {
    // 6.2 - Pagination Integrity using generic URL structures
    const pageNum = parseInt(req.query.page as string) || 1;
    const paginationTags = SEORenderEngine.generatePaginationTags(canonicalBaseUrl, pageNum);

    // Include the page parameter in the cache key
    const cacheKey = CacheKeys.seoPrerender(pathWithoutQuery, pageNum);

    // 1. DUBINSKA OPTIMIZACIJA: EDGE CACHING (SEO STAMPEDE RATE LIMIT)
    const cachedHtml = await redis.get(cacheKey);

    if (cachedHtml) {
      await redis.incr(CacheKeys.seoEdgeHits());
      if (DEV) console.info(
        `[SEO] Serving Edge Pre-rendered HTML for BOT on ${req.path}`,
      );
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "public, max-age=3600"); // 48h Cache Edge
      res.setHeader("X-Prerender-Hit", "true");
      res.setHeader("X-Edge-Cache", "Redis (48h)");
      return res.send(cachedHtml);
    }
    
    await redis.incr(CacheKeys.seoEdgeMisses());

    // Fetch metadata to check entity status and ETag before reading/rendering full HTML
    const pathParts = req.path.split("/").filter(Boolean);
    let meta: SEOMeta | null = null;

    if (pathParts[0] === "statistika") {
      // KORAK 10.2: Entity Aggregation Hubs
      if (DEV) console.info(`[SEO] Generating AI/Bot Statistical Hub for ${req.path}`);
      const statData = SEOMetaService.generateStatisticalHub(req.path);
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache
      return res.send(statData);
    }

    if (pathParts.length >= 2) {
      const idSegment = pathParts.pop() || "";
      const baseEntity = pathParts[0];

      // Aggressive Bot Rate Limiter for Firestore-backed Meta Fetch
      const botMetaRateKey = `bot_meta_limit:${ip}`;
      const botMetaHits = await redis.incr(botMetaRateKey);
      if (botMetaHits === 1) await redis.expire(botMetaRateKey, 60);

      if (botMetaHits > 10) {
        logger.warn(`ðŸ›¡ï¸ [SEO Rate Limit] IP ${ip} (${botName}) exceeded 10 meta-reads/min. Serving generic fallback data.`);
        const genericHtml = await SEORenderEngine.assembleHtml({
          reqPath: req.path,
          host: req.get("host") || "svetgradjevine.com",
          meta: null,
          pageNum,
          paginationTags,
          isBotPayload: true,
        });
        return res.send(genericHtml);
      }

      meta = await SEOMetaService.getAdMetaData(baseEntity, idSegment, req.path);

      if (meta) {
        if (meta.isDead) {
          // Korak 8.2: SEO kolaps spreÄavanje
          if (DEV) console.info(`[SEO] Bot encountered dead listing on ${req.path}`);
          if (meta.hasTraffic) {
            const adRoutes = [
              { path: "/poslovi", coll: "jobs", alwaysListing: true },
              { path: "/masine", coll: "machines", alwaysListing: true },
              { path: "/smestaj", coll: "accommodations", alwaysListing: true },
              { path: "/ketering", coll: "caterings", alwaysListing: true },
              { path: "/placevi", coll: "plots", alwaysListing: true },
              {
                path: "/alat-i-oprema",
                coll: "marketplace",
                alwaysListing: true,
              },
              { path: "/firme", coll: "companies", alwaysListing: true },
              { path: "/majstori", coll: "users", alwaysListing: true },
            ];
            const parentRoute = adRoutes.find(
              (r) => r.coll === meta!.collectionName,
            );
            const redirectUrl = parentRoute ? parentRoute.path : "/";
            return res.redirect(301, redirectUrl);
          } else {
            res.setHeader("X-Robots-Tag", "noindex");
            return res
              .status(410)
              .send(
                "<!DOCTYPE html><html><head><title>410 Gone</title></head><body><h1>410 Gone</h1></body></html>",
              );
          }
        }

        // Korak 9.2: HTTP 304 Not Modified (ETag Caching via Render Engine)
        const lastUpdated = meta.updatedAt ? new Date(meta.updatedAt).getTime() : undefined;
        const etagCheck = SEORenderEngine.evaluateETag(req, res, lastUpdated, meta.viewsCount);
        if (etagCheck.matched) {
          if (DEV) console.info(
            `[SEO] ETag match! Sending 304 Not Modified for ${req.path}`,
          );
          return res.status(304).end();
        }
      }
    }

    // 2. Fallback: Dynamically generate the payload on the fly without React
    if (meta && !meta.isDead) {
      if (DEV) console.info(
        `[SEO] Dynamically generating SEO payload for BOT on ${req.path}`,
      );

      const htmlContext = await SEORenderEngine.assembleHtml({
        reqPath: req.path,
        host: req.get("host") || "svetgradjevine.com",
        meta: meta as unknown as SEOMetaData,
        pageNum,
        paginationTags,
        isBotPayload: true,
      });

      // Cache it for the future
      await redis.set(cacheKey, htmlContext, "EX", 3600); // Cache for 48 hours (SEO Stampede Protection)
      await redis.set(`seo_render_cache:${req.path}`, htmlContext, "EX", 3600); // L1 Cache for Bot requests

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.setHeader("X-Prerender-Dynamic", "true");
      return res.send(htmlContext);
    }

    // Fallback: If no dynamic entity meta is found, STILL inject Canonical & Pagination for Hub Pages
    // 7.1 Entity Knowledge Graph & Skalabilni P-SEO Hub Routing
    const isIndexable = await MatrixRouter.evaluateHubIndexability(req.path);

    const fallbackHtml = await SEORenderEngine.assembleHtml({
      reqPath: req.path,
      host: req.get("host") || "svetgradjevine.com",
      meta: null,
      pageNum,
      paginationTags,
      indexable: isIndexable,
      isBotPayload: true,
    });

    await redis.set(cacheKey, fallbackHtml, "EX", 3600); // Cache for 48 hours
    await redis.set(`seo_render_cache:${req.path}`, fallbackHtml, "EX", 3600); // L1 Cache for Bot requests
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(fallbackHtml);
  } catch (error) {
    console.error(
      `[SEO] Error fetching prerender from Redis for ${req.path}`,
      error,
    );
    next();
  }
};

