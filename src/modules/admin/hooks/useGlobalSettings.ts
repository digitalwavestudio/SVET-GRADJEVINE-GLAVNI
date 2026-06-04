import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export interface SettingsState {
  pricing: {
    job_standard: number;
    job_premium: number;
    machine_premium: number;
    real_estate_premium: number;
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
}

export function useGlobalSettings() {
  return useQuery<SettingsState>({
    queryKey: queryKeys.platformSettings,
    queryFn: async () => {
      const data = await apiClient.get<any>('/admin/settings/global');
      return data || {
        pricing: { job_standard: 0, job_premium: 2500, machine_premium: 1500, real_estate_premium: 3000, professional_monthly: 5000 },
        limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
        messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
        globalRateLimit: 100,
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
