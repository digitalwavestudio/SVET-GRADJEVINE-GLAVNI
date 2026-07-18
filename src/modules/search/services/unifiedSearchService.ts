import { parseGlobalSearch, GlobalSearchIntent } from '@/src/services/aiService';
import { withRetry } from '@/src/lib/retry';
import {
  Job,
  RealEstatePlot,
  Company,
  Master
} from '@svet-gradjevine/shared';
import { algoliaSearch, AlgoliaFilters } from '../../../services/algoliaFrontendService';

export type UnifiedSearchEntity =
  | Job
  | RealEstatePlot
  | Company
  | Master;

export interface SearchResult {
  id: string;
  category: string;
  title: string;
  price?: number;
  location?: string;
  image?: string;
  imageStatus?: string;
  data: UnifiedSearchEntity;
}

const CATEGORIES = ["jobs", "companies", "masters"] as const;

export const unifiedSearchService = {
  /**
   * Performs an intelligent global search across all active categories.
   */
  async search(queryString: string, forcedCategory?: string): Promise<{ results: SearchResult[], aiIntent: GlobalSearchIntent | null }> {
    try {
      const aiIntent = await parseGlobalSearch(queryString);

      if (!aiIntent) {
        return { results: [], aiIntent: null };
      }

      // If AI recognized a category, search only that one. Otherwise search all categories.
      const categoryToSearch = forcedCategory || aiIntent.category;

      if (categoryToSearch) {
        const results = await unifiedSearchService.executeStructuredSearch(categoryToSearch, aiIntent);
        return { results, aiIntent };
      }

      // AI failed to recognize category - search all categories, merge by type priority
      const allResults: SearchResult[] = [];
      const seenIds = new Set<string>();
      for (const cat of CATEGORIES) {
        const results = await unifiedSearchService.executeStructuredSearch(cat, aiIntent);
        for (const r of results) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            allResults.push(r);
          }
        }
        if (allResults.length >= 50) break;
      }
      return { results: allResults, aiIntent };
    } catch (error) {
       console.error("Unified Search Error:", error);
       return { results: [], aiIntent: null };
    }
  },

  async executeStructuredSearch(category: string, intent: GlobalSearchIntent): Promise<SearchResult[]> {
    return withRetry(async () => {
      let entityType = category;
      if (category === 'companies') entityType = 'company';
      else if (category === 'jobs') entityType = 'job';

      const filters: AlgoliaFilters = { type: entityType };

      if (intent.locationSlug) {
        filters.locationSlug = intent.locationSlug; 
      }
      if (intent.maxPrice) {
        filters.maxPrice = intent.maxPrice;
      }
      if (intent.minPrice) {
        filters.minPrice = intent.minPrice;
      }
      
      const searchQuery = intent.keywords.join(' ');
      if (searchQuery) {
         filters.search = searchQuery;
      }

      const data = await algoliaSearch(entityType, filters, 50);

      return (data.docs || []).map((d) => {
        const item = d as unknown as UnifiedSearchEntity & {
          id?: string;
          title?: string;
          price?: number | string;
          manufacturer?: string;
          name?: string;
          locationSlug?: string;
          location?: string;
          images?: string[];
          coverImage?: string;
          photo?: string;
          imageStatus?: string;
        };
        let price: number | undefined = undefined;
        if (typeof item.price === 'number') {
          price = item.price;
        } else if (typeof item.price === 'string') {
          const parsed = parseFloat(item.price.replace(/[^\d.]/g, ''));
          if (!isNaN(parsed)) price = parsed;
        }

        return {
          id: item.id || '',
          category,
          title: item.title || item.manufacturer || item.name || 'Oglas',
          price,
          location: item.locationSlug || item.location,
          image: item.images?.[0] || item.coverImage || item.photo,
          imageStatus: item.imageStatus,
          data: item as UnifiedSearchEntity
        };
      });
    });
  }
};
