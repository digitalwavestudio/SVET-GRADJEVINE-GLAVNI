import { handleFirestoreError, OperationType } from '@/src/lib/errorUtils';
import { withRetry } from '@/src/lib/retry';
import { isLaunchModeActive } from '@/src/services/platformService';
import { EntityStatus, BaseEntity } from '@/src/modules/core/types/common';
import { Company as SharedCompany } from '@/src/modules/companies/types/models';
import { viewStatsService } from '@/src/services/viewStatsService';
import { algoliaSearch } from '@/src/services/algoliaFrontendService';
import { apiClient } from '@/src/lib/apiClient';

export interface Company extends SharedCompany {
  searchKeywords?: string[];
  isPremiumProfile?: boolean;
}

const normalizeCompany = (c: any): Company => {
  if (!c) return c;
  return {
    ...c,
    name: c.comp || c.name || 'Nedefinisana Firma',
    description: c.companyDescription || c.description || '',
    portfolioImages: c.companyPortfolioImages || c.portfolioImages || [],
    pib: c.companyPIB || c.pib || '',
    address: typeof c.address === 'object' ? c.address : (c.companyAddress || c.address || ''),
    logo: c.logo || (c.images && c.images.length > 0 ? c.images[0] : ''),
    isVerified: c.status === 'active' || c.isVerified,
    phone: c.phone || '',
    website: c.website || c.companyWeb || '',
    facebook: c.facebook || c.companyFB || '',
    instagram: c.instagram || c.companyIG || '',
    workingHours: c.workingHours || c.companyWorkingHours || '',
  } as Company;
};

export const companiesService = {
  async getById(id: string): Promise<Company | null> {
    return withRetry(async () => {
      try {
        const res = await apiClient.get<any>(`/ads/${id}`);
        return normalizeCompany(res);
      } catch (e) {
        return null;
      }
    });
  },

  async fetchFiltered(
    filters: Record<string, unknown> | null | undefined,
    pageSize: number = 20,
    lastDoc: unknown = null
  ) {
    const validPageSize = typeof pageSize === 'number' && pageSize > 0 ? pageSize : 20;
    const lastVisibleId = (lastDoc && typeof lastDoc === 'object' && 'id' in lastDoc)
      ? (lastDoc as { id?: string }).id
      : (typeof lastDoc === 'string' ? lastDoc : undefined);

    return withRetry(async () => {
      const data = await apiClient.post<any>('/ads/search', {
        category: 'companies',
        filters: filters || {},
        pageSize: validPageSize,
        lastVisibleId: lastVisibleId || undefined
      });
      return {
        items: (data.docs || []).map((doc: any) => normalizeCompany(doc)) as Company[],
        lastVisible: data.lastVisibleId || null,
        hasMore: data.hasMore || false
      };
    });
  },

  async create(data: Partial<Company>) {
    return withRetry(async () => {
      const auth = (await import('firebase/auth')).getAuth();
      if (!auth.currentUser) throw new Error('Niste prijavljeni.');
      const result = await apiClient.post<{ id: string }>('/ads/create', { category: 'companies', data });
      return result.id;
    });
  },

  async update(id: string, updates: Partial<Company>) {
    return withRetry(async () => {
      await apiClient.patch(`/ads/${id}`, { category: 'companies', data: updates });
    });
  },

  async softDelete(id: string) {
    return withRetry(async () => {
      await apiClient.delete(`/ads/companies/${id}`);
    });
  },

  async togglePremium(id: string, isPremium: boolean) {
    return withRetry(async () => {
      if (isPremium && await isLaunchModeActive()) {
        throw new Error("Plaćene funkcije su onemogućene tokom launch faze.");
      }
      await this.update(id, { isPremiumProfile: isPremium });
    });
  },

  async incrementViews(id: string) {
    await viewStatsService.incrementView('listings', id);
  }
};
