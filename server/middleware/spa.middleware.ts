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

async function backgroundPreRenderListingHub(
  cacheKey: string,
  cachedIndexHtml: string,
  collectionName: string,
  matchedRoute: MatchedRoute,
  reqPath: string,
  cacheTtl: number
) {
  const redis = getRedis();
  if (!redis) return;

  try {
    const latestDocs = await db
      .collection(collectionName)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    let itemsHtml = "";
    const itemListElements: Record<string, unknown>[] = [];
    let idx = 1;

    latestDocs.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const slug = data.title
        ? data.title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        : "oglas";
      const canonicalUrl = `${APP_CONFIG.BASE_URL}${matchedRoute.path.replace("poslovi", "posao")}${slug}~${id}`;
      itemsHtml += `<li><a href="${canonicalUrl}">${data.title || data.name || "Oglas"}</a> - ${data.city || "Srbija"}</li>`;

      itemListElements.push({
        "@type": "ListItem",
        position: idx++,
        url: canonicalUrl,
      });
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
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/nis">Posao Niš</a></li>
               </ul>
               <h3>Popularne profesije</h3>
               <ul>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/zidar">Zidar posao</a></li>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/elektricar">Električar posao</a></li>
               </ul>
             </aside>`;
    }

    const botListHtml = `
          <main>
             <h1>${matchedRoute.label}</h1>
             <p>${matchedRoute.label} na portalu Svet Građevine.</p>
             <nav>
               <ul>
                 ${itemsHtml}
               </ul>
             </nav>
             ${hubLinks}
          </main>`;

    const title = `${matchedRoute.label} | Svet Građevine`;
    const desc = `Pretražite najveću bazu za ${matchedRoute.label.toLowerCase()} na Balkanu. Pronađite najbolje ponude i partnere.`;

    const bc = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Početna",
          item: APP_CONFIG.BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: matchedRoute.label,
          item: `${APP_CONFIG.BASE_URL}${reqPath}`,
        },
      ],
    };

    let html = cachedIndexHtml;
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(
      "</head>",
      `
<meta name="description" content="${desc}" />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}${reqPath}" />
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

    await redis.set(cacheKey, html, "EX", cacheTtl);
  } catch (error) {
    console.error("[SPA-Background] Error caching listing hub:", error);
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
) {
  const redis = getRedis();
  if (!redis) return;

  try {
    const adDoc = await db.collection(collectionName).doc(adId).get();
    if (!adDoc.exists) {
      await redis.set(`blacklist_404:${adId}`, "1", "EX", 86400); // 24h blacklist
      await redis.set(cacheKey, "404", "EX", 4 * 3600);
      return;
    }

    const adData = adDoc.data()!;
    adData.id = adDoc.id;

    if (adData.status === "deleted" || adData.status === "inactive") {
      await redis.set(`blacklist_404:${adId}`, "1", "EX", 86400); // 24h blacklist
      await redis.set(cacheKey, "404", "EX", 4 * 3600);
      return;
    }

    const baseTitle = adData.title || adData.name || "Oglas";
    const title = `${baseTitle} | Svet Građevine`;
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
      desc = "Detalji oglasa na portalu Svet Građevine.";
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
             ${adData.city ? `<p itemprop="jobLocation address">📍 Lokacija: ${adData.city}</p>` : ""}
             ${adData.companyName ? `<p itemprop="hiringOrganization brand">🏢 Kompanija: ${adData.companyName}</p>` : ""}
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
           <a href="${canonicalUrl}" itemprop="url">Prikaži originalni oglas</a>
         </main>
       `;

    let structuredDataList: Record<string, unknown>[] = [];

    structuredDataList.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Početna",
          item: "https://svetgradjevine.rs/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Oglasi",
          item: "https://svetgradjevine.rs/oglasi",
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
          name: adData.companyName || "Svet Građevine",
          logo: "https://svetgradjevine.rs/logo192.png",
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
<link rel="canonical" href="${canonicalUrl}" />
<link rel="preload" as="image" href="${image}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:alt" content="${baseTitle}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="Svet Građevine" />
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

    await redis.set(cacheKey, html, "EX", cacheTtl);
  } catch (error) {
    console.error("[SPA-Background] Error caching detail page:", error);
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
      const cacheKey = `seo:page:${req.path}`;
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
           console.log(`🛡️ [SPA Shield] Soft-404 blocking fetch for known dead ID: ${deadIdMatch}`);
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
      }
      let html = cachedIndexHtml;

      const adRoutes = [
        { path: "/posao/", coll: "jobs", label: "Posao u građevini" },
        {
          path: "/poslovi",
          coll: "jobs",
          label: "Oglasi za posao",
          alwaysListing: true,
        },
        {
          path: "/gradjevinske-masine/",
          coll: "machines",
          label: "Građevinske mašine",
        },
        {
          path: "/masine",
          coll: "machines",
          label: "Građevinske mašine",
          alwaysListing: true,
        },
        {
          path: "/smestaj",
          coll: "accommodations",
          label: "Smeštaj za radnike",
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
        { path: "/placevi", coll: "plots", label: "Građevinsko zemljište" }, // /placevi/:grad and /placevi (Listing)
        { path: "/nekretnine/", coll: "plots", label: "Građevinsko zemljište" }, // /nekretnine/:id (Detail)
        { path: "/alat-i-oprema", coll: "marketplace", label: "Alat i oprema" }, // Handles both
        { path: "/firma/", coll: "companies", label: "Profil firme" }, // Detail
        {
          path: "/firme",
          coll: "companies",
          label: "Građevinske kompanije",
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
          title: "O nama | Svet Građevine",
          desc: "Saznajte više o misiji i viziji najvećeg građevinskog portala na Balkanu.",
        },
        "/kontakt": {
          title: "Kontakt | Svet Građevine",
          desc: "Kontaktirajte nas za saradnju, oglašavanje ili tehničku podršku.",
        },
        "/cenovnik": {
          title: "Cenovnik oglašavanja | Svet Građevine",
          desc: "Detaljan pregled cena za isticanje oglasa i banersko oglašavanje.",
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

        const isPseoRoute = !req.path.includes("~");

        const isListingPage =
          matchedRoute.alwaysListing === true ||
          req.path === matchedRoute.path.slice(0, -1) ||
          req.path === matchedRoute.path;

        const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
        const isBot =
          /bot|googlebot|crawler|spider|robot|crawling|whatsapp|telegram|facebookexternalhit|twitterbot|linkedinbot|viber/i.test(
            userAgent,
          );

        if (isListingPage) {
          const title = `${matchedRoute.label} | Svet Građevine`;
          const desc = `Pretražite najveću bazu za ${matchedRoute.label.toLowerCase()} na Balkanu. Pronađite najbolje ponude i partnere.`;

          // Breadcrumb for listing
          const bc = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Početna",
                item: APP_CONFIG.BASE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: matchedRoute.label,
                item: `${APP_CONFIG.BASE_URL}${req.path}`,
              },
            ],
          };

          // Optimize out blocking Firestore query by running it asynchronously in background
          if (isBot && collectionName) {
            const indexHtmlForListingBg = cachedIndexHtml || fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
            backgroundPreRenderListingHub(cacheKey, indexHtmlForListingBg, collectionName, matchedRoute, req.path, CACHE_TTL).catch(err => {
              console.error("[SPA-Background] Error caching listing hub:", err);
            });
          }

          let skeletonHtml = html;
          skeletonHtml = skeletonHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
          skeletonHtml = skeletonHtml.replace(
            "</head>",
            `
<meta name="description" content="${desc}" />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}${req.path}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:url" content="${APP_CONFIG.BASE_URL}${req.path}" />
<script type="application/ld+json">${JSON.stringify(bc)}</script>
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

          const title = `${readableTitle} | Svet Građevine`;
          const desc = `Pogledajte detalje za oglas ${readableTitle} na portalu Svet Građevine. Najveći građevinski portal i berza na Balkanu.`;
          const canonicalUrl = `${APP_CONFIG.BASE_URL}${req.path}`;
          const defaultImage = "https://svetgradjevine.rs/og-default.jpg";

          let skeletonHtml = html;
          skeletonHtml = skeletonHtml.replace(
            /<title>.*?<\/title>/,
            `<title>${title}</title>`,
          );

          skeletonHtml = skeletonHtml.replace(
            "</head>",
            `
<meta name="description" content="${desc}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${defaultImage}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta name="robots" content="index, follow" />
</head>`,
          );

          // Trigger asynchronous background cache refresh for this dynamic page
          const indexHtmlForDetailBg = cachedIndexHtml || fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
          backgroundPreRenderDetailPage(cacheKey, indexHtmlForDetailBg, collectionName, adId, req.path, matchedRoute, CACHE_TTL).catch((err) => {
            console.error("[SPA] Error pre-rendering detail page in background:", err);
          });

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
