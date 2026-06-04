// @ts-nocheck
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { SEOMetaService } from "../services/seo/seo-meta.service.ts";
import { getRedis } from "../utils/redis.ts";
import { readFile } from "fs/promises";
import path from "path";
import { CacheService } from "../services/cache.service.ts";

let cachedIndexHtml: string | null = null;
const getCachedIndexHtml = async () => {
  if (cachedIndexHtml) return cachedIndexHtml;
  try {
    const indexPath = path.join(process.cwd(), "dist", "index.html");
    cachedIndexHtml = await readFile(indexPath, "utf-8");
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const devIndexPath = path.join(process.cwd(), "index.html");
      cachedIndexHtml = await readFile(devIndexPath, "utf-8");
    } else {
      throw err;
    }
  }
  return cachedIndexHtml;
};

const typeToRoute: Record<string, string> = {
  jobs: "posao",
  companies: "firma",
  plots: "nekretnine",
  machines: "gradjevinske-masine",
  caterings: "ketering/provajder",
  accommodations: "smestaj",
  marketplace: "alat-i-oprema",
  users: "profil",
};

const prerenderAndCache = async (category: string, id: string) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    const routePrefix = typeToRoute[category] || category;
    const meta = await SEOMetaService.getAdMetaData(routePrefix, id);
    if (!meta) return;

    let html = await getCachedIndexHtml();

    const metaTags = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.image}" />
    <link rel="canonical" href="${meta.url}" />
    ${meta.structuredData ? `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>` : ""}
    `;

    html = html.replace("<!-- SSR_META -->", metaTags);
    html = html.replace(/<title>.*?<\/title>/, "");

    if (meta.botHtml) {
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${meta.botHtml}</div>`,
      );
    }

    // In a real scenario we might also need to generate slug but we can just cache by URL from meta
    if (meta.url) {
      const urlObj = new URL(meta.url);
      const canonicalPath = urlObj.pathname.replace(/\/$/, "") || "/";
      const cacheKey = `seo:prerender:${canonicalPath}`;
      console.log(
        `[SEOSubscriber] Cached pre-rendered payload for ${canonicalPath}`,
      );
      await redis.set(cacheKey, html, "EX", 86400 * 7); // Cache for 7 days
    }
  } catch (error) {
    console.error(
      `[SEOSubscriber] Error pre-rendering ${category}:${id}`,
      error,
    );
  }
};

export function setupSeoSubscriber() {
  eventBus.on(
    DomainEvents.JOB_CREATED,
    async ({ jobId }: { jobId: string }) => {
      await prerenderAndCache("jobs", jobId);
    },
  );

  eventBus.on(
    DomainEvents.JOB_UPDATED,
    async ({ jobId }: { jobId: string }) => {
      await prerenderAndCache("jobs", jobId);
    },
  );

  eventBus.on(
    DomainEvents.AD_CREATED,
    async ({ category, id }: { category: string; id: string }) => {
      await prerenderAndCache(category, id);
    },
  );

  eventBus.on(
    DomainEvents.AD_UPDATED,
    async ({ category, id }: { category: string; id: string }) => {
      await prerenderAndCache(category, id);
    },
  );

  eventBus.on(
    DomainEvents.AD_DELETED,
    async ({ category, id }: { category: string; id: string }) => {
      const redis = getRedis();
      if (redis) {
        // Very naive cleanup. Can be better if we know the slug
        const keys = await redis.keys(`seo:prerender:/*${id}`);
        for (const key of keys) {
          await redis.del(key);
        }
      }
    },
  );
}
