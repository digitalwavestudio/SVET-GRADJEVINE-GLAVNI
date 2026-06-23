import { env } from "../config/env.ts";
import { Router } from "express";
import path from "path";
import fs from "fs";
import { APP_CONFIG } from "../../src/constants/config.ts";
import { SEOMetaService } from "../services/seo/seo-meta.service.ts";
import { SEODbService } from "../services/seo/seo-db.service.ts";
import { SEOSchemaService } from "../services/seo/seo-schema.service.ts";
import { SEORenderEngine } from "../services/seo/seo-render-engine.ts";
import { cacheMiddleware } from "../middleware/cache.middleware.ts";
import { LockManager } from "../services/lock.service.ts";
import { logger } from "../utils/logger.ts";

export const seoRouter = Router();

let cacheBuster = "1";
try {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
  const match = indexHtml.match(/\/assets\/index-([^.]+)\.js/);
  if (match) cacheBuster = match[1];
} catch {}

// Middleware to inject meta tags
const injectMetaTags = async (req: import("express").Request & { CacheService?: typeof import("../services/cache.service.ts").CacheService }, res: import("express").Response, next: import("express").NextFunction) => {
  if (env.NODE_ENV === "development") {
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    const isBot = /googlebot|bingbot|yandex|baidu|slurp|duckduckbot|sogou|spider|crawl|bot|gptbot|claudebot/i.test(userAgent);
    if (!isBot) return next();
  }

  const { type, id } = req.params;

  // Only handle specific ad-detail routes
  const allowedTypes = [
    "posao",
    "firma",
    "gradjevinske-masine",
    "smestaj",
    "ketering/provajder",
    "placevi",
    "alat-i-oprema",
    "profil",
  ];
  if (!allowedTypes.includes(type)) return next();

  // Enable meta injection for everyone to guarantee SEO and social sharing consistency
  // Previously skip for non-bots: if (!isBot) return ...

  const { CacheService } = await import("../services/cache.service.ts");
  const hubType = (req.params as Record<string, string>).hubType;
  const cacheKey = `seo:html:${cacheBuster}:${type}:${id || hubType || "index"}:${req.params.category || ""}:${req.params.city || ""}:${req.params.categoryOrCity || ""}`;

  try {
    const cachedHtml = await CacheService.get<string>(cacheKey);
    if (cachedHtml) {
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1h for humans
      res.setHeader("X-Cache", "HIT");
      return res.send(cachedHtml);
    }
  } catch (e) { console.error("[SEO] Cached HTML read error:", e); }

  try {
    let meta: import("../services/seo/seo-render-engine.js").SEOMetaData | null = null;

    if (type === "pseo_hub") {
      meta = await SEODbService.getHubMetaData(hubType, req.params) as unknown as import("../services/seo/seo-render-engine.js").SEOMetaData;
    } else {
      meta = await SEOMetaService.getAdMetaData(type, id) as unknown as import("../services/seo/seo-render-engine.js").SEOMetaData;
    }

    if (meta && meta.isDead) {
      const html = await SEORenderEngine.getBaseTemplate();

      if (meta.hasTraffic) {
        const adRoutes: { path: string, coll: string }[] = [
          { path: "/poslovi", coll: "jobs" },
          { path: "/masine", coll: "machines" },
          { path: "/smestaj", coll: "accommodations" },
          { path: "/ketering", coll: "caterings" },
          { path: "/placevi", coll: "plots" },
          { path: "/alat-i-oprema", coll: "marketplace" },
          { path: "/firme", coll: "companies" },
          { path: "/majstori", coll: "users" },
        ];
        const parentRoute = adRoutes.find((r) => r.coll === meta.collectionName);
        const redirectUrl = parentRoute ? parentRoute.path : "/";
        return res.redirect(301, redirectUrl);
      } else {
        // Instead of 410, fall through to SPA middleware — these are valid listing pages
        return next();
      }
    }

    if (!meta) {
      // COLD CACHE: background compiling is active. Serve a derived SEO friendly skeleton instead of 410/404!
      const html = await SEORenderEngine.assembleHtml({
        reqPath: req.originalUrl,
        host: req.get("host") || "svetgradjevine.com",
        meta: null,
      });

      res.setHeader("Cache-Control", "public, max-age=600"); // 10 mins cache on fallback to allow fast warm-up
      res.setHeader("X-Cache", "MISS (Cold Cache Fallback)");
      return res.send(html);
    }

    // Evaluate ETag via Render Engine to enable 304 Caching
    const etagCheck = SEORenderEngine.evaluateETag(req, res, meta.updatedAt, meta.viewsCount);
    if (etagCheck.matched) {
      return res.status(304).end();
    }

    const html = await SEORenderEngine.assembleHtml({
      reqPath: req.originalUrl,
      host: req.get("host") || "svetgradjevine.com",
      meta,
    });

    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Cache", "MISS");
    res.send(html);

    // Cache the HTML for bots/humans for 24h
    CacheService.set(cacheKey, html, 86400000).catch((e) =>
      console.error("Cache set error:", e)
    );
  } catch (error) {
    console.error("SEO Injection error:", error);
    next();
  }
};

