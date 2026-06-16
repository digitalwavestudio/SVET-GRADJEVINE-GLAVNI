import { Logger } from "../utils/logger.ts";
import { CacheService } from "./cache.service.ts";
import crypto from "crypto";
import { TraceContext } from "../utils/trace.ts";
import { AppError } from "../utils/appError.ts";

import { UnifiedSearchUtils } from "./unified-search/unified-search-utils.service.ts";
import { UnifiedSearchAlgolia } from "./unified-search/unified-search-algolia.service.ts";
import { UnifiedSearchFirestore } from "./unified-search/unified-search-firestore.service.ts";

export interface UnifiedSearchDoc {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface UnifiedSearchFilters {
  search?: string;
  location?: string;
  locationSlug?: string;
  radius?: string | number;
  lat?: number;
  lng?: number;
  authorId?: string;
  companyId?: string;
  userId?: string;
  professionSlug?: string;
  skills?: string[];
  isVerified?: boolean;
  isUrgent?: boolean;
  minPrice?: number;
  maxPrice?: number;
  showAllStatuses?: boolean;
  [key: string]: unknown;
}

export interface UnifiedSearchResult {
  docs: UnifiedSearchDoc[];
  lastVisibleId: string | null;
  hasMore: boolean;
  totalHits?: number;
  warning?: string;
}

export class UnifiedSearchService {
  private static logger = new Logger({ service: "UnifiedSearchService" });

  // L1 Hard Cache (Shield) for homepage snippet queries
  private static l1ShieldCache = new Map<string, { data: UnifiedSearchResult; expiry: number }>();
  private static readonly L1_SHIELD_TTL = 60 * 1000; // 1 minute protection

  static analyzeQueryComplexity(filters: UnifiedSearchFilters): "SIMPLE" | "COMPLEX" {
    return UnifiedSearchUtils.analyzeQueryComplexity(filters);
  }

  static async search(
    category: string,
    filters: UnifiedSearchFilters = {},
    pageSize: number = 20,
    lastVisibleId?: string,
  ): Promise<UnifiedSearchResult> {
    const filtersAny: UnifiedSearchFilters = filters;
    // Enterprise Strategy: Avoid cache explosion & fragmentation by canonicalizing the key
    const canonicalFilters = Object.keys(filters).sort().reduce((acc: Record<string, unknown>, key) => {
      const val = filtersAny[key];
      if (val !== undefined && val !== null && val !== "") {
        if (Array.isArray(val)) {
          acc[key] = [...val].sort();
        } else if (typeof val === "object") {
           acc[key] = JSON.stringify(val); // Simplistic deep canonicalization
        } else {
          acc[key] = val;
        }
      }
      return acc;
    }, {});
    
    const cacheString = JSON.stringify({ filters: canonicalFilters, pageSize, lastVisibleId: lastVisibleId || null });
    // Use sha256 to keep key short and avoid Redis max key size issues
    const hash = crypto.createHash("sha256").update(cacheString).digest("hex");
    const cacheKey = `unified_search_${category}_${hash}`;

    // 0. L1 Process Shield (Hard RAM Cache) for homepage queries
    const now = Date.now();
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) {
      return shield.data;
    }

