import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { marketplaceService, MarketplaceItem, MarketplaceFilters } from "@/src/modules/marketplace/services/marketplaceService";
import { queryKeys } from "@/src/lib/queryKeysFactory";

interface InitialState {
  searchResult?: {
    docs?: MarketplaceItem[];
    items?: MarketplaceItem[];
    lastVisibleId?: string | null;
    lastVisible?: string | null;
    hasMore?: boolean;
    totalHits?: number;
  };
}

interface CustomWindow extends Window {
  INITIAL_STATE?: InitialState | null;
}

export function useItemDetails(id: string | undefined) {
  return useQuery<MarketplaceItem | null>({
    queryKey: queryKeys.marketplace.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      return marketplaceService.getItemById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplaceList(filters: MarketplaceFilters, options?: Partial<Record<string, unknown>>) {
  return useInfiniteQuery<{
    items: MarketplaceItem[];
    lastVisible: { id: string } | string | null;
    hasMore: boolean;
    totalHits?: number;
  }>({
    queryKey: queryKeys.marketplace.list(filters),
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
          if (import.meta.env.DEV) console.log("[useMarketplaceList] Using hydrated INITIAL_STATE");
          const payload = {
            items: (state.docs || state.items || []) as MarketplaceItem[],
            lastVisible: (state.lastVisibleId || state.lastVisible || null) as { id: string } | string | null,
            hasMore: state.hasMore || false,
            totalHits: state.totalHits,
          };
          customWindow.INITIAL_STATE = null;
          return payload;
        }
      }
      const res = await marketplaceService.getItems(
        filters,
        12,
        pageParam as { id: string } | string | null,
      );
      return {
        items: res.items,
        lastVisible: res.lastVisible || null,
        hasMore: res.hasMore ?? res.items.length >= 12,
        totalHits: res.totalHits,
      };
    },
    initialPageParam: null as { id: string } | string | null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useMarketplaceMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: Partial<MarketplaceItem>) =>
      marketplaceService.createItem(data),
    onSuccess: () => {
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<MarketplaceItem>;
    }) => marketplaceService.updateItem(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.marketplace.detail(id),
      });
      const previousData = queryClient.getQueryData<MarketplaceItem>(
        queryKeys.marketplace.detail(id),
      );
      queryClient.setQueryData<MarketplaceItem>(
        queryKeys.marketplace.detail(id),
        (old) => {
          if (!old) return undefined;
          return {
            ...old,
            ...data,
          };
        },
      );
      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.marketplace.detail(newTodo.id),
          context.previousData,
        );
      }
    },
    onSuccess: () => {
      // Invalidate list, detail is optimistically updated via setQueryData
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      marketplaceService.deleteItem(id),
    onSuccess: (_, id) => {
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
      queryClient.removeQueries({
        queryKey: queryKeys.marketplace.detail(id),
      });
    },
  });

  const incrementViewsMutation = useMutation({
    mutationFn: (id: string) =>
      marketplaceService.incrementViews(id),
  });

  return {
    addItem: addMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    incrementViews: incrementViewsMutation.mutateAsync,
  };
}
