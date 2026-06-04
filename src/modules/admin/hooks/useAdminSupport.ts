import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

export function useAdminSupport(searchQuery?: string) {
  const { data: supportTickets = [], isLoading } = useQuery({
    queryKey: [...dashboardKeys.adminSupportTickets(), searchQuery || ""],
    queryFn: async ({ signal }) => {
      try {
        let url = "/admin/support-tickets";
        if (searchQuery) url += `?searchQ=${encodeURIComponent(searchQuery)}`;
        return await apiClient.get<any[]>(url, { signal });
      } catch (e) {
        throw new Error("Failed to fetch support tickets");
      }
    },
    staleTime: 5 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: true,
  });

  return { supportTickets, isLoading };
}
