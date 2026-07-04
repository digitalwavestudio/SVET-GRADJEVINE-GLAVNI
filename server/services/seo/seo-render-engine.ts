import { env } from "../../config/env.ts";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Request, Response } from "express";
import { APP_CONFIG } from "../../../src/constants/config.ts";

export interface SEOMetaData {
  title: string;
  description: string;
  image: string;
  url: string;
  updatedAt?: number;
  viewsCount?: number;
  structuredData?: Record<string, unknown>;
  botHtml?: string;
  initialState?: Record<string, unknown>;
  isDead?: boolean;
  hasTraffic?: boolean;
  collectionName?: string;
}

export class SEORenderEngine {
  private static cachedIndexHtml: string | null = null;

  /**
   * Lazily loads and caches the base template index.html
   */
  static async getBaseTemplate(): Promise<string> {
    if (this.cachedIndexHtml) {
      return this.cachedIndexHtml;
    }

    const possiblePaths = env.NODE_ENV === "development"
      ? [
          path.join(process.cwd(), "index.html"),
          path.join(process.cwd(), "dist", "index.html"),
        ]
      : [
          path.join(process.cwd(), "dist", "index.html"),
          path.join(process.cwd(), "index.html"),
        ];

    for (const p of possiblePaths) {
      try {
        const html = await fs.readFile(p, "utf-8");
        this.cachedIndexHtml = html;
        return html;
      } catch (err) {
        // Continue to the next path
      }
    }

    throw new Error("[SEORenderEngine] Failed to locate base index.html template.");
  }

  /**
   * Clears the template cache, useful for hot-reloads or deployment triggers
   */
  static clearTemplateCache(): void {
    this.cachedIndexHtml = null;
  }

  /**
   * Generates link rel="prev" and rel="next" pagination tags based on indexability depth rules
   */
  static generatePaginationTags(canonicalBaseUrl: string, pageNum: number): string {
    let paginationTags = "";

    if (pageNum > 1) {
      paginationTags += `<link rel="prev" href="${canonicalBaseUrl}${pageNum === 2 ? "" : `?page=${pageNum - 1}`}" />\n        `;
    }

    // Capture standard depth layout check. Protect against infinite crawl traps.
    if (pageNum < 100) {
      paginationTags += `<link rel="next" href="${canonicalBaseUrl}?page=${pageNum + 1}" />\n        `;
    }

    return paginationTags.trim();
  }

  /**
   * Compiles ETag based on entity state to let bots leverage 304 HTTP caching
   */
  static evaluateETag(req: Request, res: Response, updatedAt?: number, viewsCount?: number): { matched: boolean; etag: string | null } {
    if (!updatedAt) {
      return { matched: false, etag: null };
    }

    const eTagHash = crypto
      .createHash("md5")
      .update(`${updatedAt}_${viewsCount || 0}`)
      .digest("hex");
    const etag = `W/"${eTagHash}"`;

    res.setHeader("ETag", etag);

    if (req.get("if-none-match") === etag) {
      return { matched: true, etag };
    }

    return { matched: false, etag };
  }

  /**
   * Evaluates and produces derived meta tags when metadata is not yet compiled in SEO background loop (Cold Cache)
   */
  private static readonly POPULAR_CITIES = [
    "beograd", "novi-sad", "nis", "kragujevac", "subotica",
    "zrenjanin", "pancevo", "cacak", "novi-pazar", "sabac",
    "valjevo", "leskovac", "kraljevo", "smederevo", "vranje",
  ];

  private static readonly HUB_CATEGORIES: Record<string, { label: string; slug: string }[]> = {
    poslovi: [
      { label: "Svi poslovi", slug: "poslovi" },
    ],
    majstori: [
      { label: "Svi majstori", slug: "majstori" },
    ],
    "gradjevinske-masine": [
      { label: "Sve mašine", slug: "gradjevinske-masine" },
    ],
    masine: [
      { label: "Sve mašine", slug: "masine" },
    ],
    smestaj: [
      { label: "Sav smeštaj", slug: "smestaj" },
    ],
    ketering: [
      { label: "Sav ketering", slug: "ketering" },
    ],
    placevi: [
      { label: "Svi placevi", slug: "placevi" },
    ],
    "alat-i-oprema": [
      { label: "Sva oprema", slug: "alat-i-oprema" },
    ],
    firme: [
      { label: "Sve firme", slug: "firme" },
    ],
    "cene-i-statistika": [
      { label: "Cene i statistika", slug: "cene-i-statistika" },
    ],
  };

