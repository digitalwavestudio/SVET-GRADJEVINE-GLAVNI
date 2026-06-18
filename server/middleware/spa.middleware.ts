import { env } from "../config/env.ts";
import express from "express";
import path from "path";
import fs from "fs";
import { db } from "../config/firebase.ts";
import { APP_CONFIG } from "../../src/constants/config.ts";
import { getRedis } from "../utils/redis.ts";

interface MatchedRoute {
  path: string;
  coll: string;
  label: string;
  alwaysListing?: boolean;
}

const CITIES = [
  "beograd", "novi-sad", "nis", "kragujevac", "subotica", "zrenjanin",
  "pancevo", "smederevo", "cacak", "novi-pazar", "kraljevo", "sabac",
  "uzice", "vranje", "valjevo", "leskovac", "krusevac", "zajecar",
  "sombor", "pozarevac", "pirot", "bor", "srem", "backa", "banat",
];

// Map SEO route collection names to Firestore "listings" type discriminator
const COLLECTION_TO_TYPE: Record<string, string> = {
  jobs: "job",
  machines: "machine",
  companies: "company",
  caterings: "catering",
  accommodations: "accommodation",
  plots: "plot",
  marketplace: "marketplace",
};

function resolveFirestoreQuery(collectionName: string) {
  const typeVal = COLLECTION_TO_TYPE[collectionName];
  if (typeVal) {
    return db.collection("listings").where("type", "==", typeVal);
  }
  return db.collection(collectionName);
}

// Each entity type uses a different field name for category/profession
const COLLECTION_CATEGORY_FIELD: Record<string, string> = {
  jobs: "professionSlug",
  machines: "categorySlug",
  marketplace: "categoryId",
  accommodations: "typeSlug",
  caterings: "categorySlug",
  plots: "typeSlug",
  companies: "mainCategories",
  users: "professionSlug",
};

function resolveFirestoreDoc(collectionName: string, docId: string) {
  if (collectionName === "users") {
    return db.collection("users").doc(docId).get();
  }
  return db.collection("listings").doc(docId).get();
}

