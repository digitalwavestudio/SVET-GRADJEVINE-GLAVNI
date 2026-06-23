import { Accommodation as SharedAccommodation } from '@/src/modules/accommodations/types/models';
import { EntityStatus } from '@/src/modules/core/types/common';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { isLaunchModeActive } from '@/src/services/platformService';
import { apiClient } from '@/src/lib/apiClient';

export type Accommodation = SharedAccommodation & {
  id?: string;
  searchKeywords?: string[];
};

class AccommodationsService {
  async fetchByAuthor(authorId: string) {
    const res = await this.fetchFiltered({ authorId, showAllStatuses: true }, 100);
    return res.items;
  }

  async fetchFiltered(filters: any, pageSize: number = 20, lastDoc: any = null) {
    const data = await apiClient.post<any>('/ads/search', {
        category: 'accommodations',
        filters,
        pageSize,
        lastVisibleId: lastDoc?.id || lastDoc || null
    });
    return {
      items: (data.docs || []) as Accommodation[],
      lastVisible: data.lastVisibleId,
      hasMore: data.hasMore,
      totalHits: data.totalHits
    };
  }

  async create(acc: Partial<Accommodation>) {
    const currentUser = (await import('firebase/auth')).getAuth().currentUser;
    if (!currentUser) throw new Error('Niste prijavljeni.');

    const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
    if (!hasCredits) {
      throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
    }

    const result = await apiClient.post<any>('/ads/create', { category: 'accommodations', data: acc });
    await packageService.consumeCredit(currentUser.uid);
    return result.id;
  }

  async update(id: string, acc: Partial<Accommodation>) {
    await apiClient.patch(`/ads/${id}`, acc);
  }

  async softDelete(id: string) {
    await apiClient.delete(`/ads/accommodations/${id}`);
  }

  async togglePremium(id: string, isPremium: boolean) {
    if (isPremium && await isLaunchModeActive()) {
      throw new Error("Plaćene funkcije su onemogućene tokom launch faze.");
    }
    return this.update(id, { isPremium } as any);
  }

  async incrementViews(id: string) {
    await viewStatsService.incrementView('listings', id);
  }

  async getById(id: string) {
    try {
      return await apiClient.get<Accommodation>(`/ads/${id}`);
    } catch (e) {
      console.error("SDK fetch failed", e);
      return null;
    }
  }
}

export const accommodationsService = new AccommodationsService();