  /**
   * Generates HTML cross-link section with popular cities and related categories
   * so every hub page has many incoming and outgoing internal links.
   */
  static generateHubCrossLinks(reqPath: string): string {
    const segments = reqPath.split("/").filter(Boolean);
    if (segments.length === 0) return "";

    const mainCategory = segments[0];
    const lastSegment = segments[segments.length - 1];
    const isCity = this.POPULAR_CITIES.includes(lastSegment);
    const isHub = !reqPath.includes("~") && (this.HUB_CATEGORIES[mainCategory] || Object.keys(this.HUB_CATEGORIES).includes(mainCategory));

    if (!isHub) return "";

    let html = "";

    // Other cities for same category
    if (isCity) {
      html += '<div style="margin:1rem;padding:1rem;background:#f5f5f5;border-radius:8px;font-size:14px">';
      html += "<strong>Ostali gradovi:</strong> ";
      const cityLinks = this.POPULAR_CITIES
        .filter(c => c !== lastSegment)
        .map(c => {
          const label = c.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase());
          return `<a href="/${segments.slice(0, -1).join("/")}/${c}" style="margin:0 4px">${label}</a>`;
        });
      html += cityLinks.join(" · ");
      html += "</div>";
    }

    // Related categories for same city
    const citySegment = isCity ? lastSegment : segments[1];
    if (citySegment && this.POPULAR_CITIES.includes(citySegment)) {
      html += '<div style="margin:1rem;padding:1rem;background:#f5f5f5;border-radius:8px;font-size:14px">';
      html += "<strong>Povezane kategorije:</strong> ";
      const related = Object.entries(this.HUB_CATEGORIES)
        .filter(([key]) => key !== mainCategory)
        .map(([_, cats]) => cats[0])
        .filter(c => c.slug)
        .map(c => `<a href="/${c.slug}/${citySegment}" style="margin:0 4px">${c.label} u ${citySegment.replace(/-/g, " ").replace(/\b\w/g, x => x.toUpperCase())}</a>`);
      html += related.join(" · ");
      html += "</div>";
    }

