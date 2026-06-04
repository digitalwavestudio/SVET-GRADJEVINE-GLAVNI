import { algoliasearch } from 'algoliasearch';
import { apiClient } from '@/src/lib/apiClient';

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

// Algolia client initialization
export const algoliaClient = (appId && apiKey) ? algoliasearch(appId, apiKey) : null;

export interface AlgoliaFilters {
  locationSlug?: string;
  location?: string;
  authorId?: string;
  userId?: string;
  companyId?: string;
  professionSlug?: string;
  skills?: string[];
  isVerified?: boolean;
  search?: string;
  beds?: number | string;
  minBeds?: number | string;
  minWeightKg?: number | string;
  maxWeightKg?: number | string;
  minArea?: number | string;
  maxArea?: number | string;
  showAllStatuses?: boolean;
  type?: string;
  invoiceAvailable?: boolean;
  parkingAvailable?: boolean;
  [key: string]: unknown;
}

export interface AlgoliaDoc extends Record<string, unknown> {
  id: string;
  objectID: string;
}

export interface AlgoliaSearchResponse {
  docs: AlgoliaDoc[];
  lastVisibleId: string | null;
  hasMore: boolean;
  totalHits?: number;
  warning?: string;
}

export const algoliaSearch = async (
  category: string, 
  filters: AlgoliaFilters, 
  pageSize: number = 20, 
  lastVisibleId?: string
): Promise<AlgoliaSearchResponse> => {
  if (!algoliaClient) {
    console.warn("Algolia Client not initialized. Check VITE_ALGOLIA_APP_ID and VITE_ALGOLIA_SEARCH_KEY.");
    // Fallback to backend unified search if Algolia isn't configured in frontend
    return fallbackBackendSearch(category, filters, pageSize, lastVisibleId);
  }

  try {
    const supportedCategories = ['all', 'listings', 'jobs', 'machines', 'accommodations', 'caterings', 'plots', 'companies', 'masters', 'realEstate', 'marketplace', 'job', 'machine', 'accommodation', 'catering', 'plot', 'company', 'master'];
    
    if (!supportedCategories.includes(category)) {
      return fallbackBackendSearch(category, filters, pageSize, lastVisibleId);
    }

    let entityType = category;
    if (category && category !== 'all' && category !== 'marketplace') {
      if (category === 'machines') entityType = 'machine';
      else if (category === 'accommodations') entityType = 'accommodation';
      else if (category === 'caterings') entityType = 'catering';
      else if (category === 'plots') entityType = 'plot';
      else if (category === 'companies') entityType = 'company';
      else if (category === 'masters') entityType = 'master';
      else if (category === 'realEstate') entityType = 'realEstate';
      else if (category === 'jobs') entityType = 'job';
    }

    const facetFilters: string[] = [];
    let algoliaIndex = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'listings';
    
    // Self-healing: if the index name looks like a 32-character hex key (mismatched Write Key), fall back to 'listings'
    if (/^[a-f0-9]{32}$/i.test(algoliaIndex)) {
      algoliaIndex = 'listings';
    }

    if (entityType === 'master' || category === 'masters') {
      algoliaIndex = 'masters';
    } else if (entityType === 'company' || category === 'companies') {
      algoliaIndex = 'companies';
    } else if (entityType && entityType !== 'all') {
      facetFilters.push(`type:${entityType}`);
    }
    
    if (filters.locationSlug) facetFilters.push(`locationSlug:${filters.locationSlug}`);
    if (filters.location && filters.location !== 'SVE') facetFilters.push(`locationSlug:${filters.location}`);
    
    if (filters.authorId) facetFilters.push(`authorId:${filters.authorId}`);
    if (filters.userId) facetFilters.push(`authorId:${filters.userId}`);
    if (filters.companyId) facetFilters.push(`companyId:${filters.companyId}`);

    // Professional search (Masters/Companies)
    if (filters.professionSlug) facetFilters.push(`professionSlug:${filters.professionSlug}`);
    if (filters.skills && Array.isArray(filters.skills)) {
        filters.skills.forEach((s: string) => facetFilters.push(`skills:${s}`));
    }
    if (filters.isVerified) facetFilters.push(`isVerified:true`);

    const MAX_PAGES = 10;
    const page = lastVisibleId && !isNaN(Number(lastVisibleId)) ? Number(lastVisibleId) : 0;
    
    if (page >= MAX_PAGES) {
      console.warn("Max search depth reached");
      return { 
        docs: [], 
        lastVisibleId: null, 
        hasMore: false,
        warning: "Dosegli ste limit listanja. Za specifičnije oglase, molimo koristite filtere i pretragu." 
      };
    }
    
    // Numeric filters for Algolia
    const numericFilters: string[] = [];
    if (filters.beds || filters.minBeds) numericFilters.push(`beds >= ${filters.beds || filters.minBeds}`);
    if (filters.minWeightKg) numericFilters.push(`weightKg >= ${filters.minWeightKg}`);
    if (filters.maxWeightKg) numericFilters.push(`weightKg <= ${filters.maxWeightKg}`);
    if (filters.minArea) numericFilters.push(`area >= ${filters.minArea}`);
    if (filters.maxArea) numericFilters.push(`area <= ${filters.maxArea}`);

    // Base filters
    let combinedFilters = 'status:active';
    if (filters.showAllStatuses) combinedFilters = ''; // Assuming we can see all if true
    
    // Additional accommodation facets
    if (filters.type && filters.type !== 'all' && entityType === 'accommodation') facetFilters.push(`typeSlug:${filters.type}`);
    if (filters.invoiceAvailable) facetFilters.push(`invoiceAvailable:true`);
    if (filters.parkingAvailable) facetFilters.push(`parkingAvailable:true`);
    
    const combinedFacetFilters = facetFilters.length > 0 ? `(${facetFilters.join(' AND ')})`  : '';
    const combinedNumericFilters = numericFilters.length > 0 ? `(${numericFilters.join(' AND ')})` : '';

    const filterParts = combinedFilters ? [combinedFilters] : [];
    if (combinedFacetFilters) filterParts.push(combinedFacetFilters);
    if (combinedNumericFilters) filterParts.push(combinedNumericFilters);

    const finalQueryFilters = filterParts.join(' AND ');

    const response = await algoliaClient.search({
      requests: [{
        indexName: algoliaIndex,
        query: filters.search || '',
        hitsPerPage: pageSize,
        page,
        filters: finalQueryFilters,
        queryType: 'prefixAll'
      }]
    });

    interface AlgoliaSearchFrontendResult {
      hits?: Array<Record<string, unknown> & { objectID?: string }>;
      page?: number;
      nbPages?: number;
      nbHits?: number;
    }
    const result = response.results[0] as unknown as AlgoliaSearchFrontendResult; // Cast from library type
    
    if (result && result.hits) {
      const docs = result.hits.map((h) => ({
        id: (h.objectID as string) || "",
        objectID: (h.objectID as string) || "",
        ...h
      })) as AlgoliaDoc[];

      const pageNum = result.page ?? 0;
      const nbPagesNum = result.nbPages ?? 0;
      const algoliaHasMore = pageNum < nbPagesNum - 1;
      const algoliaLastVisible = algoliaHasMore ? (pageNum + 1).toString() : null;

      return {
        docs,
        lastVisibleId: algoliaLastVisible,
        hasMore: algoliaHasMore,
        totalHits: result.nbHits
      };
    }

    return { docs: [], lastVisibleId: null, hasMore: false };
  } catch (error) {
    console.error('Algolia Frontend Search Error:', error);
    // Fallback to backend
    return fallbackBackendSearch(category, filters, pageSize, lastVisibleId);
  }
};

const fallbackBackendSearch = async (
  category: string, 
  filters: AlgoliaFilters, 
  pageSize: number = 20, 
  lastVisibleId?: string
): Promise<AlgoliaSearchResponse> => {
    try {
        const payload = {
            category,
            filters,
            pageSize,
            lastVisibleId
        };
        const data = await apiClient.post<AlgoliaSearchResponse>('/ads/search', payload);
        return data;
    } catch (error) {
        console.error('Unified Search Fallback Error:', error);
        return { docs: [], hasMore: false, lastVisibleId: null };
    }
};
