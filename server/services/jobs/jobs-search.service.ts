import { AppError } from "../../utils/appError.ts";
import { RateLimiterService } from "../rate-limiter.service.ts";

export class JobsSearchService {
  static async searchJobs(
    validatedInfo: any,
    ipStr: string,
    useAlgoliaOptions: { appId?: string; apiKey?: string } = {},
  ) {
    const { filters, lastVisibleId } = validatedInfo as { filters: any; lastVisibleId?: string; pageSize?: number; searchQuery?: string; search?: string };
    let { pageSize } = validatedInfo as { pageSize?: number };
    pageSize = pageSize || 24;

    const allowed = await RateLimiterService.isAllowed(`search:${ipStr}`, 2, 1);
    if (!allowed) {
      throw new AppError("Previše zahteva. Sačekajte trenutak.", 429);
    }

    // Delegate to UnifiedSearchService which handles Redis, Algolia and Firestore fallback
    const { UnifiedSearchService } =
      await import("../unified-search.service.ts");

    const searchFilters = {
      ...filters,
      search:
        validatedInfo.searchQuery || filters?.searchQuery || filters?.search,
    };

    const result = (await UnifiedSearchService.search(
      "job",
      searchFilters,
      pageSize,
      lastVisibleId,
    )) as { docs: any[]; lastVisibleId: string | null; hasMore: boolean; totalHits?: number };

    // Maintain compatibility with JobsService specific response key 'lastVisible' instead of 'lastVisibleId'
    return {
      docs: result.docs,
      lastVisible: result.lastVisibleId,
      hasMore: result.hasMore,
      totalHits: result.totalHits,
    };
  }
}
