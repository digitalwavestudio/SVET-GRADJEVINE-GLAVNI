import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { apiClient } from "@/src/lib/apiClient";
import { toast } from "react-hot-toast";
import { useDashboardUIStore } from "../store/dashboardUIStore";

export interface SavedSearch {
  id: string;
  name: string;
  path: string;
  filterParams: Record<string, unknown>;
  createdAt: string;
}

export function useSavedSearches(userId: string | undefined) {
  const queryClient = useQueryClient();
  const isSlowConnection = useDashboardUIStore(state => state.isSlowConnection);

  const query = useQuery({
    queryKey: dashboardKeys.savedSearches.user(userId || ""),
    queryFn: async () => {
      // In a real app, this would be an API call
      // For now, we might fetch from /auth/me or a dedicated endpoint
      const response = await apiClient.get<{ savedSearches?: SavedSearch[] }>('/users/me');
      return (response?.savedSearches || []) as SavedSearch[];
    },
    enabled: !!userId,
    staleTime: isSlowConnection ? 30 * 60 * 1000 : 2 * 60 * 1000, 
    gcTime: isSlowConnection ? 60 * 60 * 1000 : 10 * 60 * 1000, 
  });

  const removeMutation = useMutation({
    mutationFn: async (searchId: string) => {
      await apiClient.delete(`/user/saved-searches/${searchId}`);
    },
    onMutate: async (searchId) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.savedSearches.user(userId || "") });
      const previous = queryClient.getQueryData<SavedSearch[]>(dashboardKeys.savedSearches.user(userId || ""));
      
      if (previous) {
        queryClient.setQueryData<SavedSearch[]>(
          dashboardKeys.savedSearches.user(userId || ""),
          previous.filter(s => s.id !== searchId)
        );
      }
      
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dashboardKeys.savedSearches.user(userId || ""), context.previous);
      }
      toast.error("Greška pri brisanju pretrage");
    },
    onSuccess: () => {
      toast.success("Pretraga obrisana");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.savedSearches.user(userId || "") });
    }
  });

  return {
    ...query,
    removeSearch: removeMutation.mutate
  };
}
