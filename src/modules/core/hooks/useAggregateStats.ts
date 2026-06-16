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
  totalJobs: 0,
  totalMachines: 0,
  totalAccommodations: 0,
  totalCaterings: 0,
  totalRealEstate: 0,
  totalCompanies: 0,
  premiumJobs: 0,
  urgentJobs: 0,
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
