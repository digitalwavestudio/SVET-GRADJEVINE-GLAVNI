import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export function useHomepageData() {
  return useQuery({
    queryKey: ["global", "homepage_data_v2"],
    queryFn: async ({ signal }) => {
      const data = await apiClient.get<any>("/bff/homepage", { signal });
      return data || {};
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });
}
