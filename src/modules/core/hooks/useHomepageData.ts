import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export function useHomepageData() {
  const initialData = typeof window !== 'undefined'
    ? (window as any).__INITIAL_HOMEPAGE_DATA__
    : undefined;

  return useQuery({
    queryKey: ["global", "homepage_data_v2"],
    queryFn: async () => {
      const data = await apiClient.get<any>("/bff/homepage");
      return data || {};
    },
    staleTime: initialData ? 0 : 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...(initialData ? { initialData } : {}),
  });
}
