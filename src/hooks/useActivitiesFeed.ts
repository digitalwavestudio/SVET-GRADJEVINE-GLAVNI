import { useState, useCallback, useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";

export interface Activity {
  id: string;
  type: string;
  user: string;
  action: string;
  time: string;
  icon: string;
  color: string;
}

export interface RawActivityDoc {
  id: string;
  type: string;
  metadata?: {
    actorName?: string;
    [key: string]: unknown;
  };
  title?: string;
  message?: string;
  createdAt?: string | number | { _seconds?: number };
}

// Enterprise Query Key Factory Pattern for cache consistency
export const activitiesFeedKeys = {
  all: ["activities-feed"] as const,
  infinite: (userId: string) =>
    [...activitiesFeedKeys.all, "infinite", userId] as const,
};

export function useActivitiesFeed(userId: string | undefined) {
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  // Monitor tab focus to execute smart, low-frequency polling and prevent background resource drains
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | number | null = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (timeoutId) clearTimeout(timeoutId);
        setIsVisible(false);
      } else {
        // Debounce focus excitation to ensure stable layout transitions
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, 1500);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    }
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: activitiesFeedKeys.infinite(userId || "anonymous"),
    queryFn: async ({ pageParam }) => {
      if (!userId)
        return { activities: [], nextLastVisibleId: null, hasMore: false };

      const lastVisibleId = pageParam || "";
      // Exclusively consume high-performance, validated REST API to protect Firestore quotas
      const response = await apiClient.get<{
        activities: RawActivityDoc[];
        nextLastVisibleId: string | null;
        hasMore: boolean;
      }>(`/notifications/history?limit=5&lastVisibleId=${lastVisibleId}`);

      return response;
    },
    initialPageParam: "" as string,
    getNextPageParam: (lastPage) => lastPage.nextLastVisibleId || undefined,
    enabled: !!userId,
    // 5-minute staleTime protects the database from duplicate active query storms
    staleTime: 5 * 60 * 1000,
    // Intelligent refetch on window focus to enforce server-side cost safety
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });

  const loadMoreActivities = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Transformed lists decoupling database representation from presentation layer
  const activities = useMemo(() => {
    if (!data?.pages) return [];

    const flatDocs = data.pages.flatMap((page) => page.activities || []);

    return flatDocs.map((d: RawActivityDoc) => {
      let icon = "notifications";
      let color = "text-white";

      if (d.type?.includes("APPLICATION")) {
        icon = "work";
        color = "text-[#ffad3a]";
      } else if (d.type?.includes("MESSAGE")) {
        icon = "chat";
        color = "text-green-400";
      } else if (d.type?.includes("AD_")) {
        icon = "campaign";
        color = "text-blue-400";
      } else if (d.type?.includes("MODERATION")) {
        icon = "shield";
        color = "text-red-400";
      }

      let actor = "SISTEM";
      if (d.metadata?.actorName) {
        actor = d.metadata.actorName.toUpperCase();
      } else if (d.type?.includes("APPLICATION_STATUS")) {
        actor = "POSLODAVAC";
      } else if (d.type?.includes("MESSAGE")) {
        actor = "KORISNIK";
      } else if (d.type?.includes("AD_")) {
        actor = "VI";
      }

      return {
        id: d.id,
        type: d.type || "system",
        user: actor,
        action: `${d.title ? d.title.toUpperCase() + ": " : ""}${d.message || "Nova notifikacija"}`,
        time: d.createdAt
          ? new Date(
              typeof d.createdAt === "object" && d.createdAt._seconds
                ? d.createdAt._seconds * 1000
                : (d.createdAt as string | number),
            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "SADA",
        icon,
        color,
      };
    });
  }, [data?.pages]);

  return {
    activities,
    loadMoreActivities,
    isLoading: isLoading || isFetchingNextPage,
    isError,
    refetch,
  };
}
