import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export function useHomepageData() {
  return useQuery({
    queryKey: ["global", "homepage_data"],
    queryFn: async () => {
      const data = await apiClient.get<any>("/bff/homepage");
      return data || {};
    },
    staleTime: 5 * 60 * 1000, 
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
