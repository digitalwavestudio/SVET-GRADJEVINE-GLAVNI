import { useState, useCallback, useRef } from 'react';
import { algoliaSearch, AlgoliaFilters, AlgoliaDoc } from '../services/algoliaFrontendService';

interface PaginatedOptions<T> {
  collectionName: string;
  pageSize?: number;
  initialConstraints?: unknown[];
  filters? : AlgoliaFilters;
  onData?: (data: T[]) => T[];
}

export function usePaginatedList<T>({ 
  collectionName, 
  pageSize = 12, 
  initialConstraints = [],
  filters: initialFilters = {},
  onData 
}: PaginatedOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<string | null>(null);

  const fetchItems = useCallback(async (isLoadMore: boolean = false, extraFilters: AlgoliaFilters = {}) => {
    if (!isLoadMore) {
      setLoading(true);
      lastDocRef.current = null;
    } else if (loading || !hasMore) {
      return;
    }

    try {
      let category = collectionName;
      if (collectionName === 'listings') category = 'all';
      if (collectionName === 'jobs') category = 'job';
      if (collectionName === 'machines') category = 'machine';
      if (collectionName === 'accommodations') category = 'accommodation';
      if (collectionName === 'caterings') category = 'catering';
      if (collectionName === 'plots') category = 'plot';

      // Merge initial filters with runtime filters
      const filters: AlgoliaFilters = { 
        ...initialFilters, 
        ...extraFilters
      };

      const data = await algoliaSearch(category, filters, pageSize, isLoadMore ? (lastDocRef.current || undefined) : undefined);
      
      const rawDocs = data.docs || [];
      const usedLastVisibleId = data.lastVisibleId;
      const usedHasMore = data.hasMore;

      const newDocs = rawDocs as unknown as T[];
      const processedDocs = onData ? onData(newDocs) : newDocs;

      setItems(prev => isLoadMore ? [...prev, ...processedDocs] : processedDocs);
      lastDocRef.current = usedLastVisibleId;
      setHasMore(usedHasMore);
    } catch (error) {
      console.error('Paginated fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [collectionName, pageSize, initialFilters, onData, loading, hasMore]);

  const reset = useCallback(() => {
    setItems([]);
    lastDocRef.current = null;
    setHasMore(true);
  }, []);

  return {
    items,
    loading,
    hasMore,
    fetchItems,
    reset
  };
}