    return html;
  }

  /**
   * Generates HTML breadcrumb <nav> with real <a> links for internal linking.
   * Crawlers follow these links → orphan pages become linked.
   */
  static generateBreadcrumbNav(reqPath: string): string {
    const segments = reqPath.split("/").filter(Boolean);
    if (segments.length === 0) return "";
    const hubLabels: Record<string, string> = {
      poslovi: "Poslovi",
      "gradjevinske-masine": "Građevinske mašine",
      masine: "Građevinske mašine",
      smestaj: "Smeštaj",
      ketering: "Ketering",
      placevi: "Građevinsko zemljište",
      "alat-i-oprema": "Alat i oprema",
      firme: "Firme",
      majstori: "Majstori",
      "cene-i-statistika": "Cene i statistika",
    };
    const label = (s: string) => hubLabels[s] || s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    let trail = `<a href="/">Početna</a> / `;
    for (let i = 0; i < segments.length; i++) {
      const parentPath = "/" + segments.slice(0, i + 1).join("/");
      if (i < segments.length - 1) {
        trail += `<a href="${parentPath}">${label(segments[i])}</a> / `;
      } else {
        trail += `<span>${label(segments[i])}</span>`;
      }
    }
    return `<nav aria-label="Breadcrumb" style="padding:1rem;font-size:14px;color:#666">${trail}</nav>`;
  }

  static generateDerivedTags(reqPath: string, host: string, paginationTags: string = ""): string {
    const isDetail = reqPath.includes("~");
    const canonicalBase = APP_CONFIG.BASE_URL.replace(/\/$/, "");

    if (isDetail) {
      const segments = reqPath.split("/").filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      let slugPart = lastSegment;
      
      if (lastSegment.includes("~")) {
        slugPart = lastSegment.split("~")[0];
      }

      const titleWord = slugPart
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      const derivedTitle = `${titleWord} | Svet Građevine`;
      const derivedDesc = `Pogledajte detalje za ${titleWord} na portalu Svet Građevine - najvećem građevinskom portalu na Balkanu.`;
      const derivedUrl = `${canonicalBase}${reqPath}`;
      const defaultImage = "https://www.svetgradjevine.com/og-image.png";

      return `
        <title>${derivedTitle}</title>
        <meta name="description" content="${derivedDesc}" />
        <meta property="og:title" content="${derivedTitle}" />
        <meta property="og:description" content="${derivedDesc}" />
        <meta property="og:image" content="${defaultImage}" />
        <link rel="canonical" href="${derivedUrl}" />
        <meta name="robots" content="index, follow" />
        ${paginationTags}
      `.trim();
    } else {
      // Generate specific title/description for known listing hub paths
      const isGeoPage = reqPath.split("/").filter(Boolean).length > 1;
      const pathPart = reqPath.split("/").filter(Boolean)[0] || "";
      const lastPart = reqPath.split("/").filter(Boolean).pop() || "";

      const hubLabels: Record<string, string> = {
        poslovi: "Oglasi za posao u građevini",
        "gradjevinske-masine": "Građevinske mašine",
        masine: "Građevinske mašine",
        smestaj: "Smeštaj za radnike",
        ketering: "Ketering i ugostiteljstvo",
        placevi: "Građevinsko zemljište",
        "alat-i-oprema": "Alat i građevinska oprema",
        firme: "Građevinske kompanije",
        majstori: "Majstori u građevini",
      };

      let derivedTitle: string;
      let derivedDesc: string;

      if (isGeoPage && hubLabels[pathPart]) {
        const readableLocation = lastPart.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        derivedTitle = `${hubLabels[pathPart]} u ${readableLocation} | Svet Građevine`;
        derivedDesc = `Pregledajte ${hubLabels[pathPart].toLowerCase()} u ${readableLocation}. Pronađite najbolje ponude na Svet Građevine - vodećem građevinskom portalu.`;
      } else if (hubLabels[pathPart]) {
        derivedTitle = `${hubLabels[pathPart]} | Svet Građevine`;
        derivedDesc = `${hubLabels[pathPart]} na Svet Građevine - vodećem građevinskom portalu na Balkanu. Pregledajte sve oglase i pronađite najbolje ponude.`;
      } else {
        derivedTitle = `Svet Građevine`;
        derivedDesc = `Oglasi u građevinskoj industriji`;
      }

      const derivedUrl = `${canonicalBase}${reqPath}`;

      return `
        <title>${derivedTitle}</title>
        <meta name="description" content="${derivedDesc}" />
        <link rel="canonical" href="${derivedUrl}" />
        ${paginationTags}
      `.trim();
    }
  }

  /**
   * Dynamic HTML assembler that injects title, description, keywords, structured schema data, initially pre-warmed state controls
   */
  static async assembleHtml(options: {
    reqPath: string;
    host: string;
    meta: SEOMetaData | null;
    pageNum?: number;
    paginationTags?: string;
    indexable?: boolean;
    isBotPayload?: boolean;
  }): Promise<string> {
    const { reqPath, host, meta, pageNum = 1, isBotPayload = false } = options;
    const baseHtml = await this.getBaseTemplate();

    const pathWithoutQuery = reqPath.split("?")[0].replace(/\/$/, "") || "/";
    const canonicalBaseUrl = `${APP_CONFIG.BASE_URL.replace(/\/$/, "")}${pathWithoutQuery}`;
    
    const paginationTags = options.paginationTags !== undefined 
      ? options.paginationTags 
      : this.generatePaginationTags(canonicalBaseUrl, pageNum);

    // Build the final SEO tagging chunk
    let finalMetaTagsStr = "";

    if (meta) {
      // Direct compiled metadata inject
      finalMetaTagsStr = `
        <title>${meta.title}</title>
        <meta name="description" content="${meta.description}" />
        <meta property="og:title" content="${meta.title}" />
        <meta property="og:description" content="${meta.description}" />
        <meta property="og:image" content="${meta.image}" />
        <link rel="canonical" href="${meta.url}" />
        ${paginationTags}
        ${meta.initialState ? `<script>window.INITIAL_STATE = ${JSON.stringify(meta.initialState)};</script>` : ""}
        ${meta.structuredData ? `<script type="application/ld+json">${JSON.stringify(meta.structuredData)}</script>` : ""}
      `.trim();
    } else {
      // Cold cache / Fallback / Hub indexing skeleton injection
      let indexTag = "";
      if (options.indexable === false) {
        indexTag = '<meta name="robots" content="noindex, follow" />';
      }

      finalMetaTagsStr = indexTag + "\n" + this.generateDerivedTags(pathWithoutQuery, host, paginationTags);
    }

    // Strip original title/meta from base template before injecting SEO tags
    let renderedHtml = baseHtml
      .replace(/<title>.*?<\/title>/i, "")
      .replace(/<meta\s+name=["']description["'][^>]*\/?>/gi, "");
    
    // Inject SEO tags before </head>
    renderedHtml = renderedHtml.replace("</head>", `${finalMetaTagsStr}\n</head>`);

    // Inject breadcrumb navigation links — OUTSIDE <div id="root"> so React hydration doesn't break
    const breadcrumbNav = this.generateBreadcrumbNav(pathWithoutQuery);
    const crossLinks = this.generateHubCrossLinks(pathWithoutQuery);
    const navHtml = `${breadcrumbNav}${crossLinks}`;
    if (meta?.botHtml) {
      // Detail pages: botHtml goes INSIDE root (SSR React content)
      renderedHtml = renderedHtml.replace(
        '<div id="root"></div>',
        `<div id="root">${meta.botHtml}</div>${navHtml}`
      );
    } else {
      // Hub pages: no SSR content, breadcrumbs go after empty root (visible to crawlers, ignored by React)
      renderedHtml = renderedHtml.replace(
        '<div id="root"></div>',
        `<div id="root"></div>${navHtml}`
      );
    }

    return renderedHtml;
  }
}

