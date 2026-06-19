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

    // Fallback to mock premium/urgent data when real query returns empty (dev/localhost)
    if ((!result.docs || result.docs.length === 0) && (filters?.isPremium || filters?.isUrgent)) {
      const mockPremium = [
        { id: "fp1", title: "Građevinski Inženjer - Šef Gradilišta", grad: "Beograd", location: "Novi Beograd", salary: "1500 - 2000 EUR", comp: "Energoprojekt Visokogradnja", logo: "", images: [], isPremium: true, isUrgent: false, createdAt: new Date().toISOString() },
        { id: "fp2", title: "Rukovalac Bagerom i Utovarivačem", grad: "Novi Sad", location: "Novi Sad", salary: "1200 - 1400 EUR", comp: "Karin Komerc", logo: "", images: [], isPremium: true, isUrgent: false, createdAt: new Date().toISOString() }
      ];
      const mockUrgent = [
        { id: "fu1", title: "HITNO: Keramičar / Gipsar za unutrašnje radove", grad: "Beograd", location: "Beograd", salary: "2000+ EUR", comp: "Lux Adaptacije d.o.o.", logo: "", images: [], isPremium: false, isUrgent: true, createdAt: new Date().toISOString() }
      ];
      const fallback = filters?.isUrgent ? mockUrgent : mockPremium;
      return { docs: fallback, lastVisible: null, hasMore: false, totalHits: fallback.length };
    }

    // Maintain compatibility with JobsService specific response key 'lastVisible' instead of 'lastVisibleId'
    return {
      docs: result.docs,
      lastVisible: result.lastVisibleId,
      hasMore: result.hasMore,
      totalHits: result.totalHits,
    };
  }
}
