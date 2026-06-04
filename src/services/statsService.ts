import { withRetry } from '@/src/lib/retry';
import { apiClient } from '@/src/lib/apiClient';

export interface QueryFilter {
  field: string;
  op: string;
  value: unknown;
}

export const statsService = {
  async getCachedStats(collectionName: string) {
    try {
      return await apiClient.get<{ total: number; today: number; premium: number }>(`/stats/collection/${collectionName}`);
    } catch (error) {
      console.error(`Error in getCachedStats for ${collectionName}:`, error);
      return { total: 0, today: 0, premium: 0 };
    }
  },

  async getCachedCount(collectionName: string) {
    const stats = await this.getCachedStats(collectionName);
    return stats.total;
  },

  async getCachedFilteredCount(collectionName: string, filters: QueryFilter[]) {
    // Ovo generalno trebamo da prebacimo na backend ako nam stvarno treba kompleksan filter,
    // ali posto trenutno retko koristimo slozene countove sa multi-filterima ovako sa klijenta,
    // radicemo jednostavan fallback a u praksi nam to ovde retko treba.
    return 0; // Ostavljeno kao fallback 
  },

  async getCollectionStats(collectionName: string) {
    return this.getCachedStats(collectionName);
  },

  async getRoleStats(role: string) {
     // Not heavily used, returns 0 for now as stats route could be extended
     return 0;
  },

  async getCount(collectionName: string) {
    return this.getCachedCount(collectionName);
  },

  async getFilteredCount(collectionName: string, filters: QueryFilter[]) {
    return this.getCachedFilteredCount(collectionName, filters);
  }
};
