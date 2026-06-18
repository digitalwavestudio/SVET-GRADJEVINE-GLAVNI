import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { realEstateService, RealEstatePlot, RealEstateFilters } from "@/src/modules/real_estate/services/realEstateService";
import { db } from "@/src/lib/firebase";
import { queryKeys } from "@/src/lib/queryKeysFactory";

interface InitialState {
  searchResult?: {
    docs?: RealEstatePlot[];
    items?: RealEstatePlot[];
    lastVisibleId?: string | null;
    lastVisible?: string | null;
    hasMore?: boolean;
    totalHits?: number;
  };
}

interface CustomWindow extends Window {
  INITIAL_STATE?: InitialState | null;
}

export function useRealEstateList(filters: RealEstateFilters, options?: Partial<Record<string, unknown>>) {
  return useInfiniteQuery<{
    items: RealEstatePlot[];
    lastVisible: { id: string } | string | null;
    hasMore: boolean;
    totalHits?: number;
  }>({
    queryKey: queryKeys.realEstate.list(filters),
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
          if (import.meta.env.DEV) console.log("[useRealEstateList] Using hydrated INITIAL_STATE");
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
      return realEstateService.fetchFiltered(filters, 10, pageParam as { id: string } | string | null);
    },
    initialPageParam: null as { id: string } | string | null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useRealEstateDetails(id: string) {
  return useQuery<RealEstatePlot | null>({
    queryKey: queryKeys.realEstate.detail(id),
    queryFn: async () => realEstateService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRealEstateMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<RealEstatePlot> }) =>
      realEstateService.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.realEstate.detail(id),
      });
      const previousData = queryClient.getQueryData<RealEstatePlot>(
        queryKeys.realEstate.detail(id),
      );
      queryClient.setQueryData<RealEstatePlot>(
        queryKeys.realEstate.detail(id),
        (old: RealEstatePlot | undefined) => {
          if (!old) return undefined;
          return { ...old, ...updates };
        }
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.realEstate.detail(variables.id),
          context.previousData,
        );
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate list, detail is optimistically updated
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  const incrementViewsMutation = useMutation({
    mutationFn: async (id: string) => {
      await realEstateService.incrementViews(id);
    },
    // Background view increment, no need to invalidate detail and cause re-render
  });

  return {
    updatePlot: updateMutation.mutateAsync,
    incrementViews: incrementViewsMutation.mutateAsync,
  };
}
