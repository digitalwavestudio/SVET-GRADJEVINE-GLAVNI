import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { UnifiedSearchService } from "../unified-search.service.ts";
import { SEOSchemaService } from "./seo-schema.service.ts";
import { logger, Logger } from "../../utils/logger.ts";
import { CITIES as cities, displayCity as toCityName } from "../../constants/geo.ts";
import { APP_CONFIG } from "../../../src/constants/config.ts";

export class SEODbService {
  static async getHubMetaData(hubType: string, params: Record<string, unknown>) {
    const category = params.category as string;
    const city = params.city as string;
    const categoryOrCity = params.categoryOrCity as string;
let title = "Svet Građevine";
let description = "Svet Građevine – vodeći građevinski portal za Srbiju i Nemačku. Poslovi u građevini, građevinske firme i majstori. Besplatno postavi oglas.";
    let url = "https://svetgradjevine.com";

    let stateCategory = "jobs";
    let stateFilters: Record<string, unknown> = {};

    if (hubType === "job_category_city") {
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
      const displayCity = toCityName(city);
      title = `Poslovi ${displayCat} u ${displayCity} | Svet Građevine`;
      description = `Tražite posao kao ${displayCat} u gradu ${displayCity}? Pogledajte najnovije oglase za posao na vodećem građevinskom portalu.`;
      url += `/poslovi/${category}/${city}`;
      stateCategory = "jobs";
      stateFilters = { locationSlug: city, professionSlug: category };
    } else if (hubType === "job_single_param") {
      const param = categoryOrCity;
      if (cities.includes(param)) {
        const displayCity = toCityName(param);
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
      const displayCity = toCityName(city);
      title = `Građevinske Firme: ${displayCity} | Svet Građevine`;
      description = `Katalog građevinskih firmi i kompanija u gradu ${displayCity}. Pronađite izvođače, projektante i partnere.`;
      url += `/firme/${city}`;
      stateCategory = "companies";
      stateFilters = { locationSlug: city };
    } else if (hubType === "master_category_city") {
      const displayCat = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");
      const displayCity = toCityName(city);
      title = `${displayCat}: Majstori i Izvođači u mestu ${displayCity} | Svet Građevine`;
      description = `Tražite profesionalne izvođače za ${displayCat} u gradu ${displayCity}? Pregledajte profile majstora, ocene i kontaktirajte ih direktno.`;
      url += `/majstori/${category}/${city}`;
      stateCategory = "masters";
      stateFilters = { locationSlug: city, professionSlug: category };
    } else if (hubType === "master_single_param") {
      const param = categoryOrCity;
      if (cities.includes(param)) {
        const displayCity = toCityName(param);
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

      // Fetch hub metadata synchronously so the FIRST request gets real data.
      try {
        const hubMeta = await this.backgroundFetchAndCacheHubMetaData(
          hubType,
          params,
          stateCategory,
          stateFilters,
          title,
          description,
          url,
          cacheKey,
        );
        if (hubMeta) return hubMeta;
      } catch (err) {
        console.error(`[SEO] Error fetching hub metadata for ${url}:`, err);
      }

      // Fallback if fetch fails
      return {
        title,
        description,
        image: "https://www.svetgradjevine.com/og-image.png",
        url,
        initialState: null,
        botHtml: "",
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
        image: "https://www.svetgradjevine.com/og-image.png",
        url,
        initialState: null,
        botHtml: "",
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
  ): Promise<Record<string, unknown> | null> {
    const { LockManager } = await import("../lock.service.ts");
    const lockKey = `lock:seo_hub:${cacheKey}`;
    const lockId = await LockManager.acquire(lockKey, 30000);
    if (!lockId) {
      const waitStart = Date.now();
      while (Date.now() - waitStart < 5000) {
        await new Promise(r => setTimeout(r, 500));
        const cached = await CacheService.get<Record<string, unknown>>(cacheKey);
        if (cached) return cached;
      }
      return null;
    }

    try {
      let initialState = null;
      let botHtml = "";
      try {
        const searchResult = await UnifiedSearchService.search(
          stateCategory,
          { ...stateFilters, skipCount: true },
          15,
        );
        initialState = { searchResult };

        // Bot-visible lista oglasa (SSR za crawler-e, thin-content fix)
        const docs = (searchResult as any)?.docs || [];
        const detailPrefix = stateCategory === "jobs" ? "posao"
          : stateCategory === "companies" ? "firma"
          : stateCategory === "masters" ? "profil"
          : stateCategory;
        let itemsHtml = "";
        const itemListElements: Record<string, unknown>[] = [];
        const escapeHtml = (s: string) => s
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
        let idx = 1;
        for (const doc of docs) {
          const data = doc.data ? doc.data() : doc;
          const id = doc.id;
          const t = data.title || data.name || data.adTitle || "Oglas";
          const slugBase = `${t} ${data.location || data.loc || ""} ${data.comp || data.company || ""}`.toLowerCase()
            .replace(/đ/g, "dj").replace(/č/g, "c").replace(/ć/g, "c").replace(/š/g, "s")
            .replace(/ž/g, "z").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const detailUrl = `${APP_CONFIG.BASE_URL}/${detailPrefix}/${slugBase}~${id}`;
          itemsHtml += `<li><a href="${detailUrl}">${escapeHtml(t)}</a>${data.location || data.loc ? ` - ${escapeHtml(data.location || data.loc)}` : ""}</li>`;
          itemListElements.push({ "@type": "ListItem", position: idx++, name: t, url: detailUrl });
        }
        const itemListSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: itemListElements,
        };
        botHtml = `
          <main>
            <h1>${escapeHtml(title.replace(" | Svet Građevine", ""))}</h1>
            <p>${escapeHtml(description)}</p>
            <ul>${itemsHtml || "<li>Trenutno nema oglasa za ovu kategoriju.</li>"}</ul>
            <script type="application/ld+json">${JSON.stringify(itemListSchema)}</script>
          </main>`;
      } catch (err) {
        logger.warn("[SEO-Background] Failed to fetch static initial state for hub:", err);
      }

      const meta = {
        title,
        description,
        image: "https://www.svetgradjevine.com/og-image.png",
        url,
        initialState,
        botHtml,
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

      await CacheService.set(cacheKey, meta, 3600000);
      return meta;
    } catch (err) {
      console.error("[SEO] Failed hub metadata fetch:", err);
      return null;
    } finally {
      await LockManager.release(lockKey, lockId).catch((e: any) => logger.warn("[SEODb] lock release error:", e?.message));
    }
  }

  static async generateSitemap() {
    const esc = (s: unknown): string =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    const cacheKey = "seo:sitemap";
    try {
      const cached = await CacheService.get<string>(cacheKey);
      if (cached) return cached;
      const collections = [
        "jobs",
        "companies",
        "users",
      ];

      // Svi gradovi (RS + DE) i zanimanja za geo hub sitemap
      const rsCities = ["beograd", "novi-sad", "nis", "kragujevac", "subotica", "zrenjanin", "pancevo", "smederevo", "cacak", "novi-pazar", "kraljevo", "sabac", "uzice", "vranje", "valjevo", "leskovac", "krusevac", "zajecar", "sombor", "pozarevac", "pirot", "bor"];
      const deSlugs = ["nemacka", "berlin", "munchen", "muenchen", "hamburg", "koln", "koeln", "frankfurt", "stuttgart", "dortmund", "leipzig", "dresden", "bremen", "duesseldorf", "nurnberg", "nuernberg", "hannover"];
      const allCities = [...rsCities, ...deSlugs];
      const professionSlugs = [...new Set([
        "zidar", "tesar", "armirac", "univerzalac-majstor", "krovopokrivac", "betonirac", "masinski-malter", "fizicki-radnik", "pomocni-radnik",
        "rukovalac-kranom", "rukovalac-bagerom", "rukovalac-viljuskarom", "rukovalac-telehenderom", "rukovalac-valjkom", "rukovalac-finiserom", "rukovalac-gradjevinskim-masinama", "vozac-kamiona", "dispecer-transporta",
        "moler", "gipsar", "fasader", "keramicar", "parketar", "pvc-i-alu-stolar", "majstor-za-listele", "majstor-za-kosuljicu", "majstor-za-ravnajuci-sloj", "izolater", "podopolagac", "monter-kamena",
        "vodoinstalater", "elektricar", "elektroinstalater-slabe-struje", "instalater-grejanja", "instalater-solarnih-panela", "instalater-protivpozarnih-sistema", "telekomunikacioni-instalater", "gasni-instalater", "tehnicar-pametnih-kuca", "hvac-tehnicar",
        "zavarivac", "bravar", "limar", "montazer-celicnih-konstrukcija", "industrijski-monter", "antikorozista", "peskirac", "busac-betona",
        "asfalter", "putar", "cevopolagac", "betonac-za-puteve-i-tunele", "radnik-na-hidrogradnji", "geobusac", "bunardzija", "radnik-na-niskogradnji",
        "gradjevinski-inzenjer-visokogradnja", "gradjevinski-inzenjer-niskogradnja", "arhitekta-projektant", "geodeta-geometar", "sef-gradilista", "projekt-menadzer", "nadzorni-organ", "saradnik-za-bzr", "specijalista-za-rusenje",
        "cuvar-gradilista", "radnik-na-ciscenju", "bastovan"
      ])];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${APP_CONFIG.BASE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/poslovi</loc><priority>0.9</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/firme</loc><priority>0.8</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/o-nama</loc><priority>0.5</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/kontakt</loc><priority>0.5</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/o-nama</loc><priority>0.6</priority></url>
  <url><loc>${APP_CONFIG.BASE_URL}/majstori</loc><priority>0.8</priority></url>`;
      // Geo hubovi: poslovi (samo grad)
      for (const city of allCities) {
        xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/poslovi/${city}</loc><priority>0.7</priority></url>`;
        xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/firme/${city}</loc><priority>0.6</priority></url>`;
        xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/majstori/${city}</loc><priority>0.6</priority></url>`;
      }
      // Geo hubovi: poslovi (zanat) i poslovi (zanat + grad)
      for (const prof of professionSlugs) {
        xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/poslovi/${prof}</loc><priority>0.7</priority></url>`;
        xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/majstori/${prof}</loc><priority>0.6</priority></url>`;
        for (const city of allCities) {
          xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/poslovi/${prof}/${city}</loc><priority>0.7</priority></url>`;
          xml += `\n  <url><loc>${APP_CONFIG.BASE_URL}/majstori/${prof}/${city}</loc><priority>0.6</priority></url>`;
        }
      }
      // Poslovi i firme su u listings kolekciji sa type filterom
      const listingTypes = ["job", "company"];
      for (const typeVal of listingTypes) {
        try {
          const snap = await db.collectionGroup("listings")
            .where("type", "==", typeVal)
            .where("status", "==", "active")
            .orderBy("createdAt", "desc")
            .get();
          for (const doc of snap.docs) {
            const data = doc.data();
            const path = typeVal === "job" ? "posao" : "firma";
            const t = data.title || data.name || "bez-naslova";
            const l = data.location || data.loc || "";
            const c = data.company || data.comp || "";
            const slug = SEOSchemaService.slugify(`${t} ${l} ${c}`.trim());
            const urlId = `${slug}~${doc.id}`;
            const imgUrl = data.images?.[0] || data.logo;
            const lastMod = data.updatedAt?.toDate?.()?.toISOString().split("T")[0] ||
              data.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
              new Date().toISOString().split("T")[0];
            xml += `\n    <url>\n      <loc>${APP_CONFIG.BASE_URL}/${path}/${urlId}</loc>\n      <lastmod>${lastMod}</lastmod>\n      <changefreq>monthly</changefreq>\n      <priority>0.6</priority>`;
            if (imgUrl) xml += `\n      <image:image><image:loc>${imgUrl}</image:loc></image:image>`;
            xml += `\n    </url>`;
          }
        } catch (e) {
          logger.warn(`[Sitemap] listings where type=${typeVal} failed:`, e);
        }
      }
      // Korisnici (majstori)
      try {
        const userSnap = await db.collection("users")
          .where("role", "in", ["majstor", "poslodavac", "partner", "agencija", "kompanija"])
          .orderBy("createdAt", "desc")
          .limit(500)
          .get();
        for (const doc of userSnap.docs) {
          const data = doc.data();
          const imgUrl = data.photoURL || data.avatar;
          const lastMod = data.updatedAt?.toDate?.()?.toISOString().split("T")[0] ||
            data.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
            new Date().toISOString().split("T")[0];
          xml += `\n    <url>\n      <loc>${APP_CONFIG.BASE_URL}/profil/${doc.id}</loc>\n      <lastmod>${lastMod}</lastmod>\n      <changefreq>monthly</changefreq>\n      <priority>0.5</priority>`;
          if (imgUrl) xml += `\n      <image:image><image:loc>${imgUrl}</image:loc></image:image>`;
          xml += `\n    </url>`;
        }
      } catch (e) {
        logger.warn("[Sitemap] users query failed:", e);
      }
      xml += "\n</urlset>";
      await CacheService.set(cacheKey, xml, 21600000); // 6h cache
      return xml;
    } catch (error) {
      console.error("Sitemap error:", error);
      throw error;
    }
  }
}