async function backgroundPreRenderListingHub(
  cacheKey: string,
  cachedIndexHtml: string,
  collectionName: string,
  matchedRoute: MatchedRoute,
  reqPath: string,
  cacheTtl: number,
  categorySlug?: string,
  citySlug?: string,
  page: number = 1,
): Promise<string | null> {
  const redis = getRedis();

  try {
    let query: FirebaseFirestore.Query = resolveFirestoreQuery(collectionName).orderBy("createdAt", "desc");

    const categoryField = COLLECTION_CATEGORY_FIELD[collectionName];
    if (categorySlug && categoryField) {
      if (categoryField === "mainCategories") {
        query = query.where("mainCategories", "array-contains", categorySlug);
      } else {
        query = query.where(categoryField, "==", categorySlug);
      }
    }
    if (citySlug) {
      query = query.where("locationSlug", "==", citySlug);
    }

    const pageSize = 20;
    const latestDocs = await query.limit(pageSize).offset((page - 1) * pageSize).get();

    let itemsHtml = "";
    const itemListElements: Record<string, unknown>[] = [];
    let idx = 1;
    let latestCreatedAt: Date | null = null;

    latestDocs.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const slug = data.title
        ? data.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        : "oglas";
      const canonicalUrl = `${APP_CONFIG.BASE_URL}${matchedRoute.path.replace("poslovi", "posao").replace(/\/+$/, "")}/${slug}~${id}`;
      itemsHtml += `<li><a href="${canonicalUrl}">${data.title || data.name || "Oglas"}</a> - ${data.city || "Srbija"}</li>`;

      itemListElements.push({
        "@type": "ListItem",
        position: idx++,
        url: canonicalUrl,
      });

      if (!latestCreatedAt) {
        const rawCreated = data.createdAt;
        const rawUpdated = data.updatedAt;
        const ts = rawCreated?.toDate ? rawCreated.toDate() : rawUpdated?.toDate ? rawUpdated.toDate() : null;
        if (ts instanceof Date) latestCreatedAt = ts;
      }
    });

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: itemListElements,
    };

    const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>`;

    let hubLinks = "";
    if (collectionName === "jobs") {
      hubLinks = `
             <aside>
               <h3>Popularni gradovi</h3>
               <ul>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/beograd">Posao Beograd</a></li>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/novi-sad">Posao Novi Sad</a></li>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/nis">Posao NiÅ¡</a></li>
               </ul>
               <h3>Popularne profesije</h3>
               <ul>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/zidar">Zidar posao</a></li>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/elektricar">ElektriÄar posao</a></li>
               </ul>
             </aside>`;
    }

    let label = matchedRoute.label;
    if (categorySlug) label += ` - ${categorySlug.replace(/-/g, " ")}`;
    if (citySlug) label += ` u ${citySlug.replace(/-/g, " ")}`;

    const currentPageUrl = page > 1 ? `${APP_CONFIG.BASE_URL}${reqPath}?page=${page}` : `${APP_CONFIG.BASE_URL}${reqPath}`;
    const prevPageUrl = page > 1 ? `${APP_CONFIG.BASE_URL}${reqPath}?page=${page - 1}` : null;
    const nextPageUrl = latestDocs.size === pageSize ? `${APP_CONFIG.BASE_URL}${reqPath}?page=${page + 1}` : null;

    let paginationLinks = `<link rel="canonical" href="${currentPageUrl}" />`;
    if (prevPageUrl) paginationLinks += `\n<link rel="prev" href="${prevPageUrl}" />`;
    if (nextPageUrl) paginationLinks += `\n<link rel="next" href="${nextPageUrl}" />`;

    const botListHtml = `
          <main>
             <h1>${label}</h1>
             <p>${label} na portalu Svet GraÄ‘evine. PronaÄ‘eno ${latestDocs.size} oglasa na strani ${page}.</p>
             <nav>
               <ul>
                 ${itemsHtml || "<li>Trenutno nema oglasa za ovu kategoriju.</li>"}
               </ul>
             </nav>
             ${hubLinks}
          </main>`;

    const title = `${label} | Svet GraÄ‘evine`;
    const desc = `${label} na portalu Svet GraÄ‘evine.`;

    const baseUrl = APP_CONFIG.BASE_URL;
    const bcPathParts = reqPath.split("/").filter(Boolean);
    const hasCity = citySlug !== undefined;
    const hasCategory = categorySlug !== undefined;

    const bcItems = [
      { "@type": "ListItem", position: 1, name: "PoÄetna", item: baseUrl },
    ];

    if (hasCity || hasCategory) {
      const listingSlug = bcPathParts[0] || "";
      bcItems.push({
        "@type": "ListItem", position: 2,
        name: matchedRoute.label,
        item: `${baseUrl}/${listingSlug}`,
      });
      if (hasCategory && hasCity) {
        bcItems.push({
          "@type": "ListItem", position: 3,
          name: `${categorySlug!.replace(/-/g, " ")} u ${citySlug!.replace(/-/g, " ")}`,
          item: `${baseUrl}${reqPath}`,
        });
      } else if (hasCity) {
        bcItems.push({
          "@type": "ListItem", position: 3,
          name: citySlug!.replace(/-/g, " "),
          item: `${baseUrl}${reqPath}`,
        });
      } else {
        bcItems.push({
          "@type": "ListItem", position: 3,
          name: categorySlug!.replace(/-/g, " "),
          item: `${baseUrl}${reqPath}`,
        });
      }
    } else {
      bcItems.push({
        "@type": "ListItem", position: 2,
        name: label,
        item: `${baseUrl}${reqPath}`,
      });
    }

    const bc = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: bcItems,
    };

    const lastmod = (latestCreatedAt || new Date()).toISOString().split("T")[0];

    let html = cachedIndexHtml;
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(
      "</head>",
      `
