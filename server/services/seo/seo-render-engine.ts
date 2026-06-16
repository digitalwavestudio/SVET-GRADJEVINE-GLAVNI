import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Request, Response } from "express";

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

    const possiblePaths = process.env.NODE_ENV === "development"
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
  static generateDerivedTags(reqPath: string, host: string, paginationTags: string = ""): string {
    const isDetail = reqPath.includes("~");

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

      const derivedTitle = `${titleWord} | Svet GraÄ‘evine`;
      const derivedDesc = `Pogledajte detalje za ${titleWord} na portalu Svet GraÄ‘evine - najveÄ‡em graÄ‘evinskom portalu na Balkanu.`;
      const derivedUrl = `https://${host}${reqPath}`;
      const defaultImage = "https://svetgradjevine.com/og-default.jpg";

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
      const derivedTitle = `Svet GraÄ‘evine | GraÄ‘evinski Portal`;
      const derivedDesc = `NajveÄ‡i graÄ‘evinski portal na Balkanu za poslove, majstore, maÅ¡ine i nekretnine.`;
      const derivedUrl = `https://${host}${reqPath}`;

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
    const canonicalBaseUrl = `https://${host}${pathWithoutQuery}`;
    
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

    // Replace <!-- SSR_META --> trigger block
    let renderedHtml = baseHtml.replace("<!-- SSR_META -->", finalMetaTagsStr);
    
    // Zap some default client-side static title that may interfere with crawler bots
    renderedHtml = renderedHtml.replace(/<title>.*?<\/title>/, "");

    // Inject bot skeletal HTML to prevent blank crawlers render
    if (meta && meta.botHtml) {
      renderedHtml = renderedHtml.replace(
        '<div id="root"></div>',
        `<div id="root">${meta.botHtml}</div>`
      );
    }

    return renderedHtml;
  }
}

