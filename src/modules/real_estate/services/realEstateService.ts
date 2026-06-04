import { getAuth } from 'firebase/auth';
import { EntityStatus } from '@/src/modules/core/types/common';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { isLaunchModeActive } from '@/src/services/platformService';
import { withRetry } from '@/src/lib/retry';
import { apiClient } from '@/src/lib/apiClient';

export * from '@/src/modules/real_estate/types/models';
import { RealEstatePlot, RealEstateFilters } from '@/src/modules/real_estate/types/models';

export const realEstateService = {
  async fetchFiltered(
    filters: RealEstateFilters,
    pageSize: number = 20,
    lastDoc: { id: string } | string | null = null
  ): Promise<{
    items: RealEstatePlot[];
    lastVisible: string | null;
    hasMore: boolean;
    totalHits?: number;
  }> {
    const validPageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : 20;
    return withRetry(async () => {
      const { algoliaSearch } = await import('@/src/services/algoliaFrontendService');
      const data = await algoliaSearch(
        'plots', 
        filters as unknown as import('@/src/services/algoliaFrontendService').AlgoliaFilters, 
        validPageSize, 
        lastDoc && typeof lastDoc === 'object' && 'id' in lastDoc ? (lastDoc as { id: string }).id : (lastDoc as string | undefined)
      );
      return {
        items: (data.docs || []) as unknown as RealEstatePlot[],
        lastVisible: data.lastVisibleId || null,
        hasMore: data.hasMore || false,
        totalHits: data.totalHits
      };
    });
  },

  async fetchByAuthor(authorId: string): Promise<RealEstatePlot[]> {
    const res = await this.fetchFiltered({ authorId, showAllStatuses: true }, 100);
    return res.items;
  },

  async getById(id: string): Promise<RealEstatePlot | null> {
    try {
      return await apiClient.get<RealEstatePlot>(`/ads/${id}`);
    } catch (error: unknown) {
      console.error("SDK fetch failed", error);
      return null;
    }
  },

  async create(data: Partial<RealEstatePlot>): Promise<string> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Niste prijavljeni.');

    const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
    if (!hasCredits) {
      throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
    }

    const result = await apiClient.post<{ id: string }>('/ads/create', { category: 'plots', data });
    await packageService.consumeCredit(currentUser.uid);

    return result.id;
  },

  async update(id: string, updates: Partial<RealEstatePlot>): Promise<void> {
    await apiClient.patch(`/ads/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/ads/plots/${id}`);
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

