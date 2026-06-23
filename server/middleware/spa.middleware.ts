import { env } from "../config/env.ts";
import express from "express";
import path from "path";
import fs from "fs";
import { db } from "../config/firebase.ts";
import { APP_CONFIG } from "../../src/constants/config.ts";
import { getRedis } from "../utils/redis.ts";

const SSR_DIST_DIR = path.resolve(process.cwd(), "dist-ssr");
const SSR_ENTRY_PATH = path.join(SSR_DIST_DIR, "entry-server.mjs");

interface SsrResult {
  html: string;
  dehydratedState: unknown;
  helmetHtml: string;
  status: number;
}

async function reactSsrPage(fullUrl: string): Promise<SsrResult | null> {
  try {
    if (!fs.existsSync(SSR_ENTRY_PATH)) return null;

    const origWindow = globalThis.window;
    const origDocument = globalThis.document;
    const origFetch = globalThis.fetch;

    try {
      const origin = fullUrl.startsWith('http') ? new URL(fullUrl).origin : 'http://localhost:3000';
      globalThis.fetch = function ssrFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        if (typeof input === 'string' && input.startsWith('/')) {
          input = `${origin}${input}`;
        }
        return origFetch.call(globalThis, input, init);
      };

      const textNode = { data: '' };
      const mockStyleEl = { appendChild: () => {}, firstChild: textNode, data: '' };
      const mockDoc = {
        createElement: () => mockStyleEl,
        querySelector: () => null,
        documentElement: { style: {} },
        head: { appendChild: () => mockStyleEl },
      };
      globalThis.window = {
        __APP_ENV__: {},
        location: { href: fullUrl, pathname: fullUrl.split('?')[0].replace(/^https?:\/\/[^/]+/, ''), search: fullUrl.includes('?') ? '?' + fullUrl.split('?')[1] : '' },
        innerWidth: 1024, innerHeight: 768,
        matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
        addEventListener: () => {}, removeEventListener: () => {},
        document: mockDoc,
        localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0 },
        history: { pushState: () => {}, replaceState: () => {}, scrollRestoration: '' },
        scrollTo: () => {}, scrollY: 0, pageXOffset: 0, pageYOffset: 0,
      } as any;
      globalThis.document = mockDoc as any;

      const ssrModule = await import(/* @vite-ignore */ `file:///${SSR_ENTRY_PATH.replace(/\\/g, '/')}`);
      return await ssrModule.render(fullUrl);
    } finally {
      globalThis.fetch = origFetch;
      globalThis.window = origWindow;
      globalThis.document = origDocument;
    }
  } catch (error) {
    console.error("[SSR] React SSR failed:", error);
    return null;
  }
}

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

const CITY_DISPLAY: Record<string, string> = {
  beograd: "Beograd", "novi-sad": "Novi Sad", nis: "Niš",
  kragujevac: "Kragujevac", subotica: "Subotica", zrenjanin: "Zrenjanin",
  pancevo: "Pančevo", smederevo: "Smederevo", cacak: "Čačak",
  "novi-pazar": "Novi Pazar", kraljevo: "Kraljevo", sabac: "Šabac",
  uzice: "Užice", vranje: "Vranje", valjevo: "Valjevo",
  leskovac: "Leskovac", krusevac: "Kruševac", zajecar: "Zaječar",
  sombor: "Sombor", pozarevac: "Požarevac", pirot: "Pirot",
  bor: "Bor",
};

