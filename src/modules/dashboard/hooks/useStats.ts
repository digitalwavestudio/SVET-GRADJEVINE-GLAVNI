import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { useDashboardUIStore } from "@/src/modules/dashboard/store/dashboardUIStore";

export interface StatsCounts {
  jobs: number;
  accommodations: number;
  machines: number;
  masters: number;
}

export interface PseoInsight {
  averagePrice?: number;
  estimatedTotal?: string | number;
  rangeMin?: number;
  rangeMax?: number;
  currency?: string;
}

/**
 * Optimizovana useStatsCounts kuka.
 * Sve statističke metrike i brojači dolaze pre-agregirani kroz BFF (bilo /bff/homepage ili /stats/counts bekovski agregat),
 * čime se u potpunosti eliminišu skupi runtime count upiti u bazi u realnom vremenu na klijentskom nivou.
 * Koristi 10-minutno osvežavanje i keširanje (staleTime i gcTime) radi zaštite kvota i maksimalnih performansi.
 */
export function useStatsCounts() {
  const isSlowConnection = useDashboardUIStore((state) => state.isSlowConnection);
  return useQuery({
    queryKey: dashboardKeys.statsCounts(),
    queryFn: async ({ signal }) => {
      return apiClient.get<StatsCounts>("/stats/counts", { signal });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes stale time (štiti Firestore kvotu)
    gcTime: 10 * 60 * 1000,    // 10 minutes cache garbage collection time
    enabled: !isSlowConnection,
  });
}

export function usePseoInsights(options: {
  collection: "jobs" | "machines" | "accommodations" | "masters";
  grad?: string;
  zanimanje?: string;
}) {
  const isSlowConnection = useDashboardUIStore((state) => state.isSlowConnection);
  return useQuery({
    queryKey: dashboardKeys.statsPseoInsights(
      options.collection,
      options.grad,
      options.zanimanje,
    ),
    queryFn: async ({ signal }) => {
      const params: Record<string, string | undefined> = { collection: options.collection };
      if (options.grad) params.grad = options.grad;
      if (options.zanimanje) params.zanimanje = options.zanimanje;
      return apiClient.get<PseoInsight>("/stats/pseo-insights", params);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes stale time (štiti Firestore kvotu)
    gcTime: 10 * 60 * 1000,    // 10 minutes cache garbage collection time
    enabled: !isSlowConnection,
  });
}

