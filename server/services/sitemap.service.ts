import { db } from "../config/firebase.ts";
import { APP_CONFIG } from "../../src/constants/config.ts";
import { AdminStatsService } from "./admin-stats.service.ts";
import { CacheService } from "./cache.service.ts";

export class SitemapService {
  private static domain = APP_CONFIG.BASE_URL;
  private static CHUNK_SIZE = 25000; // Sigurna margina za memoriju (standardni limit je 50k)

  /**
   * Sitemap Manifest Engine
   * Retreives pre-calculated document counts from metadata docs to safely determine
   * pagination requirements without ever performing collectionGroup or count() scans.
   */
  static async getSitemapManifest(): Promise<Record<string, number>> {
    const stats = await AdminStatsService.getGlobalStats();
    
    // We also fetch magazine stats to have a complete picture of the platform
    const magazineStatsSnapshot = await db.doc("metadata/magazine_stats").get().catch(() => null);
    const magazineStats = magazineStatsSnapshot?.exists ? magazineStatsSnapshot.data() : { totalArticles: 0 };

    return {
      jobs: Number(stats.totalJobs) || 0,
      machines: Number(stats.machinesCount) || 0,
      accommodations: Number(stats.accommodationsCount) || 0,
      caterings: Number(stats.cateringCount) || 0,
      plots: Number(stats.realEstateCount) || 0,
      marketplace: Number(stats.marketplaceCount) || 0,
      companies: Number(stats.companiesCount) || 0,
      masters: Number(stats.mastersCount) || 0,
      magazine: Number(magazineStats?.totalArticles) || 0,
    };
  }

