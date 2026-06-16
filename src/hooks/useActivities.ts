import { useEffect, useRef } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { apiClient } from "@/src/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Activity {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string | number | { seconds: number; nanoseconds: number };
  metadata?: any;
}

export interface PollData {
  activities: Activity[];
  unreadCount: number;
  lastUpdated: number;
}

export interface PollResponse {
  hasUpdates: boolean;
  data: PollData;
}

export const activitiesKeys = {
  all: ["activities"] as const,
  user: (userId: string) => [...activitiesKeys.all, userId] as const,
};

export function useActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasRequestedPermissionRef = useRef(false);
  const lastUpdatedRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    if (
      "Notification" in window &&
      Notification.permission === "default" &&
      !hasRequestedPermissionRef.current
    ) {
      hasRequestedPermissionRef.current = true;
      Notification.requestPermission().catch(() => {});
    }
  }, [user]);

  // Polling via API to reduce Firestore direct reads and open socket streams
  const { data } = useQuery({
    queryKey: activitiesKeys.user(user?.id || "guest"),
    queryFn: async () => {
      if (!user) return { activities: [], unreadCount: 0 };
      const res = await apiClient.get<PollResponse>(`/notifications/poll?since=${lastUpdatedRef.current}`);
      
      if (res.hasUpdates === false) {
        // Return existing data from cache if backend says no updates
        const existingInfo = queryClient.getQueryData<{ activities: Activity[]; unreadCount: number }>(activitiesKeys.user(user.id));
        return existingInfo || { activities: [], unreadCount: 0 };
      }

      const payload = res.data;
      lastUpdatedRef.current = payload.lastUpdated;

      // Handle toast notifications for genuinely new items
      const existingInfo = queryClient.getQueryData<{ activities: Activity[]; unreadCount: number; lastUpdated?: number }>(activitiesKeys.user(user.id));
      if (existingInfo && payload.activities) {
        const reallyNew = payload.activities.filter(
          (a: Activity) => !a.read && (!existingInfo.activities.find((pa) => pa.id === a.id))
        );
        
        if (reallyNew.length > 0 && Notification.permission === "granted") {
          reallyNew.forEach((data: Activity) => {
            new Notification(data.title || "Svet Građevine", {
              body: data.message || "Nova aktivnost",
              icon: "/logo192.png",
            });
          });
        }
      }

      return payload;
    },
    enabled: !!user,
    staleTime: 50 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (activityId: string) => {
      await apiClient.post(`/notifications/${activityId}/read`);
      return activityId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.user(user?.id || "guest") });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/notifications/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.user(user?.id || "guest") });
    }
  });

  return {
    activities: data?.activities || [],
    unreadCount: data?.unreadCount || 0,
    markAsRead: (id: string) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}