seoRouter.get("/ketering/provajder/:id", (req, res, next) => {
  (req.params as Record<string, string>).type = "ketering/provajder";
  injectMetaTags(req, res, next);
});

// Programmatic SEO Routes (Hubs)
seoRouter.get("/poslovi/:category/:city", (req, res, next) => {
  (req.params as Record<string, string>).type = "pseo_hub";
  (req.params as Record<string, string>).hubType = "job_category_city";
  injectMetaTags(req, res, next);
});

seoRouter.get("/poslovi/:categoryOrCity", (req, res, next) => {
  (req.params as Record<string, string>).type = "pseo_hub";
  (req.params as Record<string, string>).hubType = "job_single_param";
  injectMetaTags(req, res, next);
});

seoRouter.get("/firme/:city", (req, res, next) => {
  (req.params as Record<string, string>).type = "pseo_hub";
  (req.params as Record<string, string>).hubType = "company_city";
  injectMetaTags(req, res, next);
});

seoRouter.get("/majstori/:category/:city", (req, res, next) => {
  (req.params as Record<string, string>).type = "pseo_hub";
  (req.params as Record<string, string>).hubType = "master_category_city";
  injectMetaTags(req, res, next);
});

seoRouter.get("/majstori/:categoryOrCity", (req, res, next) => {
  (req.params as Record<string, string>).type = "pseo_hub";
  (req.params as Record<string, string>).hubType = "master_single_param";
  injectMetaTags(req, res, next);
});

// PSEO city hub pages for listing types — registered before /:type/:id to
// avoid the catch-all treating city slugs as detail page IDs (returns 410)
const cityHubRoutes = [
  { path: "/gradjevinske-masine/:city", hubType: "machine_city" },
  { path: "/masine/:city", hubType: "machine_city_alt" },
  { path: "/smestaj/:city", hubType: "accommodation_city" },
  { path: "/placevi/:city", hubType: "plot_city" },
  { path: "/alat-i-oprema/:city", hubType: "marketplace_city" },
];
for (const { path, hubType } of cityHubRoutes) {
  seoRouter.get(path, (req, res, next) => {
    (req.params as Record<string, string>).type = "pseo_hub";
    (req.params as Record<string, string>).hubType = hubType;
    injectMetaTags(req, res, next);
  });
}

seoRouter.get("/:type/:id", injectMetaTags);

