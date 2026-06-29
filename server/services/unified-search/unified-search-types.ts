
export interface UnifiedSearchDoc {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface UnifiedSearchFilters {
  search?: string;
  category?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  [key: string]: unknown;
}

export interface UnifiedSearchResult {
  hits: UnifiedSearchDoc[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  metadata?: Record<string, unknown>;
}
