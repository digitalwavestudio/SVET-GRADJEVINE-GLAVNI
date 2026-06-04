import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/src/modules/dashboard/services/dashboardService";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

export function useAdminStats() {
  return useQuery({
    queryKey: dashboardKeys.adminStats(),
    queryFn: async ({ signal }) => {
      const stats = await dashboardService.fetchServerStats();
      if (!stats) throw new Error("Failed to fetch admin stats");
      return stats;
    },
    staleTime: 30 * 60 * 1000, // 30-minute cache disabled proactive validation per prompt 12
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
}
