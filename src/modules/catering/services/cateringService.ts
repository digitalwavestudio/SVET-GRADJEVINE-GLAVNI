import { getAuth } from 'firebase/auth';
import { CateringOffer as SharedCateringOffer } from '@svet-gradjevine/shared';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { isLaunchModeActive } from '@/src/services/platformService';
import { withRetry } from '@/src/lib/retry';
import { apiClient } from '@/src/lib/apiClient';

export interface CateringOffer extends SharedCateringOffer {
  searchKeywords?: string[];
  id?: string;
  imageStatus?: 'processing' | 'ready' | 'error';
  phone?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  email?: string;
  authorName?: string;
  imagePlaceholders?: Record<string, string>;
  status?: string;
}

export interface CateringFilters {
  location?: string | null;
  radius?: number;
  kitchenType?: string | null;
  minOrder?: number | null;
  invoiceAvailable?: boolean;
  dailyCapacity?: number | null;
  search?: string;
  authorId?: string;
  showAllStatuses?: boolean;
  status?: string;
  [key: string]: string | number | boolean | null | undefined;
}

interface SearchResponse {
  docs?: CateringOffer[];
  lastVisibleId?: string | null;
  hasMore?: boolean;
  totalHits?: number;
}

export const cateringService = {
  async fetchFiltered(
    filters: CateringFilters,
    pageSize: number = 20,
    lastDoc: { id: string } | string | null = null
  ) {
    const validPageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : 20;
    return withRetry(async () => {
      const data = await apiClient.post<SearchResponse>('/ads/search', {
        category: 'caterings',
        filters,
        pageSize: validPageSize,
        lastVisibleId: lastDoc && typeof lastDoc === 'object' && 'id' in lastDoc ? lastDoc.id : lastDoc || null
      });
      return {
        items: (data.docs || []) as CateringOffer[],
        lastVisible: data.lastVisibleId || null,
        hasMore: data.hasMore || false,
        totalHits: data.totalHits
      };
    });
  },

  async fetchByAuthor(authorId: string): Promise<CateringOffer[]> {
    const res = await this.fetchFiltered({ authorId, showAllStatuses: true }, 100);
    return res.items;
  },

  async getById(id: string): Promise<CateringOffer | null> {
    try {
      return await apiClient.get<CateringOffer>(`/ads/${id}`);
    } catch (error: unknown) {
      console.error("SDK fetch failed", error);
      return null;
    }
  },

  async create(data: Partial<CateringOffer>): Promise<string> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Niste prijavljeni.');

    const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
    if (!hasCredits) {
      throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
    }

    const result = await apiClient.post<{ id: string }>('/ads/create', { category: 'caterings', data });
    await packageService.consumeCredit(currentUser.uid);

    return result.id;
  },

  async update(id: string, updates: Partial<CateringOffer>): Promise<void> {
    await apiClient.patch(`/ads/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/ads/caterings/${id}`);
  },

  async togglePremium(id: string, isPremium: boolean): Promise<void> {
    if (isPremium && await isLaunchModeActive()) {
      throw new Error("Plaćene funkcije su onemogućene tokom launch faze.");
    }
    return this.update(id, { isPremium });
  },

  async incrementViews(id: string): Promise<void> {
    await viewStatsService.incrementView('listings', id);
  }
};
