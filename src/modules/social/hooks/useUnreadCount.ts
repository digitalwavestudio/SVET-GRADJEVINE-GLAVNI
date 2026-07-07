import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { useAuth } from "@/src/context/AuthContext";

export function useUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notifications", "unread", user?.uid],
    queryFn: async () => {
      if (!user) return 0;
      try {
        const res = await apiClient.get<{ unreadCount: number }>("/notifications/poll?s=1");
        return res?.unreadCount ?? 0;
      } catch {
        return 0;
      }
    },
    enabled: !!user,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
