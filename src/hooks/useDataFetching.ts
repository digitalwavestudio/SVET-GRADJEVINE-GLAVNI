import { useState, useCallback, useRef } from 'react';
import { handleFirestoreError, OperationType, setQuotaExceeded } from '@/src/lib/errorUtils';
import { safeSessionStorage } from '@/src/lib/safeStorage';
import { getErrorMessage } from '@/src/lib/utils';

interface FetchResult<T> {
  items: T[];
  lastVisible: any;
  hasMore: boolean;
}

/**
 * A local state hook alternative to global context fetching.
 * Use this in pages to fetch and paginate lists of data, 
 * keeping global context clean.
 */
export function useDataFetching<T, F extends any = any>(
  fetcher: (filters: F, last: any, pageSize?: number) => Promise<FetchResult<T>>,
  defaultPageSize: number = 20,
  cacheKey?: string
) {
  const [items, setItems] = useState<T[]>(() => {
    if (cacheKey) {
      const cached = safeSessionStorage.getItem(`cache:${cacheKey}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [quotaExceeded, setQuotaExceededHook] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [currentFilters, setCurrentFilters] = useState<F>(() => ({} as any as F));
  
  const lastDocRef = useRef<any>(null);

  const loadData = useCallback(async (filters: F, isLoadMore: boolean, pageSize = defaultPageSize) => {
    setLoading(true);
    setQuotaExceeded(false);
    try {
      const result = await fetcher(filters, isLoadMore ? lastDocRef.current : null, pageSize);
      if (!result) {
        setHasMore(false);
        return;
      }
      
      setHasMore(result.hasMore);
      setLastVisible(result.lastVisible);
      lastDocRef.current = result.lastVisible;
      
      setItems(prev => {
        const newItems = isLoadMore ? [...prev, ...result.items] : result.items;
        if (cacheKey && !isLoadMore) {
          safeSessionStorage.setItem(`cache:${cacheKey}`, JSON.stringify(newItems.slice(0, 50)));
        }
        return newItems;
      });
    } catch (err: unknown) {
      console.error("Data Fetch Error:", err);
      const errorMsg = getErrorMessage(err);
      if (errorMsg.includes('Quota') || errorMsg.includes('quota')) {
        setQuotaExceeded(true);
        setQuotaExceededHook(true);
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, defaultPageSize, cacheKey]);

  const applyFilters = useCallback((filters: F) => {
    setCurrentFilters(filters);
    if (!cacheKey) setItems([]);
    setLastVisible(null);
    lastDocRef.current = null;
    loadData(filters, false);
  }, [loadData, cacheKey]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !quotaExceeded) {
      loadData(currentFilters, true);
    }
  }, [loading, hasMore, loadData, currentFilters, quotaExceeded]);

  return {
    items,
    setItems,
    loading,
    hasMore,
    quotaExceeded: quotaExceeded,
    loadMore,
    applyFilters,
    currentFilters,
    refresh: () => loadData(currentFilters, false)
  };
}
