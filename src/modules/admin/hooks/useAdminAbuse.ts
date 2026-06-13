import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

export interface AbuseReport {
  id: string;
  targetId: string;
  targetType: string;
  targetName?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt?: { _seconds: number; _nanoseconds: number } | string;
}

export interface AbuseReportsResponse {
  items: AbuseReport[];
  lastVisibleId: string | null;
}

export function useAdminAbuse() {
  const LIMIT = 20;

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<{ reports: AbuseReport[]; nextPageParam: string | null }>({
      queryKey: dashboardKeys.adminAbuseReports(),
      queryFn: async ({ pageParam = null, signal }) => {
        let url = `/admin/abuse-reports?limit=${LIMIT}`;
        if (pageParam) url += `&lastDocId=${pageParam}`;

        const response = await apiClient.get<AbuseReportsResponse>(url, { signal });

        return {
          reports: response?.items || [],
          nextPageParam: response?.lastVisibleId || null,
        };
      },
      getNextPageParam: (lastPage) => lastPage?.nextPageParam,
      initialPageParam: null as string | null,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

  const abuseReports = data ? data.pages.flatMap((page) => page.reports) : [];

  return {
    abuseReports,
    isLoading,
    isFetchingNextPage,
    hasMore: hasNextPage,
    fetchReports: fetchNextPage,
  };
}
