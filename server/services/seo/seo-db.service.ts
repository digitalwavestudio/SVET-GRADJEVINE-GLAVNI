import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { UnifiedSearchService } from "../unified-search.service.ts";
import { SEOSchemaService } from "./seo-schema.service.ts";

export class SEODbService {
  static async getHubMetaData(hubType: string, params: Record<string, unknown>) {
    const category = params.category as string;
    const city = params.city as string;
    const categoryOrCity = params.categoryOrCity as string;
    let title = "Građevinski Portal";
    let description = "Najveći portal za građevinarstvo na Balkanu.";
    let url = "https://svetgradjevine.com";

    const cities = [
      "beograd",
      "novi-sad",
      "nis",
      "kragujevac",
      "subotica",
      "zrenjanin",
      "pancevo",
    ];
    let stateCategory = "jobs";
    let stateFilters: Record<string, unknown> = {};

    if (hubType === "job_category_city") {
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
      const displayCity = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, " ");
      title = `Poslovi ${displayCat} u ${displayCity} | Svet Građevine`;
      description = `Tražite posao kao ${displayCat} u gradu ${displayCity}? Pogledajte najnovije oglase za posao na vodećem građevinskom portalu.`;
      url += `/poslovi/${category}/${city}`;
      stateCategory = "jobs";
      stateFilters = { locationSlug: city, professionSlug: category };
    } else if (hubType === "job_single_param") {
      const param = categoryOrCity;
      if (cities.includes(param)) {
        const displayCity = param.charAt(0).toUpperCase() + param.slice(1).replace(/-/g, " ");
        title = `Građevinski Poslovi u ${displayCity} | Svet Građevine`;
        description = `Pronađite posao u građevini u gradu ${displayCity}. Pogledajte oglase za zidare, tesare, inženjere i ostale profile.`;
        stateCategory = "jobs";
        stateFilters = { locationSlug: param };
      } else {
        const displayCat = param.charAt(0).toUpperCase() + param.slice(1).replace(/-/g, " ");
        title = `Posao: ${displayCat} | Svet Građevine`;
        description = `Najveća ponuda oglasa za posao za profil: ${displayCat}. Pronađite zaposlenje u građevinskom sektoru.`;
        stateCategory = "jobs";
        stateFilters = { professionSlug: param };
      }
      url += `/poslovi/${param}`;
    } else if (hubType === "company_city") {
      const displayCity = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, " ");
      title = `Građevinske Firme: ${displayCity} | Svet Građevine`;
      description = `Katalog građevinskih firmi i kompanija u gradu ${displayCity}. Pronađite izvođače, projektante i partnere.`;
      url += `/firme/${city}`;
      stateCategory = "companies";
      stateFilters = { locationSlug: city };
    } else if (hubType === "master_category_city") {
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
      const displayCity = city.charAt(0).toUpperCase() + city.slice(1).replace(/-/g, " ");
      title = `${displayCat}: Majstori i Izvođači u mestu ${displayCity} | Svet Građevine`;
      description = `Tražite profesionalne izvođače za ${displayCat} u gradu ${displayCity}? Pregledajte profile majstora, ocene i kontaktirajte ih direktno.`;
      url += `/majstori/${category}/${city}`;
      stateCategory = "masters";
      stateFilters = { locationSlug: city, professionSlug: category };
    } else if (hubType === "master_single_param") {
      const param = categoryOrCity;
      if (cities.includes(param)) {
        const displayCity = param.charAt(0).toUpperCase() + param.slice(1).replace(/-/g, " ");
        title = `Građevinski Majstori u gradu ${displayCity} | Svet Građevine`;
        description = `Katalog građevinskih majstora i izvođača u mestu ${displayCity}. Pronađite molere, zidare, keramičare i druge stručnjake.`;
        stateCategory = "masters";
        stateFilters = { locationSlug: param };
      } else {
        const displayCat = param.charAt(0).toUpperCase() + param.slice(1).replace(/-/g, " ");
        title = `Majstori: ${displayCat} | Svet Građevine`;
        description = `Najveći izbor proverenih majstora za: ${displayCat}. Pogledajte slike izvedenih radova i reference.`;
        stateCategory = "masters";
        stateFilters = { professionSlug: param };
      }
      url += `/majstori/${param}`;
    }

    const cacheKey = `seo:hub:${url}`;
    try {
      const cached = await CacheService.get<Record<string, unknown>>(cacheKey);
      if (cached) return cached;

      // START OF PSEO SKELETON AUTOMATION
      // Fire-and-forget background resolution to avoid blocking the main thread / hydration with synchronous Firestore calls
      this.backgroundFetchAndCacheHubMetaData(
        hubType,
        params,
        stateCategory,
        stateFilters,
        title,
        description,
        url,
        cacheKey,
      ).catch(err => {
        console.error(`[SEO-Background] Error compiling hub metadata for ${url}:`, err);
      });

      // Instantly return static fallback meta to trigger fast-serving of SEO friendly skeletons on the server
      return {
        title,
        description,
        image: "https://svetgradjevine.com/og-default.jpg",
        url,
        initialState: null, // Strict cache strategy: skeleton only, no synchronous db bypass
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: description,
          url: url,
        },
      };
    } catch (e) {
      console.error("SEO Hub Data Error:", e);
      return {
        title,
        description,
        image: "https://svetgradjevine.com/og-default.jpg",
        url,
        initialState: null,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: description,
          url: url,
        },
      };
    }
  }

  static async backgroundFetchAndCacheHubMetaData(
    hubType: string,
    params: Record<string, unknown>,
    stateCategory: string,
    stateFilters: Record<string, unknown>,
    title: string,
    description: string,
    url: string,
    cacheKey: string,
  ): Promise<void> {
    const { RedisLockManager } = await import("../../utils/redis-lock.ts");
    const lockKey = `lock:seo_hub:${cacheKey}`;
    const lockId = await RedisLockManager.acquire(lockKey, 30000);
    if (!lockId) {
      console.log(`[SEO-Background] Background compilation already in progress for hub ${url}. Skipping concurrent Firestore read.`);
      return;
    }

    try {
      let initialState = null;
      try {
        const searchResult = await UnifiedSearchService.search(
          stateCategory,
          { ...stateFilters, skipCount: true },
          10,
        );
        initialState = { searchResult };
      } catch (err) {
        console.warn("[SEO-Background] Failed to fetch static initial state for hub:", err);
      }

      const meta = {
        title,
        description,
        image: "https://svetgradjevine.com/og-default.jpg",
        url,
        initialState,
        structuredData: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: description,
          url: url,
        },
        updatedAt: Date.now(),
        viewsCount: 1,
      };

      await CacheService.set(cacheKey, meta, 3600000); // 1h cache
    } catch (err) {
      console.error("[SEO-Background] Failed compiler compiling for hub:", err);
    } finally {
      await RedisLockManager.release(lockKey, lockId).catch(() => {});
    }
  }

  static async generateSitemap() {
    const cacheKey = "seo:sitemap";
    try {
      const cached = await CacheService.get<string>(cacheKey);
      if (cached) return cached;
      const collections = [
        "jobs",
        "machines",
        "accommodations",
        "caterings",
        "plots",
        "marketplace",
        "companies",
        "users",
      ];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>https://svetgradjevine.com/</loc><priority>1.0</priority></url>
  <url><loc>https://svetgradjevine.com/poslovi</loc><priority>0.9</priority></url>
  <url><loc>https://svetgradjevine.com/firme</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/magazin</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/o-nama</loc><priority>0.5</priority></url>
  <url><loc>https://svetgradjevine.com/kontakt</loc><priority>0.5</priority></url>
  <url><loc>https://svetgradjevine.com/paketi</loc><priority>0.6</priority></url>
  <url><loc>https://svetgradjevine.com/alat-i-oprema</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/placevi</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/masine</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/smestaj</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/ketering</loc><priority>0.8</priority></url>
  <url><loc>https://svetgradjevine.com/majstori</loc><priority>0.8</priority></url>`;
      const results = await Promise.all(
        collections.map(async (coll) => {
          try {
            let query: import("firebase-admin/firestore").Query = db
              .collection(coll)
              .where("status", "==", "active");

            // Specifični filteri za kolekcije
            if (coll === "users") {
              // Samo javni profili (majstori, firme, partneri) idu u sitemap
              query = query.where("role", "in", [
                "majstor",
                "poslodavac",
                "partner",
                "agencija",
                "kompanija",
              ]);
            }

            const snap = await query
              .select("category", "updatedAt")
              .orderBy("createdAt", "desc")
              .limit(500)
              .get();
            return snap.docs
              .map((doc) => {
                const data = doc.data();
                let path = "";
                let urlId = doc.id;

                switch (coll) {
                  case "jobs":
                    path = "posao";
                    const t = data.title || data.name || "bez-naslova";
                    const l = data.location || data.loc || "";
                    const c = data.company || data.comp || "";
                    const slug = SEOSchemaService.slugify(`${t} ${l} ${c}`.trim());
                    urlId = `${slug}~${doc.id}`;
                    break;
                  case "companies":
                    path = "firma";
                    break;
                  case "plots":
                    path = "nekretnine";
                    break;
                  case "machines":
                    path = "gradjevinske-masine";
                    break;
                  case "caterings":
                    path = "ketering/provajder";
                    break;
                  case "accommodations":
                    path = "smestaj";
                    break;
                  case "marketplace":
                    path = "alat-i-oprema";
                    break;
                  case "users":
                    path = "profil";
                    break;
                  default:
                    path = coll;
                }

                const imgUrl = data.images?.[0] || data.logo || data.photoURL;
                const lastMod =
                  data.updatedAt?.toDate?.()?.toISOString().split("T")[0] ||
                  data.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
                  new Date().toISOString().split("T")[0];

                return `
    <url>
      <loc>https://svetgradjevine.com/${path}/${urlId}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${coll === "users" ? "0.6" : "0.7"}</priority>
      ${
        imgUrl
          ? `
      <image:image>
        <image:loc>${imgUrl}</image:loc>
        <image:title>${(data.title || data.name || data.adTitle || "Oglas").substring(0, 100)}</image:title>
      </image:image>`
          : ""
      }
    </url>`;
              })
              .join("");
          } catch (e) {
            console.error(`Error processing collection ${coll} for sitemap:`, e);
            return "";
          }
        })
      );

      xml += results.join("");
      xml += "\n</urlset>";
      await CacheService.set(cacheKey, xml, 21600000); // 6h cache
      return xml;
    } catch (error) {
      console.error("Sitemap error:", error);
      throw error;
    }
  }
}
