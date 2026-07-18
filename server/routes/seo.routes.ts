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


function replaceEnvPlaceholders(html: string): string {
  return html
    .replaceAll("%VITE_ALGOLIA_APP_ID%", env.VITE_ALGOLIA_APP_ID || env.ALGOLIA_APP_ID || "")
    .replaceAll("%VITE_ALGOLIA_SEARCH_KEY%", env.VITE_ALGOLIA_SEARCH_KEY || env.ALGOLIA_API_KEY || "")
    .replaceAll("%VITE_ALGOLIA_INDEX_NAME%", env.VITE_ALGOLIA_INDEX_NAME || env.ALGOLIA_INDEX_NAME || "listings")
    .replaceAll("%VITE_EMAILJS_PUBLIC_KEY%", env.VITE_EMAILJS_PUBLIC_KEY || "")
    .replaceAll("%VITE_EMAILJS_SERVICE_ID%", env.VITE_EMAILJS_SERVICE_ID || "")
    .replaceAll("%VITE_GA_MEASUREMENT_ID%", env.VITE_GA_MEASUREMENT_ID || env.GA_MEASUREMENT_ID || "G-SVV63518LY");
}

export const seoRouter = Router();

let cacheBuster = "2";
try {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
  const match = indexHtml.match(/\/assets\/index-([^.]+)\.js/);
  if (match) cacheBuster = match[1] + "-2";
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
      return res.send(replaceEnvPlaceholders(cachedHtml));
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
      return res.send(replaceEnvPlaceholders(html));
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

    const replacedHtml = replaceEnvPlaceholders(html);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Cache", "MISS");
    res.send(replacedHtml);

    // Cache the HTML for bots/humans for 24h
    CacheService.set(cacheKey, replacedHtml, 86400000).catch((e) =>
      console.error("Cache set error:", e)
    );
  } catch (error) {
    console.error("SEO Injection error:", error);
    next();
  }
};

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

// PSEO city hub pages for listing types (machines, smestaj, placevi, alat) removed — not active on site

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

// DinamiÄki sitemap (Index)
seoRouter.get("/sitemap.xml", async (_req, res) => {
  try {
    res.header("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    const xml = await SEODbService.generateSitemap();
    res.send(xml);
  } catch (error) {
    console.error("Sitemap error:", error);
    res.header("Content-Type", "application/xml");
    res.send(generateFallbackSitemap());
  }
});

// Paginirani sitemap fragmenti
seoRouter.get("/sitemap-:type.xml", async (req, res) => {
  res.redirect(301, "/sitemap.xml");
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

