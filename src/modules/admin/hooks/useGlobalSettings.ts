import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export interface PricingTier {
  standard: number;
  premium: number;
  urgent: number;
}

export interface SettingsState {
  pricing: {
    jobs: PricingTier;
    accommodations: PricingTier;
    caterings: PricingTier;
    marketplace: PricingTier;
    machines: PricingTier;
    plots: PricingTier;
    professional_monthly: number;
  };
  limits: {
    free_listings_per_month: number;
    max_images_per_ad: number;
  };
  messages: {
    welcome_text: string;
    maintenance_mode: boolean;
  };
  globalRateLimit?: number;
  initialCredits?: number;
}
export function useGlobalSettings() {
  return useQuery<SettingsState>({
    queryKey: queryKeys.platformSettings,
    queryFn: async () => {
      const data = await apiClient.get<any>('/admin/settings/global');
      return data || {
        pricing: {
          jobs: { standard: 500, premium: 1000, urgent: 1500 },
          accommodations: { standard: 500, premium: 1000, urgent: 1500 },
          caterings: { standard: 500, premium: 1000, urgent: 1500 },
          marketplace: { standard: 500, premium: 1000, urgent: 1500 },
          machines: { standard: 500, premium: 1000, urgent: 1500 },
          plots: { standard: 500, premium: 1000, urgent: 1500 },
          professional_monthly: 6000
        },
        limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
        messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
        globalRateLimit: 100,
        initialCredits: 5000,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateGlobalSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: SettingsState) => {
      return apiClient.patch('/admin/settings/global', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.platformSettings });
    },
  });
}
