import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CheckoutEvent } from "@/src/modules/checkout/types/checkoutContracts";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

interface AdminCheckoutsResponse {
  items: CheckoutEvent[];
  lastVisibleId: string | null;
}

export function useAdminFinances(searchQuery?: string) {
  const queryClient = useQueryClient();
  const LIMIT = 20;

  const {
    data,
    isLoading: isCheckoutsLoading,
    hasNextPage: hasMore,
    isFetchingNextPage,
    fetchNextPage: fetchCheckouts,
  } = useInfiniteQuery<{ checkouts: CheckoutEvent[]; nextPageParam: string | null }>({
    queryKey: [...dashboardKeys.adminFinances(), searchQuery || ""],
    queryFn: async ({ pageParam = null, signal }) => {
      let url = `/admin/checkouts?limit=${LIMIT}`;
      if (pageParam) url += `&lastDocId=${pageParam}`;
      if (searchQuery) url += `&searchQ=${encodeURIComponent(searchQuery)}`;

      const response = await apiClient.get<AdminCheckoutsResponse>(url, { signal });

      return {
        checkouts: response?.items || [],
        nextPageParam: response?.lastVisibleId || null,
      };
    },
    getNextPageParam: (lastPage) => lastPage?.nextPageParam,
    initialPageParam: null as string | null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const confirmPayment = useMutation({
    mutationFn: (checkoutId: string) =>
      apiClient.post(`/admin/checkouts/${checkoutId}/confirm`, {}),
    onMutate: async (checkoutId: string) => {
      const queryKey = [...dashboardKeys.adminFinances(), searchQuery || ""];
      
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousFinances = queryClient.getQueryData<{
        pages: { checkouts: CheckoutEvent[]; nextPageParam: string | null }[];
        pageParams: (string | null)[];
      }>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<{
        pages: { checkouts: CheckoutEvent[]; nextPageParam: string | null }[];
        pageParams: (string | null)[];
      }>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            checkouts: page.checkouts.map((checkout) =>
              checkout.id === checkoutId
                ? { ...checkout, status: "confirmed" as const }
                : checkout
            ),
          })),
        };
      });

      // Return context object with the snapshotted value
      return { previousFinances };
    },
    onError: (_err, _checkoutId, context) => {
      const queryKey = [...dashboardKeys.adminFinances(), searchQuery || ""];
      if (context?.previousFinances) {
        queryClient.setQueryData(queryKey, context.previousFinances);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.adminFinances(),
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminStats() });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.adminFinances(), searchQuery || ""],
      });
    },
  });

  const checkouts = data ? data.pages.flatMap((page) => page.checkouts) : [];

  return {
    checkouts,
    isCheckoutsLoading,
    hasMore,
    isFetchingNextPage,
    fetchCheckouts,
    confirmPayment,
  };
}
