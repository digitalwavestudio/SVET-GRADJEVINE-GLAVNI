import { apiClient } from '@/src/lib/apiClient';
import { User } from '@/src/modules/core/types/user';
import { BACKEND_TASKS } from '@/src/modules/core/types/backendTasks';
import { PartnerConversionContract } from '@/src/modules/core/types/partnerContracts';
import { viewStatsService } from '@/src/services/viewStatsService';

/**
 * Service for handling Partner/Affiliate logic
 */

export const partnerService = {
  /**
   * Main entry point for partner conversions.
   * This executes the handoff to the future Backend API (VERIFY_PARTNER_CONVERSION).
   */
  async executePartnerConversion(contract: PartnerConversionContract): Promise<void> {
    try {
      // 1. BACKEND HANDOFF LOGGING
      console.log(`🤝 [BACKEND_HANDOFF] Verifying Partner Conversion (${BACKEND_TASKS.VERIFY_PARTNER_CONVERSION}):`, contract);

      // 2. CLIENT-SIDE DATA WRITE (To be moved to server-side authoritative logic)
      const { partnerId, amount, commissionAmount } = contract;
      
      await apiClient.post('/partners/conversion', { partnerId, amount, commissionAmount });

      console.log(`✅ [PARTNERS] Conversion recorded for partner ${partnerId} on checkout ${contract.checkoutId}`);
    } catch (error) {
      console.error("Error executing partner conversion:", error);
      throw error;
    }
  },
  /**
   * Get partner data for a specific user
   */
  getPartnerData: async (userId: string): Promise<Partial<User> | null> => {
    try {
      const data = await apiClient.get<Partial<User>>(`/users/${userId}/public`);
      if (data && data.role === 'partner') return data;
      return null;
    } catch (e) {
        return null;
    }
  },

  /**
   * Find a partner by their unique promo code
   */
  getPartnerByCode: async (code: string): Promise<Partial<User> | null> => {
    try {
      return await apiClient.get<Partial<User>>(`/users/search-partner?code=${code}`);
    } catch (e) {
        return null;
    }
  },

  /**
   * Find a partner by their URL slug
   */
  getPartnerBySlug: async (slug: string): Promise<Partial<User> | null> => {
    try {
      return await apiClient.get<Partial<User>>(`/users/search-partner?slug=${slug}`);
    } catch (e) {
        return null;
    }
  },

  /**
   * Track a click for a partner with session-based throttling
   */
  trackClick: async (partnerId: string) => {
    await viewStatsService.incrementThrottled('users', partnerId, 'partnerClicks');
  },

  /**
   * Update partner metrics (leads or conversions)
   */
  updateMetrics: async (partnerId: string, type: 'leads' | 'conversions', amount: number = 1) => {
    try {
      await apiClient.post(`/partners/metrics/${partnerId}`, { type, amount });
    } catch (e) {
      console.error("Partner update metrics error:", e);
    }
  },

  /**
   * Initialize partner fields for a user
   */
  initializePartner: async (userId: string, code: string, slug: string) => {
    try {
      await apiClient.post(`/partners/init/${userId}`, { code, slug });
      return true;
    } catch (e) {
      console.error("Initialize partner error:", e);
      return false;
    }
  },

  /**
   * Generates a random partner code
   */
  generatePartnerCode: (name: string = 'PAR'): string => {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase() || 'PAR';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
  },

  /**
   * Generates a URL-friendly partner slug
   */
  generatePartnerSlug: (name: string = 'partner'): string => {
    const base = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'partner';
    const random = Math.floor(100 + Math.random() * 900);
    return `${base}-${random}`;
  }
};
