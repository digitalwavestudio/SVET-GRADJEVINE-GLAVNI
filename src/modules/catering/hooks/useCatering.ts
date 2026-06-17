import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { cateringService, CateringOffer, CateringFilters } from "@/src/modules/catering/services/cateringService";
import { queryKeys } from "@/src/lib/queryKeysFactory";

interface InitialState {
  searchResult?: {
    docs?: CateringOffer[];
    items?: CateringOffer[];
    lastVisibleId?: string | null;
    lastVisible?: string | null;
    hasMore?: boolean;
    totalHits?: number;
  };
}

interface CustomWindow extends Window {
  INITIAL_STATE?: InitialState | null;
}

export function useCateringList(filters: CateringFilters, options?: Partial<Record<string, unknown>>) {
  return useInfiniteQuery<{
    items: CateringOffer[];
    lastVisible: { id: string } | string | null;
    hasMore: boolean;
    totalHits?: number;
  }>({
    queryKey: queryKeys.catering.list(filters),
    queryFn: async ({ pageParam }) => {
      const customWindow = typeof window !== "undefined" ? (window as unknown as CustomWindow) : undefined;
      if (
        !pageParam &&
        customWindow?.INITIAL_STATE?.searchResult
      ) {
        const state = customWindow.INITIAL_STATE.searchResult;
        if (
          state &&
          (Array.isArray(state.docs) || Array.isArray(state.items))
        ) {
          if (import.meta.env.DEV) console.log("[useCateringList] Using hydrated INITIAL_STATE");
          const payload = {
            items: state.docs || state.items || [],
            lastVisible: state.lastVisibleId || state.lastVisible || null,
            hasMore: state.hasMore || false,
            totalHits: state.totalHits,
          };
          customWindow.INITIAL_STATE = null;
          return payload;
        }
      }
      return cateringService.fetchFiltered(filters, 20, pageParam as { id: string } | string | null);
    },
    initialPageParam: null as { id: string } | string | null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCateringDetails(id: string) {
  return useQuery<CateringOffer | null>({
    queryKey: queryKeys.catering.detail(id),
    queryFn: async () => cateringService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCateringMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CateringOffer> }) =>
      cateringService.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.catering.detail(id),
      });
      const previousData = queryClient.getQueryData<CateringOffer>(
        queryKeys.catering.detail(id),
      );
      queryClient.setQueryData<CateringOffer>(
        queryKeys.catering.detail(id),
        (old) => {
          if (!old) return undefined;
          return { ...old, ...updates };
        }
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.catering.detail(variables.id),
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
    updateCatering: updateMutation.mutateAsync,
  };
}
