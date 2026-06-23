import { handleFirestoreError, OperationType } from '@/src/lib/errorUtils';
import { MarketplaceItem as SharedMarketplaceItem, MarketplaceFilters as SharedMarketplaceFilters, MarketplaceItemStatus } from '@svet-gradjevine/shared';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { withRetry } from '@/src/lib/retry';
import { apiClient } from '@/src/lib/apiClient';
import { safeRedirect } from '@/src/lib/urlUtils';

export interface MarketplaceItem extends SharedMarketplaceItem {
  searchKeywords?: string[];
  id?: string;
  imageStatus?: 'failed' | 'processing' | 'ready';
}

export interface MarketplaceFilters extends SharedMarketplaceFilters {
  [key: string]: string | number | boolean | null | undefined;
}

interface SearchResponse {
  docs?: MarketplaceItem[];
  lastVisibleId?: string | null;
  hasMore?: boolean;
  totalHits?: number;
}

export const marketplaceService = {
  async getItems(
    filters: MarketplaceFilters,
    pageSize: number = 12,
    lastDoc: { id: string } | string | null = null
  ) {
    const validPageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : 12;
    return withRetry(async () => {
      const data = await apiClient.post<SearchResponse>('/ads/search', {
        category: 'marketplace',
        filters,
        pageSize: validPageSize,
        lastVisibleId: lastDoc && typeof lastDoc === 'object' && 'id' in lastDoc ? lastDoc.id : lastDoc || null
      });
      let items = (data.docs || []) as MarketplaceItem[];

      // Client-side search logic if needed
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter(item => 
          item.title.toLowerCase().includes(searchLower) || 
          item.description.toLowerCase().includes(searchLower)
        );
      }

      return {
        items,
        lastVisible: data.lastVisibleId,
        hasMore: data.hasMore,
        totalHits: data.totalHits
      };
    });
  },

  async getItemById(id: string): Promise<MarketplaceItem | null> {
    try {
      const data = await apiClient.get<MarketplaceItem | { redirect?: string }>(`/ads/${id}`);
      if (data && 'redirect' in data && data.redirect && safeRedirect(data.redirect)) {
          window.location.href = data.redirect;
          return null;
      }
      return data as MarketplaceItem;
    } catch (error: unknown) {
      console.error("SDK fetch failed", error);
      let errorData: { redirect?: string } | undefined = undefined;
      if (error && typeof error === 'object') {
        const errObj = error as Record<string, unknown>;
        if (errObj.response && typeof errObj.response === 'object') {
          const resp = errObj.response as Record<string, unknown>;
          if (resp.data && typeof resp.data === 'object') {
             errorData = resp.data as { redirect?: string };
          }
        }
        if (!errorData && errObj.data && typeof errObj.data === 'object') {
           errorData = errObj.data as { redirect?: string };
        }
        if (!errorData) {
           errorData = errObj as { redirect?: string };
        }
      }
      if (errorData?.redirect && safeRedirect(errorData.redirect)) {
          window.location.href = errorData.redirect;
      }
      return null;
    }
  },

  async createItem(data: Partial<MarketplaceItem>) {
    const currentUser = (await import('firebase/auth')).getAuth().currentUser;
    if (!currentUser) throw new Error('Niste prijavljeni.');

    // 1. Provera kredita pre trošenja billing kvote
    const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
    if (!hasCredits) {
      throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
    }

    const result = await apiClient.post<{ id: string }>('/ads/create', { category: 'marketplace', data });
    
    // 2. Konzumacija kredita nakon uspešne potvrde sa servera
    await packageService.consumeCredit(currentUser.uid);

    return result.id;
  },

  async updateItem(id: string, updates: Partial<MarketplaceItem>) {
    await apiClient.patch(`/ads/${id}`, updates);
  },

  async incrementViews(id: string) {
    await viewStatsService.incrementView('listings', id);
  },

  async deleteItem(id: string) {
    await apiClient.delete(`/ads/marketplace/${id}`);
  }
};
