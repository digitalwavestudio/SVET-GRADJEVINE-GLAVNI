import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
  UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { machinesService, Machine } from "@/src/modules/machines/services/machinesService";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export function useMachinesList(
  filters: Record<string, unknown> | null | undefined,
  options?: Omit<UseInfiniteQueryOptions<{
    items: Machine[];
    lastVisible: string | null;
    hasMore: boolean;
    totalHits?: number;
  }, Error, any, any, any>, "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam">
) {
  return useInfiniteQuery<{
    items: Machine[];
    lastVisible: string | null;
    hasMore: boolean;
    totalHits?: number;
  }>({
    queryKey: queryKeys.machines.list(filters || {}),
    queryFn: async ({ pageParam }) => {
      if (
        !pageParam &&
        typeof window !== "undefined" &&
        (window as Record<string, any>).INITIAL_STATE?.searchResult
      ) {
        const state = (window as Record<string, any>).INITIAL_STATE.searchResult;
        if (
          state &&
          (Array.isArray(state.docs) || Array.isArray(state.items))
        ) {
          console.log("[useMachinesList] Using hydrated INITIAL_STATE");
          const payload = {
            items: (state.docs || state.items || []) as Machine[],
            lastVisible: (state.lastVisibleId || state.lastVisible || null) as string | null,
            hasMore: (state.hasMore || false) as boolean,
            totalHits: state.totalHits as number | undefined,
          };
          (window as Record<string, any>).INITIAL_STATE = null;
          return payload;
        }
      }

      const res = await machinesService.fetchFiltered(filters, 10, pageParam);
      if (!res) {
        return { items: [], lastVisible: null, hasMore: false };
      }
      return {
        items: res.items,
        lastVisible: res.lastVisible,
        hasMore: res.hasMore,
      };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...(options as any),
  });
}

export function useMachineDetails(id: string) {
  return useQuery({
    queryKey: queryKeys.machines.detail(id),
    queryFn: async () => machinesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMachineMutations() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Machine> }) =>
      machinesService.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.machines.detail(id),
      });
      const previousData = queryClient.getQueryData<Machine>(
        queryKeys.machines.detail(id),
      );
      queryClient.setQueryData<Machine | null>(
        queryKeys.machines.detail(id),
        (old) => old ? { ...old, ...updates } : null
      );
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.machines.detail(variables.id),
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
    updateMachine: updateMutation.mutateAsync,
  };
}