    // SERVER OPTIMIZATION: Cache Stampede Protection (PROMPT 8 continuation)
    // Wrap entire search execution in getOrSetSWR to leverage Redis distributed locks
    // and stop thundering herds from DDoS-ing Algolia or Firestore.
    const result = await CacheService.getOrSetSWR<UnifiedSearchResult>(
      cacheKey,
      async () => {
        const queryComplexity = this.analyzeQueryComplexity(filtersAny);
        this.logger.info(
          `[FilterProfiler] Query marked as: ${queryComplexity}`,
        );

        let entityType = category;
        if (category && category !== "all" && category !== "marketplace") {
          if (category === "machines") entityType = "machine";
          else if (category === "accommodations") entityType = "accommodation";
          else if (category === "caterings") entityType = "catering";
          else if (category === "plots") entityType = "plot";
          else if (category === "companies") entityType = "company";
          else if (category === "masters") entityType = "master";
          else if (category === "realEstate") entityType = "realEstate";
          else if (category === "jobs" || category === "job") entityType = "job";
          else if (category === "magazine" || category === "articles") entityType = "article";
        }

        // --- PAGINATION SECURITY: Deep Offset Block ---
        const MAX_PAGES = 12; // Amazon/Google pattern (10-15 pages max)
        let firestoreCursorId = lastVisibleId;
        let currentPage = 1;

        if (
          lastVisibleId &&
          typeof lastVisibleId === "string" &&
          lastVisibleId.startsWith("cursor_")
        ) {
          try {
            const decodedStr = Buffer.from(
              lastVisibleId.replace("cursor_", ""),
              "base64",
            ).toString("utf-8");
            const parsedToken = JSON.parse(decodedStr);
            firestoreCursorId = parsedToken.id;
            currentPage = parsedToken.p;
          } catch (e) {
            this.logger.warn(`Invalid cursor token attempt: ${lastVisibleId}`);
            return {
              docs: [],
              lastVisibleId: null,
              hasMore: false,
              warning: "Nevažeći paginacioni token.",
            };
          }
        } else if (lastVisibleId && !isNaN(Number(lastVisibleId))) {
          currentPage = Number(lastVisibleId);
          firestoreCursorId = lastVisibleId;
        }

        // Deep Pagination Block for crawlers / search bots to protect Firestore quotas under 50k RPS
        const isBot = TraceContext.get("isBot") === "true";
        if (isBot && currentPage >= 12) {
          this.logger.warn(`[SEO Tracker] Deep pagination blocked for bot. Page: ${currentPage}, Category: ${category}`);
          throw new AppError("Duboko listanje rezultata je onemogućeno za pretraživače kraulere. Koristite konkretne filtere.", 404);
        }

        if (currentPage >= MAX_PAGES) {
          this.logger.warn(
            `Max pagination depth reached (${currentPage}) for ${category}. Blocking deep read.`,
          );
          return {
            docs: [],
            lastVisibleId: null,
            hasMore: false,
            totalHits: 0,
            warning:
              "Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.",
          };
        }
        // ----------------------------------------------

        const algoliaResult = await UnifiedSearchAlgolia.executeAlgoliaSearch(
          category,
          entityType,
          filtersAny,
          pageSize,
          currentPage,
          this.logger,
          lastVisibleId
        );

        if (algoliaResult) {
          return algoliaResult;
        }

        if (queryComplexity === "COMPLEX") {
          try {
            const fallbackKey = `fallback_search_${category}`;
            const fallbackData = await CacheService.get<UnifiedSearchResult>(fallbackKey);
            if (fallbackData) return fallbackData;
          } catch (err) { console.error("[Search] Algolia fallback cache error:", err); }
          return { docs: [], lastVisibleId: null, hasMore: false };
        }

        if (filtersAny.search) {
          this.logger.warn(`[Search] Algolia failed or timed out. Falling back to in-memory Firestore search for: "${filtersAny.search}"`);
          return await UnifiedSearchFirestore.executeFirestoreInMemorySearch(
            category,
            entityType,
            filtersAny,
            pageSize,
            currentPage,
            this.logger
          );
        }

        return await UnifiedSearchFirestore.executeFirestoreSearch(
          category,
          entityType,
          filtersAny,
          pageSize,
          currentPage,
          firestoreCursorId,
          lastVisibleId,
          this.logger
        );
      },
      !filtersAny.search ||
        ["bager", "kamion", "posao", "smeštaj"].some((wk) =>
          filtersAny.search?.toLowerCase().includes(wk),
        )
        ? 3600000
        : 900000,
      {
        docs: [],
        lastVisibleId: null,
        hasMore: false,
        warning:
          "Sistem je trenutno pod opterećenjem. Koristimo rezervni režim rada.",
      },
    );

    if (result && (!result.docs || result.docs.length > 0)) {
       this.l1ShieldCache.set(cacheKey, { data: result, expiry: Date.now() + this.L1_SHIELD_TTL });
    }
    return result;
  }
}
