import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { companiesService, Company } from "@/src/modules/companies/services/companiesService";
import { Company as CompanyAd } from "@/src/modules/companies/types/models";
import { queryKeys } from "@/src/lib/queryKeysFactory";

export function useCompanyDetails(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id!),
    queryFn: async () => {
      if (!id) return null;
      return companiesService.getById(id);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompaniesList(
  filters: Record<string, unknown> | null | undefined,
  options?: Omit<UseInfiniteQueryOptions<{
    items: Company[];
    lastVisible: string | null;
    hasMore: boolean;
  }, Error, any, any, any>, "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam">
) {
  return useInfiniteQuery<{
    items: Company[];
    lastVisible: string | null;
    hasMore: boolean;
  }>({
    queryKey: queryKeys.companies.list(filters || {}),
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
          if (import.meta.env.DEV) console.log("[useCompaniesList] Using hydrated INITIAL_STATE");
          const payload = {
            items: (state.docs || state.items || []) as Company[],
            lastVisible: (state.lastVisibleId || state.lastVisible || null) as string | null,
            hasMore: (state.hasMore || false) as boolean,
          };
          // Clear it so we don't reuse it for different calls later
          (window as Record<string, any>).INITIAL_STATE = null;
          return payload;
        }
      }
      return companiesService.fetchFiltered(filters, 24, pageParam);
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    ...(options as any),
  });
}

export function useCompanyAdMutations() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: Omit<CompanyAd, "id" | "createdAt">) =>
      companiesService.create(data),
    onSuccess: () => {
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CompanyAd> }) =>
      companiesService.update(id, data),
    onMutate: async ({ id, data }) => {
      // Optimizacija: Optimistic update bez invalidateQueries
      await queryClient.cancelQueries({ queryKey: queryKeys.companies.detail(id) });
      const prevData = queryClient.getQueryData<CompanyAd>(queryKeys.companies.detail(id));
      queryClient.setQueryData<CompanyAd | null>(queryKeys.companies.detail(id), (old) => {
        if (!old) return null;
        return {
          ...old,
          ...data,
        };
      });
      return { prevData };
    },
    onError: (err, variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(queryKeys.companies.detail(variables.id), context.prevData);
      }
    },
    onSuccess: (_, variables) => {
      // Optimizacija: bez invalidateQueries liste, oslanjamo se na setQueryData za detail (ili cache isteče)
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesService.softDelete(id),
    onSuccess: (_, id) => {
      // Optimizacija: bez invalidateQueries liste
      queryClient.removeQueries({
        queryKey: queryKeys.companies.detail(id),
      });
    },
  });

  return {
    addCompanyAd: addMutation.mutateAsync,
    updateCompanyAd: updateMutation.mutateAsync,
    deleteCompanyAd: deleteMutation.mutateAsync,
  };
}
