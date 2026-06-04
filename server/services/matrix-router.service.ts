// @ts-nocheck
import { UnifiedSearchService } from "./unified-search.service.js";
import { CacheService } from "./cache.service.js";

export class MatrixRouter {
  /**
   * Evaluates if a given programmatic SEO hub route should be indexed based on content density.
   * If the hub has < 3 active items, it should return false (meaning noindex).
   * Thin Content Guard.
   *
   * @param path The request path, e.g., /poslovi/moler/kragujevac
   * @returns true if it should be indexed, false if noindex
   */
  static async evaluateHubIndexability(path: string): Promise<boolean> {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return true;

    const baseHub = parts[0];
    const hubMapping: Record<string, string> = {
      poslovi: "jobs",
      firme: "companies",
      majstori: "masters", // mapped correctly for UnifiedSearch
      masine: "machines",
      smestaj: "accommodations",
      ketering: "caterings",
      placevi: "plots",
      "alat-i-oprema": "marketplace",
    };

    const category = hubMapping[baseHub];
    if (!category) return true; // Not a hub route managed here

    // Detail pages heuristics
    const lastPart = parts[parts.length - 1];
    if (
      lastPart.length === 20 ||
      lastPart.length === 36 ||
      lastPart.includes("~")
    ) {
      return true; // Detail page, rely on its own SEO logic, not hub logic
    }

    // Identify if the route is a sub-hub that needs thin-content checking
    // e.g., /poslovi/moler/kragujevac -> 3 parts
    if (parts.length < 2) {
      // It's a root category hub like /poslovi
      // Typically these are always indexed as they aggregate everything.
      return true;
    }

    const cacheKey = `seo:thin_content_guard:${path}`;
    const cachedResult = await CacheService.get<boolean>(cacheKey);
    if (cachedResult !== null && cachedResult !== undefined) {
      return cachedResult;
    }

    const querySegments = parts
      .slice(1)
      .map((part) => part.replace(/-/g, " "));
    const queryStr = querySegments.join(" ");

    // Non-blocking background evaluation to prevent database/search-engine latency during SSR
    MatrixRouter.backgroundEvaluateHubIndexability(path, category, queryStr, cacheKey).catch(err => {
      console.error(`[MatrixRouter-Background] Error caching hub indexability:`, err);
    });

    // Fail-open: immediately allow indexing on cache miss to avoid blocking the crawler
    return true;
  }

  static async backgroundEvaluateHubIndexability(
    path: string,
    category: string,
    queryStr: string,
    cacheKey: string
  ): Promise<void> {
    try {
      const result: { hits?: unknown[]; data?: unknown[]; length?: number } | unknown[] | null = await UnifiedSearchService.search(
        category,
        { query: queryStr, skipCount: true },
        3,
      );

      const count =
        (result as { hits?: unknown[] })?.hits?.length || (result as { data?: unknown[] })?.data?.length || (Array.isArray(result) ? result.length : (result as { length?: number })?.length) || 0;

      const isIndexable = count >= 3;

      // Cache the decision for 12 hours
      await CacheService.set(cacheKey, isIndexable, 12 * 60 * 60 * 1000);

      if (!isIndexable) {
        console.log(
          `[MatrixRouter-Background] Thin Content: Cached No-indexing decision for ${path} (Count: ${count})`,
        );
      }
    } catch (err) {
      console.error(`[MatrixRouter-Background] Error caching thin content for ${path}:`, err);
    }
  }
}