  /**
   * Generiše Sitemap Index koji dinamički uključuje paginirane sitemape za velike kolekcije.
   */
  static async generateIndex(): Promise<string> {
    return CacheService.getOrSet<string>(
      "sitemapxml:index",
      async () => {
        const manifest = await this.getSitemapManifest();
        const sitemaps: string[] = ["static", "pseo"];

        // Dinamička paginacija za sve podržane kategorije na bazu manifesta
        for (const [coll, count] of Object.entries(manifest)) {
          const pages = Math.ceil(count / this.CHUNK_SIZE) || 1;
          for (let i = 1; i <= pages; i++) {
            sitemaps.push(`${coll}-${i}`);
          }
        }

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml +=
          '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        sitemaps.forEach((s) => {
          xml += "  <sitemap>\n";
          xml += `    <loc>${this.domain}/sitemap-${s}.xml</loc>\n`;
          xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
          xml += "  </sitemap>\n";
        });

        xml += "</sitemapindex>";
        return xml;
      },
      24 * 60 * 60 * 1000 // 24 sata TTL
    );
  }

  static async generateMagazineSitemap(page: number = 1, startAfterDoc?: any): Promise<{ xml: string, lastDoc: any }> {
    const skip = (page - 1) * this.CHUNK_SIZE;
    let q = db
      .collection("articles")
      .where("status", "==", "published")
      .orderBy("publishedAt", "desc")
      .select("slug", "updatedAt", "publishedAt")
      .limit(this.CHUNK_SIZE);

    if (startAfterDoc) {
      q = q.startAfter(startAfterDoc);
    }

    const snapshot = await q.get();
    const lastDoc = snapshot.docs.length === this.CHUNK_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;

    const now = new Date().toISOString();
    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      const url = `${this.domain}/magazin/${slug}`;
      const lastModDate = data.updatedAt
        ? data.updatedAt.toDate
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
        : data.publishedAt
          ? data.publishedAt.toDate
            ? data.publishedAt.toDate().toISOString()
            : new Date(data.publishedAt).toISOString()
          : now;

      xml += "  <url>\n";
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";
    return { xml, lastDoc };
  }

  static async generateStaticSitemap(): Promise<string> {
    return CacheService.getOrSet<string>(
      "sitemapxml:static",
      async () => {
        const staticPages = [
          "",
          "/poslovi",
          "/kompanije",
          "/radnici",
          "/za-poslodavce",
          "/onama",
          "/kontakt",
        ];
        const urls = staticPages.map((p) => `${this.domain}${p}`);
        return this.buildXml(urls);
      },
      24 * 60 * 60 * 1000 // 24 sata TTL
    );
  }

  static async generateCollectionSitemap(
    coll: string,
    page: number = 1,
    startAfterDoc?: any
  ): Promise<{ xml: string, lastDoc: any }> {
    const skip = (page - 1) * this.CHUNK_SIZE;
    let q = db
      .collection(coll)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .select("category", "updatedAt", "title", "name", "createdAt")
      .limit(this.CHUNK_SIZE);

    if (startAfterDoc) {
      q = q.startAfter(startAfterDoc);
    }

    const snapshot = await q.get();
    const lastDoc = snapshot.docs.length === this.CHUNK_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;

    const pathPrefixMap: Record<string, string> = {
      jobs: "posao",
      machines: "gradjevinske-masine",
      accommodations: "smestaj",
      caterings: "ketering",
      plots: "nekretnine",
      marketplace: "marketplace",
    };

    const prefix = pathPrefixMap[coll] || coll;
    const now = new Date().toISOString();
    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const rawTitle =
        data.title || data.name || (coll === "jobs" ? "Posao" : "Oglas");
      const slug = this.generateSlug(rawTitle);
      const url = `${this.domain}/${prefix}/${slug}~${doc.id}`;
      const lastModDate = data.updatedAt
        ? data.updatedAt.toDate
          ? data.updatedAt.toDate().toISOString()
          : new Date(data.updatedAt).toISOString()
        : data.createdAt
          ? data.createdAt.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date(data.createdAt).toISOString()
          : now;

      xml += "  <url>\n";
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";
    return { xml, lastDoc };
  }

  static streamCollectionSitemapToStream(
    coll: string,
    page: number,
    writeStream: NodeJS.WritableStream,
  ): Promise<void> {
    const skip = (page - 1) * this.CHUNK_SIZE;
    const domain = this.domain;
    const now = new Date().toISOString();

    const pathPrefixMap: Record<string, string> = {
      jobs: "posao",
      machines: "gradjevinske-masine",
      accommodations: "smestaj",
      caterings: "ketering",
      plots: "nekretnine",
      marketplace: "marketplace",
    };
    const prefix = pathPrefixMap[coll] || coll;

    writeStream.write(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
    );

    const queryStream = db
      .collection(coll)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .select("category", "updatedAt")
      .offset(skip)
      .limit(this.CHUNK_SIZE)
      .stream();

    return new Promise((resolve, reject) => {
      queryStream.on("data", (docSnapshot: Record<string, unknown>) => {
        const data = docSnapshot.data();
        const rawTitle =
          data.title || data.name || (coll === "jobs" ? "Posao" : "Oglas");
        const slug = this.generateSlug(rawTitle);
        const url = `${domain}/${prefix}/${slug}~${docSnapshot.id}`;
        const lastModDate = data.updatedAt
          ? data.updatedAt.toDate
            ? data.updatedAt.toDate().toISOString()
            : new Date(data.updatedAt).toISOString()
          : data.createdAt
            ? data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString()
            : now;

        let entry = "  <url>\n";
        entry += `    <loc>${url}</loc>\n`;
        entry += `    <lastmod>${lastModDate}</lastmod>\n`;
        entry += "    <changefreq>daily</changefreq>\n";
        entry += "    <priority>0.8</priority>\n";
        entry += "  </url>\n";

        writeStream.write(entry);
      });

      queryStream.on("end", () => {
        writeStream.end("</urlset>");
      });

      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      queryStream.on("error", reject);
    });
  }

  static streamUsersSitemapToStream(
    role: string,
    writeStream: NodeJS.WritableStream,
  ): Promise<void> {
    const domain = this.domain;
    const now = new Date().toISOString();

    writeStream.write(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
    );

    const queryStream = db
      .collection("users")
      .where("role", "==", role)
      .select()
      .limit(this.CHUNK_SIZE)
      .stream();

    return new Promise((resolve, reject) => {
      queryStream.on("data", (docSnapshot: Record<string, unknown>) => {
        const url = `${domain}/profil/${docSnapshot.id}`;
        let entry = "  <url>\n";
        entry += `    <loc>${url}</loc>\n`;
        entry += `    <lastmod>${now}</lastmod>\n`;
        entry += "    <changefreq>daily</changefreq>\n";
        entry += "    <priority>0.7</priority>\n";
        entry += "  </url>\n";

        writeStream.write(entry);
      });

      queryStream.on("end", () => {
        writeStream.end("</urlset>");
      });

      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      queryStream.on("error", reject);
    });
  }

  static async generateCompaniesSitemap(page: number = 1, startAfterDoc?: any): Promise<{ xml: string, lastDoc: any }> {
    const skip = (page - 1) * this.CHUNK_SIZE;
    let q = db
      .collection("users")
      .where("role", "==", "poslodavac")
      .select()
      .limit(this.CHUNK_SIZE);

    if (startAfterDoc) {
      q = q.startAfter(startAfterDoc);
    }
    const snapshot = await q.get();
    const lastDoc = snapshot.docs.length === this.CHUNK_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;

    const urls = snapshot.docs.map((doc) => `${this.domain}/profil/${doc.id}`);
    return { xml: this.buildXml(urls), lastDoc };
  }

  static async generateMastersSitemap(page: number = 1, startAfterDoc?: any): Promise<{ xml: string, lastDoc: any }> {
    const skip = (page - 1) * this.CHUNK_SIZE;
    let q = db
      .collection("users")
      .where("role", "==", "majstor")
      .select()
      .limit(this.CHUNK_SIZE);

    if (startAfterDoc) {
      q = q.startAfter(startAfterDoc);
    }

    const snapshot = await q.get();
    const lastDoc = snapshot.docs.length === this.CHUNK_SIZE ? snapshot.docs[snapshot.docs.length - 1] : null;

    const urls = snapshot.docs.map((doc) => `${this.domain}/profil/${doc.id}`);
    return { xml: this.buildXml(urls), lastDoc };
  }

  static async generatePseoSitemap(): Promise<string> {
    return CacheService.getOrSet<string>(
      "sitemapxml:pseo",
      async () => {
        // Top taxonomy configuration for programmatic SEO
        const topCities = [
          "beograd",
          "novi-sad",
          "nis",
          "kragujevac",
          "subotica",
          "zrenjanin",
          "pancevo",
          "cacak",
          "krusevac",
          "kraljevo",
          "novi-pazar",
          "smederevo",
          "leskovac",
          "uzice",
          "valjevo",
          "sabac",
          "vranje",
        ];

        const topProfessions = [
          "zidar",
          "tesar",
          "armirac",
          "keramicar",
          "elektricar",
          "vodoinstalater",
          "moler",
          "fasader",
          "Rukovalac građevinskim mašinama",
          "pomocni-radnik",
          "inzenjer",
          "arhitekta",
          "bravar",
          "stolar",
          "gipsar",
        ];

        let urls: string[] = [];

        // Combinations for Jobs
        for (const city of topCities) {
          urls.push(`${this.domain}/poslovi/${city}`);
          for (const prof of topProfessions) {
            const cleanProf = this.generateSlug(prof);
            urls.push(`${this.domain}/poslovi/${cleanProf}/${city}`);
          }
        }

        for (const prof of topProfessions) {
          const cleanProf = this.generateSlug(prof);
          urls.push(`${this.domain}/poslovi/${cleanProf}`);
          urls.push(`${this.domain}/cene-i-statistika/${cleanProf}`);
        }

        // Combinations for Companies
        for (const city of topCities) {
          urls.push(`${this.domain}/firme/${city}`);
        }

        // Stats combinations
        for (const city of topCities) {
          for (const prof of topProfessions) {
            const cleanProf = this.generateSlug(prof);
            urls.push(`${this.domain}/cene-i-statistika/${cleanProf}/${city}`);
          }
        }

        // Build the XML
        return this.buildXml(urls);
      },
      24 * 60 * 60 * 1000 // 24 sata TTL
    );
  }

  private static generateSlug(text: string): string {
    const rsChars: { [key: string]: string } = {
      š: "s",
      đ: "dj",
      ž: "z",
      č: "c",
      ć: "c",
      Š: "s",
      Đ: "dj",
      Ž: "z",
      Č: "c",
      Ć: "c",
    };

    return text
      .toString()
      .toLowerCase()
      .replace(/[šđžčćŠĐŽČĆ]/g, (match) => rsChars[match] || match)
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");
  }

  private static buildXml(urls: string[]): string {
    const now = new Date().toISOString();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach((url) => {
      xml += "  <url>\n";
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += "    <changefreq>daily</changefreq>\n";
      xml += "    <priority>0.7</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";
    return xml;
  }

  private static cronTimeoutId: NodeJS.Timeout | null = null;
  private static cronIntervalId: NodeJS.Timeout | null = null;

  static async preWarmCachedSitemaps(): Promise<void> {
    console.log("[SitemapService] Starting sitemap pre-warming background task using Sequential Batching (startAfter)...");
    try {
      // 1. Core index
      const indexXml = await this.generateIndex();
      await CacheService.set("seo:sitemap_index", indexXml, 24 * 60 * 60 * 1000);

      // 2. Static segments
      const staticTasks = [
        { type: "static", fn: () => this.generateStaticSitemap() },
        { type: "pseo", fn: () => this.generatePseoSitemap() },
      ];

      for (const t of staticTasks) {
        try {
          const xml = await t.fn();
          if (xml) {
            await CacheService.set(`seo:sitemap_chunk_${t.type}`, xml, 24 * 60 * 60 * 1000);
          }
        } catch (e) {
          console.error(`[SitemapService] Pre-warm failed for static segment ${t.type}:`, e);
        }
      }

      // 3. Manifest-driven dynamic segments (Paginated with Sequential Batching to avoid .offset() read leak)
      const manifest = await this.getSitemapManifest();
      
      for (const [coll, countObj] of Object.entries(manifest)) {
        const count = Number(countObj) || 0;
        const pages = Math.ceil(count / this.CHUNK_SIZE) || 1;
        let lastDoc = null;
        
        for (let page = 1; page <= pages; page++) {
          try {
            let res: { xml: string, lastDoc: any };
            if (coll === "magazine") {
              res = await this.generateMagazineSitemap(page, lastDoc);
            } else if (coll === "companies") {
              res = await this.generateCompaniesSitemap(page, lastDoc);
            } else if (coll === "masters") {
              res = await this.generateMastersSitemap(page, lastDoc);
            } else {
              res = await this.generateCollectionSitemap(coll, page, lastDoc);
            }

            if (res.xml) {
              await CacheService.set(`sitemapxml:${coll}:${page}`, res.xml, 24 * 60 * 60 * 1000);
              await CacheService.set(`sitemapxml:collection:${coll}:${page}`, res.xml, 24 * 60 * 60 * 1000); // Backwards compatibility
              await CacheService.set(`seo:sitemap_chunk_${coll}-${page}`, res.xml, 24 * 60 * 60 * 1000);
            }
            lastDoc = res.lastDoc;
            if (!lastDoc) break; // No more data
          } catch (e) {
            console.error(`[SitemapService] Pre-warm sequential batch failed for dynamic segment ${coll}-${page}:`, e);
            break;
          }
        }
      }

      console.log("[SitemapService] Pre-warming sitemaps completed successfully.");
    } catch (err) {
      console.error("[SitemapService] Pre-warming sitemaps failed:", err);
    }
  }

  static init() {
    if (process.env.NODE_ENV === "test") return;

    // Izračunaj vreme do sledećih 03:00h ujutru
    const now = new Date();
    const target = new Date(now);
    target.setHours(3, 0, 0, 0);

    if (now.getHours() >= 3) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    console.log(`[SitemapService] Registrovan noćni cron posao u 03:00h ujutru. Prvo pokretanje za ${(delay / (60 * 60 * 1000)).toFixed(2)} sati.`);

    this.cronTimeoutId = setTimeout(async () => {
      await this.preWarmCachedSitemaps().catch((err) => {
        console.error("[SitemapService] Greška tokom noćnog pre-warm-a sitemape:", err);
      });

      // Nakon prvog noćnog pokretanja, ponavljaj na svakih 24h
      this.cronIntervalId = setInterval(() => {
        this.preWarmCachedSitemaps().catch((err) => {
          console.error("[SitemapService] Greška tokom periodičnog pre-warm-a sitemape:", err);
        });
      }, 24 * 60 * 60 * 1000);
    }, delay);
  }

  static async appendUrlToSitemap(coll: string, url: string, lastModDate: string = new Date().toISOString()): Promise<void> {
    try {
      const cacheKey = `sitemapxml:${coll}:1`;
      let xml = await CacheService.get<string>(cacheKey);
      if (!xml) {
        xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>';
      }

      if (xml.includes(`<loc>${url}</loc>`)) {
        return;
      }

      let entry = "  <url>\n";
      entry += `    <loc>${url}</loc>\n`;
      entry += `    <lastmod>${lastModDate}</lastmod>\n`;
      entry += "    <changefreq>daily</changefreq>\n";
      entry += "    <priority>0.8</priority>\n";
      entry += "  </url>\n";

      const index = xml.lastIndexOf("</urlset>");
      if (index !== -1) {
        xml = xml.slice(0, index) + entry + xml.slice(index);
        await CacheService.set(cacheKey, xml, 24 * 60 * 60 * 1000);
        await CacheService.set(`sitemapxml:collection:${coll}:1`, xml, 24 * 60 * 60 * 1000);
        await CacheService.set(`seo:sitemap_chunk_${coll}-1`, xml, 24 * 60 * 60 * 1000);
      }
    } catch (err) {
      console.error(`[SitemapService] Incremental sitemap append failed for ${coll}:`, err);
    }
  }

  static shutdown() {
    if (this.cronTimeoutId) {
      clearTimeout(this.cronTimeoutId);
      this.cronTimeoutId = null;
    }
    if (this.cronIntervalId) {
      clearInterval(this.cronIntervalId);
      this.cronIntervalId = null;
    }
  }
}

// Inicijalizujemo cron posao
SitemapService.init();
