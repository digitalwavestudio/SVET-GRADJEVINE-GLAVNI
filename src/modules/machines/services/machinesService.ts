import { getAuth } from 'firebase/auth';
import { Machine as SharedMachine } from '@/src/modules/machines/types/models';
import { EntityStatus } from '@/src/modules/core/types/common';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { isLaunchModeActive } from '@/src/services/platformService';
import { withRetry } from '@/src/lib/retry';
import { apiClient } from '@/src/lib/apiClient';
import { safeRedirect } from '@/src/lib/urlUtils';

export interface Machine extends SharedMachine {
  searchKeywords?: string[];
  id?: string;
}

interface SearchAdsResponse {
  docs?: Machine[];
  lastVisibleId?: string | null;
  hasMore?: boolean;
}

export const machinesService = {
  async fetchFiltered(
    filters: Record<string, unknown> | null | undefined,
    pageSize: number = 20,
    lastDoc: unknown = null
  ) {
    const validPageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : 20;
    const lastVisibleId = (lastDoc && typeof lastDoc === 'object' && 'id' in lastDoc)
      ? (lastDoc as { id?: string }).id
      : (typeof lastDoc === 'string' ? lastDoc : null);

    return withRetry(async () => {
      const data = await apiClient.post<SearchAdsResponse>('/ads/search', {
        category: 'machines',
        filters,
        pageSize: validPageSize,
        lastVisibleId
      });
      return {
        items: (data.docs || []) as Machine[],
        lastVisible: data.lastVisibleId || null,
        hasMore: data.hasMore || false
      };
    });
  },

  async fetchByAuthor(authorId: string) {
    const res = await this.fetchFiltered({ authorId, showAllStatuses: true }, 100);
    return res.items;
  },

  async getById(id: string) {
    try {
      const data = await apiClient.get<Machine | { redirect?: string; }>(`/ads/${id}`);
      if (data && 'redirect' in data && data.redirect && safeRedirect(data.redirect)) {
          window.location.href = data.redirect;
          return null;
      }
      return data as Machine;
    } catch (e: unknown) {
      console.error("SDK fetch failed", e);
      let errorData: { redirect?: string } | undefined = undefined;
      if (e && typeof e === 'object') {
        const errObj = e as Record<string, unknown>;
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

  async create(data: Partial<Machine>): Promise<string> {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Niste prijavljeni.');

    const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
    if (!hasCredits) {
      throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
    }

    const result = await apiClient.post<{ id: string }>('/ads/create', { category: 'machines', data });
    await packageService.consumeCredit(currentUser.uid);

    return result.id;
  },

  async update(id: string, updates: Partial<Machine>) {
    await apiClient.patch(`/ads/${id}`, updates);
  },

  async delete(id: string) {
    await apiClient.delete(`/ads/machines/${id}`);
  },

  async togglePremium(id: string, isPremium: boolean) {
    if (isPremium && await isLaunchModeActive()) {
      throw new Error("Plaćene funkcije su onemogućene tokom launch faze.");
    }
    return this.update(id, { isPremium });
  },

  async incrementViews(id: string) {
    await viewStatsService.incrementView('listings', id);
  }
};