function formatCity(slug: string): string {
  return CITY_DISPLAY[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}

// Strip existing <title> and <meta name="description"> before injecting SSR helmet output
function stripHeadMeta(html: string): string {
  return html
    .replace(/<title>.*?<\/title>/i, "")
    .replace(/<meta\s+name=["']description["'][^>]*\/?>/gi, "");
}

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

// Map collection name to detail URL path prefix (reverse of adRoutes detail paths)
const DETAIL_PATH_MAP: Record<string, string> = {
  jobs: "posao",
  machines: "gradjevinske-masine",
  accommodations: "smestaj",
  caterings: "ketering",
  plots: "nekretnine",
  marketplace: "alat-i-oprema",
  companies: "firma",
  users: "majstor",
};

// Primary canonical path for each collection's listing hub (aliases like /masine resolve here)
const CANONICAL_PATH_MAP: Record<string, string> = {
  jobs: "/poslovi",
  machines: "/gradjevinske-masine",
  marketplace: "/alat-i-oprema",
  accommodations: "/smestaj",
  caterings: "/ketering",
  plots: "/placevi",
  companies: "/firme",
  users: "/majstori",
};

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
  cursor?: string
): Promise<string | null> {
  const redis = getRedis();

  try {
    let query: FirebaseFirestore.Query = resolveFirestoreQuery(collectionName)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc");

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

    query = query.select(
      "title", "name", "city", "createdAt", "updatedAt", "status",
      "price", "location", "loc", "type", "images",
      "isPremium", "isUrgent", "comp", "salary", "sal", "logo",
      "description", "adTitle", "adType", "categoryId", "categorySlug",
      "companyName", "companyLogo", "locationSlug", "authorId",
      "professionSlug", "machineType", "condition", "fuelType", "area",
    );

    const pageSize = 20;
    const maxPage = 50;

    if (cursor) {
      try {
        const lastDoc = await resolveFirestoreDoc(collectionName, cursor);
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      } catch {
        // Cursor fetch failed — just return null so caller serves SPA fallback
        return null;
      }
    } else if (page > 1) {
      // No cursor + page > 1: use cached boundary from previous page render
      // instead of .offset() which reads all skipped docs (Firestore bills them)
      const boundaryKey = `hub:boundary:${cacheKey}:p${page - 1}`;
      try {
        const boundaryDocId = redis ? await redis.get(boundaryKey) : null;
        if (boundaryDocId) {
          const boundaryDoc = await resolveFirestoreDoc(collectionName, boundaryDocId);
          if (boundaryDoc.exists) {
            query = query.startAfter(boundaryDoc);
          } else {
            return null;
          }
        } else {
          // No cached boundary — can't paginate without offset
          return null;
        }
      } catch {
        return null;
      }
    }

    const latestDocs = await query.limit(pageSize).get();

    // Store page boundary in Redis so next page can use startAfter instead of .offset()
    if (redis && latestDocs.size === pageSize) {
      const lastDocId = latestDocs.docs[latestDocs.docs.length - 1].id;
      const boundaryKey = `hub:boundary:${cacheKey}:p${page}`;
      redis.set(boundaryKey, lastDocId, "EX", 86400).catch(() => {});
    }

    let itemsHtml = "";
    const itemListElements: Record<string, unknown>[] = [];
    let idx = 1;
    let latestCreatedAt: Date | null = null;

    latestDocs.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const title = data.title || data.name || "";
      // Skip placeholder/test entries from SEO output
      if (title.toLowerCase().includes("test")) return;
      const slug = title
        ? title
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
        : "oglas";
      const detailPathPrefix = DETAIL_PATH_MAP[collectionName] || collectionName;
      const canonicalUrl = `${APP_CONFIG.BASE_URL}/${detailPathPrefix}/${slug}~${id}`;
      itemsHtml += `<li><a href="${canonicalUrl}">${title || "Oglas"}</a> - ${data.city || "Srbija"}</li>`;

      itemListElements.push({
        "@type": "ListItem",
        position: idx++,
        name: title || "Oglas",
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
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/nis">Posao Niš</a></li>
               </ul>
               <h3>Popularne profesije</h3>
               <ul>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/zidar">Zidar posao</a></li>
                 <li><a href="${APP_CONFIG.BASE_URL}/poslovi/elektricar">Električar posao</a></li>
               </ul>
             </aside>`;
    }

    let label = matchedRoute.label;
    if (categorySlug) label += ` - ${categorySlug.replace(/-/g, " ")}`;
    if (citySlug) label += ` u ${citySlug.replace(/-/g, " ")}`;

    const isPseoPage = !!categorySlug || !!citySlug;
    const canonicalReqPath = isPseoPage ? reqPath : (CANONICAL_PATH_MAP[collectionName] || reqPath);
    const currentPageUrl = page > 1 ? `${APP_CONFIG.BASE_URL}${canonicalReqPath}?page=${page}` : `${APP_CONFIG.BASE_URL}${canonicalReqPath}`;
    const prevPageUrl = page > 1 ? `${APP_CONFIG.BASE_URL}${canonicalReqPath}?page=${page - 1}` : null;
    let nextPageUrl = null;
    if (latestDocs.size === pageSize) {
      const lastDocId = latestDocs.docs[latestDocs.docs.length - 1].id;
      nextPageUrl = `${APP_CONFIG.BASE_URL}${canonicalReqPath}?page=${page + 1}&cursor=${lastDocId}`;
    }

    let paginationLinks = `<link rel="canonical" href="${currentPageUrl}" />`;
    if (prevPageUrl) paginationLinks += `\n<link rel="prev" href="${prevPageUrl}" />`;
    if (nextPageUrl) paginationLinks += `\n<link rel="next" href="${nextPageUrl}" />`;

    const platformDesc = "Svet Građevine je vodeći građevinski portal na Balkanu. Povezujemo izvođače, poslodavce, majstore i klijente širom regiona.";
    const botListHtml = `
          <main>
             <h1>${label}</h1>
             <p>${label} na portalu Svet Građevine. Pronađeno ${latestDocs.size} oglasa na strani ${page}.</p>
             <p>${platformDesc}</p>
             <nav>
               <ul>
                 ${itemsHtml || "<li>Trenutno nema oglasa za ovu kategoriju.</li>"}
               </ul>
             </nav>
             ${hubLinks}
          </main>`;

    const title = `${label} | Svet Građevine`;
    const desc = `${label} na Svet Građevine - vodećem građevinskom portalu na Balkanu. Povezujemo izvođače, poslodavce, majstore i klijente širom regiona.`;

    const baseUrl = APP_CONFIG.BASE_URL;
    const bcPathParts = reqPath.split("/").filter(Boolean);
    const hasCity = citySlug !== undefined;
    const hasCategory = categorySlug !== undefined;

    const bcItems = [
      { "@type": "ListItem", position: 1, name: "Početna", item: baseUrl },
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
    html = html.replace(/<meta name="description"[^>]*\/?>/i, "");
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
<meta property="og:image" content="https://svetgradjevine.com/og-default.jpg" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="https://svetgradjevine.com/og-default.jpg" />
<style>img{aspect-ratio:auto;max-width:100%;height:auto}</style>
<script type="application/ld+json">${JSON.stringify(bc)}</script>
${jsonLdScript}
</head>`,
    );

    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">${botListHtml}</div>`,
    );

    if (redis) {
      const effectiveTtl = latestDocs.size === 0 ? cacheTtl * 2 : cacheTtl;
      await redis.set(cacheKey, html, "EX", effectiveTtl);
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
           <a href="${canonicalUrl}" itemprop="url">Prikaži originalni oglas</a>
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
          name: "Početna",
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
          name: adData.companyName || "Svet Građevine",
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
    html = html.replace(/<meta name="description"[^>]*\/?>/i, "");
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
<style>img{aspect-ratio:auto;max-width:100%;height:auto}</style>
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
        `<div id="root"></div>\n<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">${botSemanticHtml}</div>`,
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

async function backgroundPreRenderHomepage(
  cacheKey: string,
  cachedIndexHtml: string,
  cacheTtl: number,
): Promise<string | null> {
  const redis = getRedis();

  try {
    const snapshot = await db.collection("listings")
      .orderBy("createdAt", "desc")
      .limit(6)
      .get();

    let itemsHtml = "";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;
      const title = data.title || data.name || "Oglas";
      const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const typeMap: Record<string, string> = {
        job: "posao", machine: "masina", company: "firma",
        catering: "ketering", accommodation: "smestaj",
        plot: "placevi", marketplace: "alat-i-oprema",
      };
      const path = typeMap[data.type] || "oglas";
      const url = `${APP_CONFIG.BASE_URL}/${path}/${slug}~${id}`;
      const location = data.city || data.location || "";
      const price = data.price ? `${data.price} ${data.currency || "EUR"}` : "";

      itemsHtml += `<li><a href="${url}">${title}</a>${location ? ` - ${formatCity(location)}` : ""}${price ? ` (${price})` : ""}</li>`;
    });

    const platformDesc = "Svet Građevine je vodeći građevinski portal na Balkanu koji povezuje izvođače, poslodavce, majstore i klijente širom Srbije, Hrvatske, Bosne i Hercegovine, Crne Gore i regiona.";
    const botHtml = `
      <main>
        <h1>Svet Građevine - Portal za građevinske oglase</h1>
        <p>Najveći građevinski portal na Balkanu. Pronađite posao, mašine, firme, smeštaj i više.</p>
        <p>${platformDesc}</p>
        <p>Bez obzira da li tražite iskusnog zidara za renoviranje, rukovaoca bagerom za veliki projekat, ili želite da iznajmite građevinske mašine — na pravom ste mestu. Naša platforma nudi hiljade oglasa iz kategorija: posao u građevini, građevinske mašine, smeštaj za radnike, ketering, građevinsko zemljište, alat i oprema, i više.</p>
        <section>
          <h2>Najnoviji oglasi</h2>
          <ul>${itemsHtml || "<li>Trenutno nema aktivnih oglasa.</li>"}</ul>
        </section>
      </main>`;

    let html = cachedIndexHtml;
    html = html.replace(/<meta name="description"[^>]*\/?>/i, "");
    html = html.replace(/<title>.*?<\/title>/, `<title>Svet Građevine - Portal za građevinske oglase</title>`);
    html = html.replace("</head>", `
<meta name="description" content="Svet Građevine - najveći građevinski portal na Balkanu. Pronađite posao, mašine, firme, smeštaj i više." />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}/" />
</head>`);
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">${botHtml}</div>`);

    if (redis) {
      await redis.set(cacheKey, html, "EX", cacheTtl);
    }
    return html;
  } catch (error) {
    console.error("[SPA-Homepage] Error caching homepage:", error);
    return null;
  }
}

export const createSpaMiddleware = () => {
  const router = express.Router();
  const distPath = path.join(process.cwd(), "dist");

  let cachedIndexHtml: string | null = null;
  let cacheBuster = "1";
  try {
    const indexHtml = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
    const match = indexHtml.match(/\/assets\/index-([^.]+)\.js/);
    if (match) cacheBuster = match[1];
  } catch {}
  const CACHE_TTL = 2 * 3600; // 2 hours for listing page SSR (was 30min — too many Firestore reads when cold)
  const CACHE_TTL_EMPTY = 4 * 3600; // 4 hours for empty geo/profession listings (no results = no need to re-check often)
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
      } else if (/\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(path)) {
        // Images and fonts: 7 days + stale-while-revalidate
        res.setHeader("Cache-Control", "public, max-age=604800, stale-while-revalidate=86400");
      } else {
        // General static assets (service worker, manifest, etc.)
        res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600");
      }
    }
  }));

  router.use(async (req, res) => {
    try {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "Not Found" });
      }
      // ads.txt — served from dist/static or as fallback
      if (req.path === "/ads.txt") {
        res.header("Content-Type", "text/plain; charset=utf-8");
        res.header("Cache-Control", "public, max-age=86400");
        return res.send("# Svet Građevine - Ads.txt\n");
      }

      // 301 redirects for old/removed URLs
      const redirects: Record<string, string> = {
        "/onama": "/o-nama",
        "/kompanije": "/firme",
        "/radnici": "/poslovi",
        "/za-poslodavce": "/postavi-oglas",
      };
      if (redirects[req.path]) {
        return res.redirect(301, redirects[req.path]);
      }
      if (req.path.startsWith("/magazin/")) {
        return res.redirect(301, "/");
      }
      if (/^\/majstor\/.+~.+/.test(req.path)) {
        return res.redirect(301, "/majstori");
      }
      if (/^\/masina\/.+~.+/.test(req.path)) {
        return res.redirect(301, "/gradjevinske-masine");
      }

      const cacheKey = `seo:page:${cacheBuster}:${req.path}${req.query.page ? `?page=${req.query.page}` : ""}`;
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
          const gaId = env.VITE_GA_MEASUREMENT_ID || env.GA_MEASUREMENT_ID || "G-SVV63518LY";
          cachedIndexHtml = cachedIndexHtml.replace("%VITE_GA_MEASUREMENT_ID%", gaId);
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
          path: "/gradjevinske-masine",
          coll: "machines",
          label: "Građevinske mašine",
          alwaysListing: true,
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
          label: "Ketering i ugostiteljstvo",
        },
        {
          path: "/ketering",
          coll: "caterings",
          label: "Ketering i ugostiteljstvo",
          alwaysListing: true,
        },
        { path: "/placevi", coll: "plots", label: "Građevinsko zemljište" }, // /placevi/:grad and /placevi (Listing)
        { path: "/nekretnine/", coll: "plots", label: "Građevinsko zemljište" }, // /nekretnine/:id (Detail)
        { path: "/alat-i-oprema", coll: "marketplace", label: "Alat i građevinska oprema" }, // Handles both
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
          label: "Majstori u građevini",
          alwaysListing: true,
        },
      ];

      const matchedRoute = adRoutes.find((r) => req.path.startsWith(r.path)) as MatchedRoute | undefined;
      const isAdminRoute =
        req.path.startsWith("/admin") || req.path.startsWith("/dashboard");

      const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
      const isBot =
        /bot|googlebot|crawler|spider|robot|crawling|whatsapp|telegram|facebookexternalhit|twitterbot|linkedinbot|viber/i.test(
          userAgent,
        );

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
        html = html.replace(/<meta name="description"[^>]*\/?>/i, "");
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

      // Homepage: React SSR (fallback to clean shell)
      if (req.path === "/") {
        const indexHtml = cachedIndexHtml || await fs.promises.readFile(path.join(distPath, "index.html"), "utf-8");
        const scheme = req.get('x-forwarded-proto') || 'http';
        const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
        const ssrUrl = `${scheme}://${host}${req.originalUrl || req.path}`;
        const ssrResult = await reactSsrPage(ssrUrl);
        if (ssrResult) {
          const { html, dehydratedState, helmetHtml } = ssrResult;
          let finalHtml = stripHeadMeta(indexHtml)
            .replace('</head>', `${helmetHtml}<script>window.__SSR_DATA__=${JSON.stringify({ dehydratedState })}</script></head>`)
            .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
          res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
          const redisCache = getRedis();
          if (redisCache) {
            redisCache.set(cacheKey, finalHtml, "EX", CACHE_TTL).catch(() => {});
          }
          return res.send(finalHtml);
        }

        // Fallback: string-based pre-render
        const rendered = await backgroundPreRenderHomepage(cacheKey, indexHtml, CACHE_TTL);
        if (rendered) return res.send(rendered);

        // Clean shell fallback (no pre-rendered content)
        const cleanHtml = indexHtml
          .replace(/<title>.*?<\/title>/, `<title>Svet Građevine - Portal za građevinske oglase</title>`)
          .replace("</head>", `<meta name="description" content="Svet Građevine - najveći građevinski portal na Balkanu. Pronađite posao, mašine, firme, smeštaj i više." />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}/" />
<meta property="og:title" content="Svet Građevine - Portal za građevinske oglase" />
<meta property="og:description" content="Svet Građevine - najveći građevinski portal na Balkanu. Pronađite posao, mašine, firme, smeštaj i više." />
<meta property="og:image" content="https://svetgradjevine.com/og-default.jpg" />
<meta property="og:url" content="${APP_CONFIG.BASE_URL}/" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Svet Građevine - Portal za građevinske oglase" />
<meta name="twitter:description" content="Svet Građevine - najveći građevinski portal na Balkanu. Pronađite posao, mašine, firme, smeštaj i više." />
<meta name="twitter:image" content="https://svetgradjevine.com/og-default.jpg" />
</head>`);
        return res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send(cleanHtml);
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



        let categorySlug: string | undefined;
        let citySlug: string | undefined;

        if (isListingPage) {
          if (collectionName) {
            // Try React SSR for all visitors (not just bots)
            const scheme = req.get('x-forwarded-proto') || 'http';
            const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
            const ssrUrl = `${scheme}://${host}${req.originalUrl || req.path}`;
            const ssrResult = await reactSsrPage(ssrUrl);
            if (ssrResult) {
              const indexHtml = cachedIndexHtml || fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
              const { html, dehydratedState, helmetHtml } = ssrResult;
              let finalHtml = stripHeadMeta(indexHtml)
                .replace('</head>', `${helmetHtml}<script>window.__SSR_DATA__=${JSON.stringify({ dehydratedState })}</script></head>`)
                .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
              res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
              const redisCache = getRedis();
              if (redisCache) {
                redisCache.set(cacheKey, finalHtml, "EX", CACHE_TTL).catch(() => {});
              }
              return res.send(finalHtml);
            }

            if (isBot) {
              // Bot fallback: string-based pre-render
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
              const cursor = req.query.cursor as string | undefined;
              const rendered = await backgroundPreRenderListingHub(
                cacheKey, indexHtmlForListingBg, collectionName, matchedRoute, req.path, CACHE_TTL,
                categorySlug, citySlug, pageNum, cursor
              );
              if (rendered) return res.send(rendered);
            } else {
              // Non-bot fallback: serve clean SPA shell with meta tags
              const fullTitle = `${matchedRoute.label} | Svet Građevine`;
              const baseDesc = `${matchedRoute.label} na Svet Građevine - vodećem građevinskom portalu na Balkanu. Povezujemo izvođače, poslodavce, majstore i klijente.`;
              const canonicalPath = isPseoRoute ? req.path : (CANONICAL_PATH_MAP[collectionName] || req.path);
              html = html.replace(/<meta name="description"[^>]*\/?>/gi, "");
              const cleanHtml = html
                .replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`)
                .replace("</head>", `
<meta name="description" content="${matchedRoute.label} - Pregledajte sve oglase. Svet Građevine je vodeći građevinski portal na Balkanu." />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}${canonicalPath}" />
<meta property="og:title" content="${fullTitle}" />
<meta property="og:description" content="${baseDesc}" />
<meta property="og:url" content="${APP_CONFIG.BASE_URL}${canonicalPath}" />
<meta property="og:image" content="https://svetgradjevine.com/og-default.jpg" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${fullTitle}" />
<meta name="twitter:description" content="${baseDesc}" />
<meta name="twitter:image" content="https://svetgradjevine.com/og-default.jpg" />
</head>`);
              return res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send(cleanHtml);
            }
          }

          // Build breadcrumb for geo pages with 3 levels
          let label = matchedRoute.label;
          let breadcrumbHtml = "";
          const baseUrl = APP_CONFIG.BASE_URL;
          if (isGeoPage) {
            const readableCity = citySlug ? formatCity(citySlug) : formatCity(lastSegment);
            const listingUrl = `${baseUrl}/${pathSegments[0]}`;
            const currentUrl = `${baseUrl}${req.path}`;
            if (categorySlug) {
              const readableCategory = categorySlug.replace(/-/g, " ");
              label = `${matchedRoute.label} - ${readableCategory} u ${readableCity}`;
              breadcrumbHtml = `<script type="application/ld+json">${JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Početna", item: baseUrl },
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
                  { "@type": "ListItem", position: 1, name: "Početna", item: baseUrl },
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
                { "@type": "ListItem", position: 1, name: "Početna", item: baseUrl },
                { "@type": "ListItem", position: 2, name: matchedRoute.label, item: `${baseUrl}${req.path}` },
              ],
            })}</script>`;
          }

          const pageNum = parseInt((req.query.page as string) || "1", 10) || 1;
          const canonicalSkeletonPath = isPseoRoute ? req.path : (CANONICAL_PATH_MAP[collectionName] || req.path);
          const currentPageUrl = pageNum > 1 ? `${APP_CONFIG.BASE_URL}${canonicalSkeletonPath}?page=${pageNum}` : `${APP_CONFIG.BASE_URL}${canonicalSkeletonPath}`;
          const prevPageUrl = pageNum > 1 ? `${APP_CONFIG.BASE_URL}${canonicalSkeletonPath}?page=${pageNum - 1}` : null;
          let paginationLinks = `<link rel="canonical" href="${currentPageUrl}" />`;
          if (prevPageUrl) paginationLinks += `\n<link rel="prev" href="${prevPageUrl}" />`;

          const lastmod = new Date().toISOString().split("T")[0];

          // Fallback skeleton for non-bot or if pre-render fails
          let skeletonHtml = html;
          skeletonHtml = skeletonHtml.replace(/<meta name="description"[^>]*\/?>/i, "");
          const fullTitle = `${label} | Svet Građevine`;
          skeletonHtml = skeletonHtml.replace(/<title>.*?<\/title>/, `<title>${fullTitle}</title>`);
          const defaultImage = "https://svetgradjevine.com/og-default.jpg";
          skeletonHtml = skeletonHtml.replace(
            "</head>",
            `
