import { parseGlobalSearch, GlobalSearchIntent } from '@/src/services/aiService';
import { withRetry } from '@/src/lib/retry';
import { 
  Job, 
  CateringOffer, 
  RealEstatePlot, 
  Machine, 
  Accommodation, 
  Company, 
  Master, 
  MarketplaceItem 
} from '@svet-gradjevine/shared';
import { algoliaSearch, AlgoliaFilters } from '../../../services/algoliaFrontendService';

export type UnifiedSearchEntity = 
  | Job 
  | CateringOffer 
  | RealEstatePlot 
  | Machine 
  | Accommodation 
  | Company 
  | Master 
  | MarketplaceItem;

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

      // If category is recognized, search specifically in that collection
      // Otherwise, we could search across all, but let's prioritize the recognized one or marketplace
      const categoryToSearch = forcedCategory || aiIntent.category || 'marketplace';
      const results = await unifiedSearchService.executeStructuredSearch(categoryToSearch, aiIntent);

      return { results, aiIntent };
    } catch (error) {
       console.error("Unified Search Error:", error);
       return { results: [], aiIntent: null };
    }
  },

  async executeStructuredSearch(category: string, intent: GlobalSearchIntent): Promise<SearchResult[]> {
    return withRetry(async () => {
      let entityType = category;
      if (category === 'machines') entityType = 'machine';
      else if (category === 'accommodations') entityType = 'accommodation';
      else if (category === 'caterings') entityType = 'catering';
      else if (category === 'plots') entityType = 'plot';
      else if (category === 'companies') entityType = 'company';
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
