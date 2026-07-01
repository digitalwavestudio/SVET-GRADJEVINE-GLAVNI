import { keepPreviousData, useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { useAuth } from "@/src/context/AuthContext";

export interface QuickMetricsResponse {
  data?: {
    myAdsCount?: number;
    unreadActivitiesCount?: number;
  };
  myAdsCount?: number;
  unreadActivitiesCount?: number;
}

export function useDashboardQuickMetrics<TData = QuickMetricsResponse>(
  select?: (data: QuickMetricsResponse) => TData
): UseQueryResult<TData, Error> {
  const { user } = useAuth();
  const uid = user?.id || user?.uid || "";

  return useQuery({
    queryKey: ["dashboard", "quick-metrics", uid],
    queryFn: async (): Promise<QuickMetricsResponse> => {
      const resp = await apiClient.get<QuickMetricsResponse | { data: QuickMetricsResponse }>("/bff/dashboard-metrics");
      if (resp && typeof resp === 'object' && 'data' in resp) {
          return (resp as { data: QuickMetricsResponse }).data;
      }
      return resp as QuickMetricsResponse;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select,
    enabled: !!uid,
    retry: 1,
  } as any) as UseQueryResult<TData, Error>;
}

export function useDashboardAdsCount(): UseQueryResult<number, Error> {
  return useDashboardQuickMetrics((data) => data.myAdsCount ?? 0);
}

export function useDashboardApplicationsCount(): UseQueryResult<number, Error> {
  return useDashboardQuickMetrics((data) => data.unreadActivitiesCount ?? 0);
}
