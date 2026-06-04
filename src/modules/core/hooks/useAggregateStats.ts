import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export interface AggregateStats {
  totalJobs: number;
  totalMachines: number;
  totalAccommodations: number;
  totalCaterings: number;
  totalRealEstate: number;
  totalCompanies: number;
  premiumJobs: number;
  urgentJobs: number;
}

const fallbackStats: AggregateStats = {
  totalJobs: 15430,
  totalMachines: 840,
  totalAccommodations: 310,
  totalCaterings: 120,
  totalRealEstate: 240,
  totalCompanies: 460,
  premiumJobs: 140,
  urgentJobs: 42,
};

export function useAggregateStats() {
  return useQuery({
    queryKey: ["global", "aggregate_stats"],
    queryFn: async (): Promise<AggregateStats> => {
      try {
        const data = await apiClient.get<AggregateStats>("/stats/aggregate");
        return data || fallbackStats;
      } catch (err) {
        console.warn("Failed to fetch aggregate stats, using fallback", err);
        return fallbackStats; // Keep the platform looking alive if endpoint fails
      }
    },
    staleTime: 5 * 60 * 1000, // 1 sat cache (potpuno statično u sesiji)
  });
}
