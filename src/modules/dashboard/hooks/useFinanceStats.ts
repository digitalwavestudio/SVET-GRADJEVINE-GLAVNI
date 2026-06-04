import { useQuery } from "@tanstack/react-query";
import { summaryService } from "@/src/services/summaryService";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

/**
 * Enterprise hook for fetching pre-aggregated financial metrics from AdminStatsService via BFF.
 * Optimized with generous staleTime to protect Firestore/Aggregator quotas.
 */
export function useFinanceSummary() {
  return useQuery({
    queryKey: dashboardKeys.financeSummary(),
    queryFn: () => summaryService.getFinanceSummary(),
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
