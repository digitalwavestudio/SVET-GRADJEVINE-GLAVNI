import { searchAdsIndex, AlgoliaHit } from "../algolia.service.ts";
import { env } from "../../config/env.ts";
import { resolveGeoFallback } from "../../utils/geocode.ts";
import { ImageTransformer } from "../../utils/image.transformer.ts";
import { UnifiedSearchUtils } from "./unified-search-utils.service.ts";
import { CacheService } from "../cache.service.ts";
import { Logger } from "../../utils/logger.ts";
import { 
  UnifiedSearchResult, 
  UnifiedSearchFilters,
  UnifiedSearchDoc 
} from "../unified-search.service.ts";

export class UnifiedSearchAlgolia {
  static async executeAlgoliaSearch(
    category: string,
    entityType: string,
    filters: UnifiedSearchFilters,
    pageSize: number,
    currentPage: number,
    logger: Logger,
    lastVisibleId?: string
  ): Promise<UnifiedSearchResult | null> {
    if (!(env.ALGOLIA_APP_ID && env.ALGOLIA_API_KEY && process.env.USE_ALGOLIA !== "false")) {
      return null;
    }

    try {
      const facetFilters: string[] = [];
      let algoliaIndex = env.ALGOLIA_INDEX_NAME || "listings";

      if (entityType === "master" || category === "masters") {
        algoliaIndex = "masters";
      } else if (entityType === "company" || category === "companies") {
        algoliaIndex = "companies";
      } else if (entityType === "article" || category === "magazine" || category === "articles") {
        algoliaIndex = "articles";
      } else if (entityType && entityType !== "all") {
        facetFilters.push(`type:${entityType}`);
      }

      if (filters.locationSlug && !filters.radius)
        facetFilters.push(`locationSlug:${filters.locationSlug}`);
      if (
        filters.location &&
        filters.location !== "SVE" &&
        !filters.radius
      )
        facetFilters.push(`locationSlug:${filters.location}`);

      if (filters.authorId)
        facetFilters.push(`authorId:${filters.authorId}`);
      if (filters.userId) facetFilters.push(`authorId:${filters.userId}`);
      if (filters.companyId)
        facetFilters.push(`companyId:${filters.companyId}`);

      if (filters.professionSlug)
        facetFilters.push(`professionSlug:${filters.professionSlug}`);
      if (filters.skills && Array.isArray(filters.skills)) {
        filters.skills.forEach((s: string) =>
          facetFilters.push(`skills:${s}`)
        );
      }
      if (filters.isVerified) facetFilters.push(`isVerified:true`);
      if (filters.isUrgent) facetFilters.push(`isUrgent:true`);
      if (filters.isPremium) facetFilters.push(`isPremium:true`);

      const extraParams: Record<string, unknown> = {
        typoTolerance: "min",
        ignorePlurals: true,
      };
      let lat = filters.lat;
      let lng = filters.lng;

      if (!lat && !lng && filters.locationSlug) {
        const resGeo = resolveGeoFallback(filters.locationSlug);
        if (resGeo) {
          lat = resGeo.lat;
          lng = resGeo.lng;
        }
      } else if (!lat && !lng && filters.location && filters.location !== "SVE") {
        const resGeo = resolveGeoFallback(filters.location as string);
        if (resGeo) {
          lat = resGeo.lat;
          lng = resGeo.lng;
        }
      }

      if (lat && lng) {
        extraParams.aroundLatLng = `${lat},${lng}`;
        extraParams.aroundRadius = (Number(filters.radius) || 50) * 1000;
      }

      const numericFilters: string[] = [];
      if (filters.beds || filters.minBeds) {
        const bedsVal = filters.beds || filters.minBeds;
        if (bedsVal) numericFilters.push(`beds >= ${bedsVal}`);
      }
      if (filters.minWeightKg)
        numericFilters.push(`weightKg >= ${filters.minWeightKg}`);
      if (filters.maxWeightKg)
        numericFilters.push(`weightKg <= ${filters.maxWeightKg}`);
      if (filters.minArea)
        numericFilters.push(`area >= ${filters.minArea}`);
      if (filters.maxArea)
        numericFilters.push(`area <= ${filters.maxArea}`);

      if (
        filters.type &&
        filters.type !== "all" &&
        entityType === "accommodation"
      )
        facetFilters.push(`typeSlug:${filters.type}`);
      if (filters.invoiceAvailable)
        facetFilters.push(`invoiceAvailable:true`);
      if (filters.parkingAvailable)
        facetFilters.push(`parkingAvailable:true`);

      const searchResult = await searchAdsIndex(
        algoliaIndex,
        filters.search || "",
        currentPage,
        facetFilters,
        pageSize,
        numericFilters,
        extraParams,
      );
      
      if (searchResult) {
        const hits = searchResult.hits || [];
        if (hits.length > 0) {
          const isMagazineResult = algoliaIndex === "articles" || algoliaIndex === "magazine_index";
          let docs: UnifiedSearchDoc[] = hits.map((h: AlgoliaHit) =>
            isMagazineResult 
              ? UnifiedSearchUtils.mapToArticle(h as unknown as Record<string, unknown>)
              : UnifiedSearchUtils.mapToListing(
                  ImageTransformer.transformDocumentImages({
                    id: h.objectID,
                    ...h,
                  }) as Record<string, unknown>
                )
          );

          if (!filters.showAllStatuses)
            docs = docs.filter((d: UnifiedSearchDoc) => d.status === "active" || d.status === "published");

          const algoliaHasMore = searchResult.page < searchResult.nbPages - 1;
          const algoliaLastVisible = algoliaHasMore
            ? (searchResult.page + 1).toString()
            : null;

          const response: UnifiedSearchResult = {
            docs,
            lastVisibleId: algoliaLastVisible,
            hasMore: algoliaHasMore,
            totalHits: searchResult.nbHits || 0,
          };

          if (!lastVisibleId && !filters.search) {
            await CacheService.set(
              `fallback_search_${category}`,
              response,
              86400000,
            );
          }

          return response;
        } else {
          return { docs: [], lastVisibleId: null, hasMore: false };
        }
      }
      return null;
    } catch (e: unknown) {
      logger.error("Algolia search failed", e);
      try {
        const fallbackKey = `fallback_search_${category}`;
        const fallbackData = await CacheService.get<UnifiedSearchResult>(fallbackKey);
        if (fallbackData) return fallbackData;
      } catch (err) { console.error("[Algolia] Fallback cache error:", err); }
      
      return null;
    }
  }
}
