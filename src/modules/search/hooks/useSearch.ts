import { useQuery } from "@tanstack/react-query";
import { unifiedSearchService } from "@/src/modules/search/services/unifiedSearchService";

export const searchKeys = {
  all: ["search"] as const,
  query: (q: string) => [...searchKeys.all, q] as const,
};

export function useSearch(query: string) {
  return useQuery({
    queryKey: searchKeys.query(query),
    queryFn: async () => {
      if (!query) return { results: [], aiIntent: null };
      return unifiedSearchService.search(query);
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