<meta name="description" content="${desc}" />
<meta name="lastmod" content="${lastmod}" />
${paginationLinks}
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${APP_CONFIG.BASE_URL}${reqPath}" />
<script type="application/ld+json">${JSON.stringify(bc)}</script>
${jsonLdScript}
</head>`,
    );

    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${botListHtml}</div>`,
    );

    if (redis) {
      await redis.set(cacheKey, html, "EX", cacheTtl);
    }
    return html;
  } catch (error) {
    console.error("[SPA-Background] Error caching listing hub:", error);
    return null;
  }
}

async function backgroundPreRenderDetailPage(
  cacheKey: string,
  cachedIndexHtml: string,
  collectionName: string,
  adId: string,
  reqPath: string,
  matchedRoute: MatchedRoute,
  cacheTtl: number
): Promise<string | null> {
  const redis = getRedis();

  try {
    const adDoc = await resolveFirestoreDoc(collectionName, adId);
    if (!adDoc.exists) {
      if (redis) {
        await redis.set(`blacklist_404:${adId}`, "1", "EX", 86400);
        await redis.set(cacheKey, "404", "EX", 4 * 3600);
      }
      return null;
    }

    const adData = adDoc.data();
    if (!adData) return null;
    adData.id = adDoc.id;

    if (adData.status === "deleted" || adData.status === "inactive") {
      if (redis) {
        await redis.set(`blacklist_404:${adId}`, "1", "EX", 86400);
        await redis.set(cacheKey, "404", "EX", 4 * 3600);
      }
      return null;
    }

    const baseTitle = adData.title || adData.name || "Oglas";
    const title = `${baseTitle} | Svet GraÄ‘evine`;
    let desc =
      adData.description ||
      adData.requirements ||
      adData.conditions ||
      "";
    if (typeof desc === "string") {
      desc = desc
        .substring(0, 160)
        .replace(/<[^>]*>?/gm, "")
        .replace(/"/g, "&quot;");
    } else {
      desc = "Detalji oglasa na portalu Svet GraÄ‘evine.";
    }

    const image =
      adData.images?.[0] ||
      adData.logo ||
      `${APP_CONFIG.BASE_URL}/api/seo/og-image?title=${encodeURIComponent(baseTitle)}&location=${encodeURIComponent(adData.location || adData.city || "Srbija")}`;
    const canonicalUrl = `${APP_CONFIG.BASE_URL}${reqPath}`;
    const altText = baseTitle;

    const botSemanticHtml = `
         <main itemscope itemtype="https://schema.org/${collectionName === "jobs" ? "JobPosting" : "Product"}">
           <header>
             <h1 itemprop="title name">${baseTitle}</h1>
             ${adData.city ? `<p itemprop="jobLocation address">ðŸ“ Lokacija: ${adData.city}</p>` : ""}
             ${adData.companyName ? `<p itemprop="hiringOrganization brand">ðŸ¢ Kompanija: ${adData.companyName}</p>` : ""}
           </header>
           <article itemprop="description">
             ${typeof adData.description === "string" ? adData.description.replace(/\n/g, "<br>") : desc}
           </article>
           <section>
              <h2>Detalji</h2>
              <ul>
                ${adData.price ? `<li>Cena: ${adData.price} ${adData.currency || "EUR"}</li>` : ""}
                ${adData.employmentType ? `<li>Tip zaposlenja: ${adData.employmentType}</li>` : ""}
              </ul>
           </section>
           <a href="${canonicalUrl}" itemprop="url">PrikaÅ¾i originalni oglas</a>
         </main>
       `;

    const structuredDataList: Record<string, unknown>[] = [];

    structuredDataList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "PoÄetna",
          item: "https://svetgradjevine.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Oglasi",
          item: "https://svetgradjevine.com/oglasi",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: baseTitle,
          item: canonicalUrl,
        },
      ],
    });

    if (collectionName === "jobs") {
      structuredDataList.push({
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        title: adData.title,
        description: desc,
        datePosted:
          adData.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        validThrough: new Date(
          Date.now() + 60 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        employmentType: "FULL_TIME",
        hiringOrganization: {
          "@type": "Organization",
          name: adData.companyName || "Svet GraÄ‘evine",
          logo: "https://svetgradjevine.com/logo192.png",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: adData.city || "Srbija",
            addressCountry: "RS",
          },
        },
      });
    } else if (collectionName === "companies") {
      structuredDataList.push({
        "@context": "https://schema.org/",
        "@type": "ConstructionBusiness",
        name: adData.name,
        description: desc,
        image: image,
        url: canonicalUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: adData.city || "Srbija",
          addressCountry: "RS",
        },
      });
    } else if (
      ["machines", "marketplace", "plots"].includes(collectionName)
    ) {
      structuredDataList.push({
        "@context": "https://schema.org/",
        "@type": "Product",
        name: adData.title || adData.name,
        description: desc,
        image: image,
        offers: {
          "@type": "Offer",
          price: adData.price || "0",
          priceCurrency: adData.currency || "EUR",
          availability: "https://schema.org/InStock",
          url: canonicalUrl,
        },
      });
    }

    const detailTs = adData.updatedAt?.toDate?.() || adData.createdAt?.toDate?.();
    const lastmodDate = (detailTs instanceof Date ? detailTs : new Date()).toISOString().split("T")[0];

    let html = cachedIndexHtml;
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${title}</title>`,
    );

    const structuredDataHtml = structuredDataList
      .map(
        (sd) =>
          `<script type="application/ld+json">${JSON.stringify(sd)}</script>`,
      )
      .join("\n");

    html = html.replace(
      "</head>",
      `
