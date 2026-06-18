import { logger } from '@/src/lib/logger';
import { ParsedSearch } from '@/src/modules/search';
import { apiClient } from '@/src/lib/apiClient';

export interface GlobalSearchIntent {
  category?: 'jobs' | 'accommodations' | 'catering' | 'companies' | 'machines' | 'real-estate' | 'marketplace' | 'masters';
  subCategory?: string;
  locationSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords: string[];
  isUrgent?: boolean;
  intentType: 'SEARCH' | 'QUESTION';
}

/**
 * Universal Global Search Parser
 * Translates natural language into structured filters for any category.
 */
export async function parseGlobalSearch(query: string): Promise<GlobalSearchIntent | null> {
  if (!query.trim()) return null;

  try {
    const data = await apiClient.post<GlobalSearchIntent>('/ai/search-intent', { query });
    return data;
  } catch (error) {
    logger.error("Error parsing global search with API:", error);
    return { keywords: [query], intentType: 'SEARCH', category: undefined, subCategory: undefined, locationSlug: undefined, minPrice: undefined, maxPrice: undefined, isUrgent: false } as GlobalSearchIntent;
  }
}

// Keep the old one for compatibility if needed, or redirect it
export async function parseSearchQuery(query: string): Promise<ParsedSearch | null> {
  const parsed = await parseGlobalSearch(query);
  if (!parsed) return null;
  return {
    searchQuery: parsed.keywords.join(' '),
    location: parsed.locationSlug || '',
    sector: parsed.subCategory || '',
    benefits: [],
    isUrgent: parsed.isUrgent || false
  };
}