// Fallback dynamic OG image generator
seoRouter.get("/og-image", (req, res) => {
  const title = (req.query.title as string) || "Svet GraÄ‘evine";
  const location = (req.query.location as string) || "Srbija";

  // Basic SVG structure for a beautiful fallback OG card
  const svg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0A0F14" />
        <stop offset="100%" stop-color="#111820" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>
    
    <rect width="1200" height="630" fill="url(#bg)" />
    
    <!-- Abstract building / geometric background element -->
    <path d="M1000 0 L1200 0 L1200 630 L800 630 Z" fill="#ffffff" opacity="0.02" />
    <path d="M1100 0 L1200 0 L1200 630 L900 630 Z" fill="#ffffff" opacity="0.03" />
    
    <!-- Accent Line -->
    <rect x="80" y="80" width="80" height="8" fill="url(#accent)" rx="4" />
    
    <!-- Title -->
    <text x="80" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="#ffffff" letter-spacing="-1">
      ${title.length > 50 ? title.substring(0, 47) + "..." : title}
    </text>
    
    <!-- Location badge -->
    <rect x="80" y="320" width="auto" height="48" rx="8" fill="#ffffff" fill-opacity="0.1" />
    <text x="100" y="352" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#aaaaaa" letter-spacing="2" text-transform="uppercase">
      ðŸ“Œ ${location}
    </text>

    <!-- Logo / Brand at bottom -->
    <text x="80" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="#F59E0B" letter-spacing="-0.5">
      SVET GRAÄEVINE
    </text>
    <text x="360" y="550" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="500" fill="#666666">
      â€¢ NajveÄ‡i graÄ‘evinski portal na Balkanu
    </text>
  </svg>`;

  res.header("Content-Type", "image/svg+xml");
  res.header("Cache-Control", "public, max-age=86400");
  res.send(svg);
});

async function withDistributedLock<T>(
  resourceId: string,
  cacheKey: string,
  CacheService: typeof import("../services/cache.service.ts").CacheService,
  generateFn: () => Promise<T>
): Promise<T | null> {
  const lockId = await LockManager.acquire(resourceId, 120000); // 2 minutes lock
  if (lockId) {
    try {
      const result = await generateFn();
      if (result) {
        await CacheService.set(cacheKey, result, 86400000); // 24 hours
      }
      return result;
    } finally {
      await LockManager.release(resourceId, lockId);
    }
  } else {
    // Wait and poll cache up to 60 seconds
    let retries = 30;
    while (retries > 0) {
      await new Promise((res) => setTimeout(res, 2000));
      const cached = await (CacheService as { get: (k: string) => Promise<unknown> }).get(cacheKey);
      if (cached) return cached as T;
      retries--;
    }
    logger.warn(`[SEO] Lock timeout waiting for generation of ${resourceId}`);
    return null; // or fallback
  }
}

// DinamiÄki sitemap (Index)
seoRouter.get("/sitemap.xml", async (_req, res) => {
  try {
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = "seo:sitemap_index";

    let sitemap = await CacheService.get<string>(cacheKey);

    if (sitemap && typeof sitemap === "string") {
      res.header("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(sitemap);
    }

    const { sitemapWorkerService } =
      await import("../services/sitemap.worker.ts");
    sitemap = (await sitemapWorkerService.getStoredSitemap(
      "sitemap-index.xml",
    )) as string | null;

    if (!sitemap) {
      const { SitemapService } = await import("../services/sitemap.service.ts");
      sitemap = (await withDistributedLock("lock:sitemap:index", cacheKey, CacheService, async () => {
        return await SitemapService.generateIndex();
      })) as string | null;
    }

    if (sitemap) {
      await CacheService.set(cacheKey, sitemap, 24 * 60 * 60 * 1000); // 24 hours
    }

    if (!sitemap) {
      sitemap = generateFallbackSitemap();
    }

    res.header("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.header("Content-Type", "application/xml");
    res.send(generateFallbackSitemap());
  }
});

// Paginirani sitemap fragmenti
seoRouter.get("/sitemap-:type.xml", async (req, res) => {
  try {
    const { type } = req.params;

    // 1. First check our own string cache
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `seo:sitemap_chunk_${type}`;
    const cachedXml = await CacheService.get<string>(cacheKey);

    if (cachedXml && typeof cachedXml === "string") {
      res.header("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(cachedXml);
    }

    // 2. Try to get from cloud storage (bucket)
    const { sitemapWorkerService } =
      await import("../services/sitemap.worker.ts");
    let xml = (await sitemapWorkerService.getStoredSitemap(
      `sitemap-${type}.xml`,
    )) as string | null | undefined;

    if (xml) {
      await CacheService.set(cacheKey, xml, 24 * 60 * 60 * 1000); // 24 hours
      res.header("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(xml);
    }

    // 3. Fallback: generate dynamically ONLY FOR LIGHTWEIGHT SEGMENTS to prevent infinite read loops
    const { SitemapService } = await import("../services/sitemap.service.ts");
    
    // Parse segment type for pagination (e.g. jobs-1)
    const [coll, pageStr] = type.split("-");
    const page = parseInt(pageStr) || 1;

    xml = (await withDistributedLock(`lock:sitemap:${type}`, cacheKey, CacheService, async () => {
      if (coll === "static") {
        return await SitemapService.generateStaticSitemap();
      } else if (coll === "pseo") {
        return await SitemapService.generatePseoSitemap();
      } else if (coll === "magazine") {
        const result = await SitemapService.generateMagazineSitemap(page);
        return result?.xml || null;
      } else if (coll === "companies") {
        const result = await SitemapService.generateCompaniesSitemap(page);
        return result?.xml || null;
      } else if (coll === "masters") {
        const result = await SitemapService.generateMastersSitemap(page);
        return result?.xml || null;
      } else if (["jobs", "machines", "accommodations", "caterings", "plots", "marketplace"].includes(coll)) {
        const result = await SitemapService.generateCollectionSitemap(coll, page);
        return result?.xml || null;
      } else {
        logger.warn(`[SEO] Blocked dynamic generation of unrecognized segment: ${type}.`);
        return null; 
      }
    })) as string | null | undefined;
    
    if (xml === null && !["static", "pseo", "magazine"].includes(type)) {
      return res.status(404).send("Sitemap segment not ready. Worker is building it offline.");
    }

    if (xml) {
      await CacheService.set(cacheKey, xml, 24 * 60 * 60 * 1000); // 24h as per request
    }

    res.header("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(xml || "");
  } catch (error) {
    console.error("Sitemap chunk error:", error);
    res.status(500).send("Error generating sitemap chunk");
  }
});

// DinamiÄki robots.txt
seoRouter.get("/robots.txt", (req, res) => {
  const isProd = env.NODE_ENV === "production";

  const rules = isProd
    ? `
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /moj-profil/
Disallow: /poruke/
Disallow: /checkout/
Disallow: /auth/
Disallow: /prijava
Disallow: /registracija
Disallow: /*?search=*
Disallow: /*?q=*
Disallow: /*?sort=*
Disallow: /*?filter=*

# AI & Semantic Web Crawlers Specifics
User-agent: ChatGPT-User
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: Claude-Web
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: ClaudeBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: PerplexityBot
Allow: /
Disallow: /api/
Disallow: /dashboard/

User-agent: Google-Extended
Allow: /
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${req.protocol}://${req.get("host")}/sitemap.xml
`
    : `
User-agent: *
Disallow: /
`;

  res.header("Content-Type", "text/plain");
  res.header("Cache-Control", "public, max-age=86400");
  res.send(rules.trim());
});

// AI Knowledge Graph Feeds
seoRouter.get(
  "/feed/knowledge-graph.json",
  cacheMiddleware(3600000, "kg_json"),
  async (req, res) => {
    try {
      const feed = await SEOSchemaService.generateKnowledgeGraph();
      res.header("Content-Type", "application/ld+json");
      res.json(feed);
    } catch (e) {
      res.status(500).json({ error: "Failed to generate KG feed" });
    }
  },
);

seoRouter.get(
  "/feed/knowledge-graph.xml",
  cacheMiddleware(3600000, "kg_xml"),
  async (req, res) => {
    try {
      const xml = await SEOSchemaService.generateKnowledgeGraphXML();
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Failed to generate KG feed");
    }
  },
);

const STATIC_SITEMAP_URLS = [
  "",
  "/poslovi",
  "/poslovi/beograd",
  "/poslovi/novi-sad",
  "/poslovi/nis",
  "/poslovi/kragujevac",
  "/poslovi/subotica",
  "/firme",
  "/firme/beograd",
  "/firme/novi-sad",
  "/firme/nis",
  "/masine",
  "/masine/beograd",
  "/smestaj",
  "/smestaj/beograd",
  "/smestaj/novi-sad",
  "/ketering",
  "/ketering/beograd",
  "/placevi",
  "/placevi/beograd",
  "/placevi/novi-sad",
  "/alat-i-oprema",
  "/alat-i-oprema/beograd",
  "/majstori",
  "/majstori/beograd",
  "/majstori/novi-sad",
  "/majstori/nis",
  "/kompanije",
  "/radnici",
  "/za-poslodavce",
  "/onama",
  "/kontakt",
  "/magazin",
];

function generateFallbackSitemap(): string {
  const domain = APP_CONFIG?.BASE_URL || "https://svetgradjevine.com";
  const now = new Date().toISOString();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  STATIC_SITEMAP_URLS.forEach((path) => {
    xml += "  <url>\n";
    xml += `    <loc>${domain}${path}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.8</priority>\n";
    xml += "  </url>\n";
  });
  xml += "</urlset>";
  return xml;
}