<meta name="description" content="${desc}" />
<meta name="lastmod" content="${lastmodDate}" />
<link rel="canonical" href="${canonicalUrl}" />
<link rel="preload" as="image" href="${image}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:alt" content="${baseTitle}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="Svet GraÄ‘evine" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${image}" />
${structuredDataHtml}
<script>window.__PRELOADED_AD_DATA__ = ${JSON.stringify(adData)};</script>\n</head>`,
    );

    if (botSemanticHtml) {
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${botSemanticHtml}</div>`,
      );
    }

    if (redis) {
      await redis.set(cacheKey, html, "EX", cacheTtl);
    }
    return html;
  } catch (error) {
    console.error("[SPA-Background] Error caching detail page:", error);
    return null;
  }
}

export const createSpaMiddleware = () => {
  const router = express.Router();
  const distPath = path.join(process.cwd(), "dist");

  let cachedIndexHtml: string | null = null;
  const CACHE_TTL = 30 * 60; // 30 minutes in seconds for Redis
  const redis = getRedis();

  // Local fallback cache for SEO (protects Firestore if Redis is down)
  const localSeoCache = new Map<string, { html: string; expires: number }>();
  const LOCAL_CACHE_LIMIT = 500;

  router.use(express.static(distPath, {
    index: false,
    setHeaders: (res, path) => {
      if (path.includes("/assets/")) {
        // Hashed assets are fully immutable
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        // General static/public assets (service worker, manifest, fonts)
        res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600");
      }
    }
  }));

  router.use(async (req, res) => {
    try {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "Not Found" });
      }
      const cacheKey = `seo:page:${req.path}${req.query.page ? `?page=${req.query.page}` : ""}`;
      const now = Date.now();

      // Soft-404 Negative Cache Shield
      const idPart = req.path.split("/").pop() || "";
      const deadIdMatch = idPart.includes("~") ? idPart.split("~").pop() : idPart;
      
      if (redis && deadIdMatch && deadIdMatch.length > 5) {
        const isBlacklisted = await redis.get(`blacklist_404:${deadIdMatch}`);
        if (isBlacklisted) {
           if (!cachedIndexHtml) {
             cachedIndexHtml = await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
           }
           if (env.NODE_ENV !== "production") console.info(`ðŸ›¡ï¸ [SPA Shield] Soft-404 blocking fetch for known dead ID: ${deadIdMatch}`);
           return res.send(cachedIndexHtml);
        }
      }

      // 1. Try Redis Cache
      if (redis) {
        const cachedHtml = await redis.get(cacheKey);
        if (cachedHtml) {
          if (cachedHtml === "404") {
            if (!cachedIndexHtml) {
              cachedIndexHtml = await fs.promises.readFile(
                path.join(distPath, "index.html"),
                "utf-8",
              );
            }
            return res.send(cachedIndexHtml);
          }
          return res.send(cachedHtml);
        }
      } else {
        // 2. Try Local Fallback Cache if Redis is unavailable
        const localCached = localSeoCache.get(cacheKey);
        if (localCached) {
          if (now < localCached.expires) {
            // LRU Logic: Move to front
            localSeoCache.delete(cacheKey);
            localSeoCache.set(cacheKey, localCached);
            return res.send(localCached.html);
          } else {
            localSeoCache.delete(cacheKey);
          }
        }
      }

      if (!cachedIndexHtml) {
        cachedIndexHtml = await fs.promises.readFile(
          path.join(distPath, "index.html"),
          "utf-8",
        );
        // Apply runtime env replacements for %VITE_*% placeholders
        cachedIndexHtml = cachedIndexHtml
          .replace("%VITE_ALGOLIA_APP_ID%", env.VITE_ALGOLIA_APP_ID || env.ALGOLIA_APP_ID || "")
          .replace("%VITE_ALGOLIA_SEARCH_KEY%", env.VITE_ALGOLIA_SEARCH_KEY || env.ALGOLIA_API_KEY || "")
          .replace("%VITE_ALGOLIA_INDEX_NAME%", env.VITE_ALGOLIA_INDEX_NAME || env.ALGOLIA_INDEX_NAME || "listings")
          .replace("%VITE_EMAILJS_PUBLIC_KEY%", env.VITE_EMAILJS_PUBLIC_KEY || "")
          .replace("%VITE_EMAILJS_SERVICE_ID%", env.VITE_EMAILJS_SERVICE_ID || "");
      }
      let html = cachedIndexHtml;

      const adRoutes = [
        { path: "/posao/", coll: "jobs", label: "Posao u graÄ‘evini" },
        {
          path: "/poslovi",
          coll: "jobs",
          label: "Oglasi za posao",
          alwaysListing: true,
        },
        {
          path: "/gradjevinske-masine/",
          coll: "machines",
          label: "GraÄ‘evinske maÅ¡ine",
        },
        {
          path: "/masine",
          coll: "machines",
          label: "GraÄ‘evinske maÅ¡ine",
          alwaysListing: true,
        },
        {
          path: "/smestaj",
          coll: "accommodations",
          label: "SmeÅ¡taj za radnike",
        }, // Handles both /smestaj/id and /smestaj/beograd
        {
          path: "/ketering/provajder/",
          coll: "caterings",
          label: "Ketering i hrana",
        },
        {
          path: "/ketering",
          coll: "caterings",
          label: "Ketering",
          alwaysListing: true,
        },
        { path: "/placevi", coll: "plots", label: "GraÄ‘evinsko zemljiÅ¡te" }, // /placevi/:grad and /placevi (Listing)
        { path: "/nekretnine/", coll: "plots", label: "GraÄ‘evinsko zemljiÅ¡te" }, // /nekretnine/:id (Detail)
        { path: "/alat-i-oprema", coll: "marketplace", label: "Alat i oprema" }, // Handles both
        { path: "/firma/", coll: "companies", label: "Profil firme" }, // Detail
        {
          path: "/firme",
          coll: "companies",
          label: "GraÄ‘evinske kompanije",
          alwaysListing: true,
        },
        {
          path: "/majstori",
          coll: "users",
          label: "Majstori",
          alwaysListing: true,
        },
      ];

      const matchedRoute = adRoutes.find((r) => req.path.startsWith(r.path)) as MatchedRoute | undefined;
      const isAdminRoute =
        req.path.startsWith("/admin") || req.path.startsWith("/dashboard");

      // Static Pages SEO
      const staticMetas: Record<string, {title: string, desc: string}> = {
        "/o-nama": {
          title: "O nama | Svet GraÄ‘evine",
          desc: "Saznajte viÅ¡e o misiji i viziji najveÄ‡eg graÄ‘evinskog portala na Balkanu.",
        },
        "/kontakt": {
          title: "Kontakt | Svet GraÄ‘evine",
          desc: "Kontaktirajte nas za saradnju, oglaÅ¡avanje ili tehniÄku podrÅ¡ku.",
        },
        "/cenovnik": {
          title: "Cenovnik oglaÅ¡avanja | Svet GraÄ‘evine",
          desc: "Detaljan pregled cena za isticanje oglasa i banersko oglaÅ¡avanje.",
        },
      };

      if (staticMetas[req.path]) {
        const meta = staticMetas[req.path];
        html = html.replace(
          /<title>.*?<\/title>/,
          `<title>${meta.title}</title>`,
        );
        html = html.replace(
          "</head>",
          `<meta name="description" content="${meta.desc}" /><link rel="canonical" href="${APP_CONFIG.BASE_URL}${req.path}" /></head>`,
        );
        return res.send(html);
      }

      if (matchedRoute) {
        const collectionName = matchedRoute.coll;
        const fullId = req.path.split("/").pop() || "";

        const pathSegments = req.path.split("/").filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1] || "";

        // Crawl explosion protection: paths with >3 segments get noindex
        const isDeepPath = pathSegments.length > 3;
        if (isDeepPath) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }

        const isPseoRoute = !req.path.includes("~");

        const isGeoPage = isPseoRoute && CITIES.includes(lastSegment);

        const isListingPage =
          matchedRoute.alwaysListing === true ||
          req.path === matchedRoute.path.slice(0, -1) ||
          req.path === matchedRoute.path ||
          isGeoPage;

        const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
        const isBot =
          /bot|googlebot|crawler|spider|robot|crawling|whatsapp|telegram|facebookexternalhit|twitterbot|linkedinbot|viber/i.test(
            userAgent,
          );

        let categorySlug: string | undefined;
        let citySlug: string | undefined;

        if (isListingPage) {
          if (isBot && collectionName) {
            const indexHtmlForListingBg = cachedIndexHtml || fs.readFileSync(path.join(distPath, "index.html"), "utf-8");

            // Extract geo filter params from P-SEO hub paths: /poslovi/zidar/beograd
            if (isGeoPage && pathSegments.length >= 2) {
              citySlug = lastSegment;
              if (pathSegments.length >= 3) {
                categorySlug = pathSegments[pathSegments.length - 2];
              }
            } else if (pathSegments.length === 2 && isPseoRoute) {
              categorySlug = pathSegments[1];
            }

            const pageNum = parseInt((req.query.page as string) || "1", 10) || 1;
            const rendered = await backgroundPreRenderListingHub(
              cacheKey, indexHtmlForListingBg, collectionName, matchedRoute, req.path, CACHE_TTL,
              categorySlug, citySlug, pageNum,
            );
            if (rendered) return res.send(rendered);
          }

          // Build breadcrumb for geo pages with 3 levels
          let label = matchedRoute.label;
          let breadcrumbHtml = "";
          const baseUrl = APP_CONFIG.BASE_URL;
          if (isGeoPage) {
            const readableCity = citySlug ? citySlug.replace(/-/g, " ") : lastSegment.replace(/-/g, " ");
            const listingUrl = `${baseUrl}/${pathSegments[0]}`;
            const currentUrl = `${baseUrl}${req.path}`;
            if (categorySlug) {
              const readableCategory = categorySlug.replace(/-/g, " ");
              label = `${matchedRoute.label} - ${readableCategory} u ${readableCity}`;
              breadcrumbHtml = `<script type="application/ld+json">${JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "PoÄetna", item: baseUrl },
                  { "@type": "ListItem", position: 2, name: matchedRoute.label, item: listingUrl },
                  { "@type": "ListItem", position: 3, name: `${readableCategory} u ${readableCity}`, item: currentUrl },
                ],
              })}</script>`;
            } else {
              label = `${matchedRoute.label} u ${readableCity}`;
              breadcrumbHtml = `<script type="application/ld+json">${JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "PoÄetna", item: baseUrl },
                  { "@type": "ListItem", position: 2, name: matchedRoute.label, item: listingUrl },
                  { "@type": "ListItem", position: 3, name: readableCity, item: currentUrl },
                ],
              })}</script>`;
            }
          } else {
            breadcrumbHtml = `<script type="application/ld+json">${JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "PoÄetna", item: baseUrl },
                { "@type": "ListItem", position: 2, name: matchedRoute.label, item: `${baseUrl}${req.path}` },
              ],
            })}</script>`;
          }

          const pageNum = parseInt((req.query.page as string) || "1", 10) || 1;
          const currentPageUrl = pageNum > 1 ? `${APP_CONFIG.BASE_URL}${req.path}?page=${pageNum}` : `${APP_CONFIG.BASE_URL}${req.path}`;
          const prevPageUrl = pageNum > 1 ? `${APP_CONFIG.BASE_URL}${req.path}?page=${pageNum - 1}` : null;
          let paginationLinks = `<link rel="canonical" href="${currentPageUrl}" />`;
          if (prevPageUrl) paginationLinks += `\n<link rel="prev" href="${prevPageUrl}" />`;

          const lastmod = new Date().toISOString().split("T")[0];

          // Fallback skeleton for non-bot or if pre-render fails
          let skeletonHtml = html;
          skeletonHtml = skeletonHtml.replace(/<title>.*?<\/title>/, `<title>${label} | Svet GraÄ‘evine</title>`);
          skeletonHtml = skeletonHtml.replace(
            "</head>",
            `
<meta name="description" content="${label} na portalu Svet GraÄ‘evine." />
<meta name="lastmod" content="${lastmod}" />
${paginationLinks}
${breadcrumbHtml}
</head>`,
          );
          return res.send(skeletonHtml);
        }

        const parts = fullId.split("~");
        const adId = parts.length > 1 ? parts[parts.length - 1] : fullId;

        if (adId && collectionName) {
          // If not bot, we return the cached static index.html instantly so browser can bootstrap Fast
          if (!isBot && cachedIndexHtml) {
            return res.send(cachedIndexHtml);
          }

          // Generate dynamic metadata solely from route slugs to prevent synchronous database blockage
          let slugPart = adId;
          if (fullId.includes("~")) {
            slugPart = fullId.split("~")[0];
          }
          const readableTitle = slugPart
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          const title = `${readableTitle} | Svet GraÄ‘evine`;
          const desc = `Pogledajte detalje za oglas ${readableTitle} na portalu Svet GraÄ‘evine. NajveÄ‡i graÄ‘evinski portal i berza na Balkanu.`;
          const canonicalUrl = `${APP_CONFIG.BASE_URL}${req.path}`;
          const defaultImage = "https://svetgradjevine.com/og-default.jpg";

          const detailLastmod = new Date().toISOString().split("T")[0];

          let skeletonHtml = html;
          skeletonHtml = skeletonHtml.replace(
            /<title>.*?<\/title>/,
            `<title>${title}</title>`,
          );

          skeletonHtml = skeletonHtml.replace(
            "</head>",
            `
<meta name="description" content="${desc}" />
<meta name="lastmod" content="${detailLastmod}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${defaultImage}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta name="robots" content="index, follow" />
</head>`,
          );

          // Pre-render detail page synchronously for bots so first request gets real data
          const indexHtmlForDetailBg = cachedIndexHtml || fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
          const rendered = await backgroundPreRenderDetailPage(cacheKey, indexHtmlForDetailBg, collectionName, adId, req.path, matchedRoute, CACHE_TTL);
          if (rendered) return res.send(rendered);

          return res.send(skeletonHtml);
        }
      }
      res.send(html);
    } catch (err) {
      res.sendFile(path.join(distPath, "index.html"));
    }
  });

  return router;
};

