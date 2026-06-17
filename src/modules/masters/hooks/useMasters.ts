import { useInfiniteQuery, UseInfiniteQueryOptions } from "@tanstack/react-query";
import * as mastersService from "@/src/modules/masters/services/mastersService";
import { queryKeys } from "@/src/lib/queryKeysFactory";
import { Master } from "@/src/modules/masters/types/models";

export function useMastersList(
  filters: Record<string, unknown> | null | undefined,
  options?: Omit<UseInfiniteQueryOptions<{
    docs: Master[];
    lastVisibleId: string | null;
    hasMore: boolean;
  }, Error, any, any, any>, "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam">
) {
  return useInfiniteQuery<{
    docs: Master[];
    lastVisibleId: string | null;
    hasMore: boolean;
  }>({
    queryKey: queryKeys.masters.list(filters || {}),
    queryFn: async ({ pageParam }) => {
      // Consume INITIAL_STATE if it exists and this is the first page of the exact hub
      if (
        !pageParam &&
        typeof window !== "undefined" &&
        (window as Record<string, any>).INITIAL_STATE?.searchResult
      ) {
        const state = (window as Record<string, any>).INITIAL_STATE.searchResult;
        // Verify it looks like our payload
        if (
          state &&
          (Array.isArray(state.docs) || Array.isArray(state.items))
        ) {
          if (import.meta.env.DEV) console.log("[useMastersList] Using hydrated INITIAL_STATE");
          const payload = {
            docs: (state.docs || state.items || []) as Master[],
            lastVisibleId: (state.lastVisibleId || state.lastVisible || null) as string | null,
            hasMore: (state.hasMore || false) as boolean,
          };
          // Clear it so we don't reuse it for different calls later
          (window as Record<string, any>).INITIAL_STATE = null;
          return payload;
        }
      }
      return mastersService.fetchMasters(filters || null, pageParam as string | null);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore
        ? lastPage.lastVisibleId || null
        : undefined,
    staleTime: 5 * 60 * 1000,
    ...(options as any),
  });
}
