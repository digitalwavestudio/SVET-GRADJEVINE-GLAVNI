import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { accommodationsService } from "@/src/modules/accommodations/services/accommodationsService";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export function useAccommodationsList(filters: any, options?: any) {
  return useInfiniteQuery<{
    items: any[];
    lastVisible: any;
    hasMore: boolean;
    totalHits?: number;
  }>({
    queryKey: queryKeys.accommodations.list(filters),
    queryFn: async ({ pageParam }) => {
      if (
        !pageParam &&
        typeof window !== "undefined" &&
        (window as any).INITIAL_STATE?.searchResult
      ) {
        const state = (window as any).INITIAL_STATE.searchResult;
        if (
          state &&
          (Array.isArray(state.docs) || Array.isArray(state.items))
        ) {
          console.log("[useAccommodationsList] Using hydrated INITIAL_STATE");
          const payload = {
            items: state.docs || state.items || [],
            lastVisible: state.lastVisibleId || state.lastVisible,
            hasMore: state.hasMore || false,
            totalHits: state.totalHits,
          };
          (window as any).INITIAL_STATE = null;
          return payload;
        }
      }
      return accommodationsService.fetchFiltered(filters, 10, pageParam as any);
    },
    initialPageParam: null as any,
    getNextPageParam: (lastPage: any) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAccommodationDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.accommodations.detail(id),
    queryFn: async () => accommodationsService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccommodationMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      accommodationsService.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.accommodations.detail(id),
      });
      const previousData = queryClient.getQueryData(
        queryKeys.accommodations.detail(id),
      );
      queryClient.setQueryData(
        queryKeys.accommodations.detail(id),
        (old: any) => ({
          ...old,
          ...updates,
        }),
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.accommodations.detail(variables.id),
          context.previousData,
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate list, detail is optimistically updated via setQueryData
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  return {
    updateAccommodation: updateMutation.mutateAsync,
  };
}
