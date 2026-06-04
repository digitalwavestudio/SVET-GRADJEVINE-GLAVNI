import { PartnerSummary, CheckoutSummary, PlatformSummary } from '@/src/modules/dashboard';
import { apiClient } from '@/src/lib/apiClient';

/**
 * Service for fetching aggregated business intelligence data via BFF API.
 */
export const summaryService = {
  /**
   * Calculate partner-specific performance summary via backend.
   */
  async getPartnerPerformance(partnerId: string): Promise<PartnerSummary> {
    try {
      return await apiClient.get<PartnerSummary>(`/stats/partner/${partnerId}`);
    } catch(e) {
      throw new Error("Failed to fetch partner stats");
    }
  },

  /**
   * Fetches platform-wide financial summary via backend.
   */
  async getFinanceSummary(): Promise<CheckoutSummary> {
    try {
      return await apiClient.get<CheckoutSummary>(`/stats/finance`);
    } catch(e) {
      throw new Error("Failed to fetch finance stats");
    }
  }
};