<meta name="description" content="${label} na Svet Građevine - vodećem građevinskom portalu na Balkanu. Povezujemo izvođače, poslodavce, majstore i klijente širom regiona." />
<meta name="lastmod" content="${lastmod}" />
${paginationLinks}
${breadcrumbHtml}
<meta property="og:title" content="${fullTitle}" />
<meta property="og:description" content="${label} na Svet Građevine - vodećem građevinskom portalu na Balkanu." />
<meta property="og:image" content="${defaultImage}" />
<meta property="og:url" content="${currentPageUrl}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${fullTitle}" />
<meta name="twitter:description" content="${label} na Svet Građevine - vodećem građevinskom portalu na Balkanu." />
<meta name="twitter:image" content="${defaultImage}" />
</head>`,
          );
          skeletonHtml = skeletonHtml.replace(
            '<div id="root"></div>',
            `<div id="root"></div>\n<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true"><main><h1>${label}</h1><a href="${APP_CONFIG.BASE_URL}/">Svet Građevine</a></main></div>`,
          );
          return res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400').send(skeletonHtml);
        }

        const parts = fullId.split("~");
        const adId = parts.length > 1 ? parts[parts.length - 1] : fullId;

        if (adId && collectionName) {
          // If not bot, we return the cached static index.html instantly so browser can bootstrap Fast.
          // Inject a basic title from slug so AhrefsSpeedTest and other non-bot crawlers see a page title.
          if (!isBot && cachedIndexHtml) {
            let slugPart = adId;
            if (fullId.includes("~")) {
              slugPart = fullId.split("~")[0];
            }
            const readableTitle = slugPart
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            const title = `${readableTitle} | Svet Građevine`;
            const nonBotHtml = cachedIndexHtml.replace(
              /<title>.*?<\/title>/,
              `<title>${title}</title>`,
            );
            return res.send(nonBotHtml);
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
          const defaultImage = "https://svetgradjevine.com/og-default.jpg";

          const detailLastmod = new Date().toISOString().split("T")[0];

          let skeletonHtml = stripHeadMeta(html);
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

      // Cene i statistika — SSR metadata
      if (req.path.startsWith("/cene-i-statistika")) {
        const parts = req.path.split("/").filter(Boolean);
        const professionSlug = parts[1] || "";
        const citySlug = parts[2] || "";
        const professionName = professionSlug ? professionSlug.replace(/-/g, " ") : "";
        const cityName = citySlug ? formatCity(citySlug) : "";

        const pageTitle = professionName
          ? cityName
            ? `Cene i statistika — ${professionName} — ${cityName} | Svet Građevine`
            : `Cene i statistika — ${professionName} | Svet Građevine`
          : "Cene i statistika | Svet Građevine";
        const pageDesc = professionName
          ? cityName
            ? `Pregled cena i statistike za ${professionName} u ${cityName}. Prosečne plate, broj oglasa i trendovi na Svet Građevine.`
            : `Pregled cena i statistike za ${professionName}. Prosečne plate, broj oglasa i trendovi na Svet Građevine.`
          : "Pregled cena i statistike za građevinske profesije. Prosečne plate, broj oglasa, potražnja i trendovi.";
        const canonicalUrl = `${APP_CONFIG.BASE_URL}${req.path}`;

        let skeletonHtml = html;
        skeletonHtml = skeletonHtml.replace(/<meta name="description"[^>]*\/?>/i, "");
        skeletonHtml = skeletonHtml.replace(/<title>.*?<\/title>/, `<title>${pageTitle}</title>`);
        skeletonHtml = skeletonHtml.replace(
          "</head>",
          `<meta name="description" content="${pageDesc}" />
<meta name="lastmod" content="${new Date().toISOString().split("T")[0]}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta property="og:title" content="${pageTitle}" />
<meta property="og:description" content="${pageDesc}" />
<meta property="og:image" content="https://svetgradjevine.com/og-default.jpg" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${pageTitle}" />
<meta name="twitter:description" content="${pageDesc}" />
<meta name="twitter:image" content="https://svetgradjevine.com/og-default.jpg" />
<meta name="robots" content="index, follow" />
</head>`,
        );
        skeletonHtml = skeletonHtml.replace(
          '<div id="root"></div>',
          `<div id="root"></div>\n<div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true"><main><h1>${pageTitle.replace(" | Svet Građevine", "")}</h1></main></div>`,
        );
        return res.send(skeletonHtml);
      }

      // Passthrough for SPA-only routes handled by React Router (no server pre-render needed)
      const spaPassthroughPrefixes = ["/pretraga", "/profil", "/postavi-oglas"];
      const isSpaPassthrough = spaPassthroughPrefixes.some(p => req.path.startsWith(p));
      if (isSpaPassthrough) {
        const passthroughHtml = html.replace(
          "</head>",
          `<link rel="canonical" href="${APP_CONFIG.BASE_URL}${req.path}" />\n</head>`,
        );
        return res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300').send(passthroughHtml);
      }

      // Custom 404 for unmatched routes
      const notFoundHtml = html
        .replace(/<meta name="description"[^>]*\/?>/i, "")
        .replace(/<title>.*?<\/title>/, "<title>Stranica nije pronađena | Svet Građevine</title>")
        .replace(
          "</head>",
          `<meta name="description" content="Tražena stranica nije pronađena (404)." />
<meta name="robots" content="noindex, follow" />
<link rel="canonical" href="${APP_CONFIG.BASE_URL}${req.path}" />
</head>`,
        )
        .replace(
          '<div id="root"></div>',
          `<div id="root"><main style="text-align:center;padding:4rem 1rem"><h1>404</h1><p>Stranica nije pronađena.</p><a href="/">Početna stranica</a></main></div>`,
        );
      res.status(404).send(notFoundHtml);
    } catch (err) {
      console.error("[SPA] Unhandled error for", req.path, err);
      if (!res.headersSent) {
        const fallback = cachedIndexHtml || '<!DOCTYPE html><html lang="sr"><head><title>Svet Građevine</title></head><body><div id="root"></div></body></html>';
        res.status(500).send(fallback);
      }
    }
  });

  return router;
};

