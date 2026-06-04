import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export interface SystemConfig {
  holidayModeActive: boolean;
  discountPercentage: number;
  applicablePackages: string[];
}

export function useSystemConfig() {
  return useQuery({
    queryKey: queryKeys.systemConfig,
    queryFn: async () => {
      const res = await apiClient.get<SystemConfig>("/system/config");
      return res;
    },
    staleTime: 5 * 60 * 1000, // 5 minuta keširamo config
  });
}
