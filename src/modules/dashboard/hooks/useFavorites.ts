import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";

export const favoritesKeys = {
  all: dashboardKeys.favorites.all,
  user: dashboardKeys.favorites.user,
};

interface FavoriteItem {
  id: string;
  type: string;
  adId?: string;
  _type?: string;
  title?: string;
  name?: string;
  brand?: string;
  company?: string;
  city?: string;
  location?: string;
  [key: string]: unknown;
}

export function useFavoritesList(userId: string | undefined) {
  return useQuery({
    queryKey: favoritesKeys.user(userId || "guest"),
    queryFn: async ({ signal }) => {
      if (!userId) return [];
      try {
        const data = await apiClient.get<FavoriteItem[]>("/favorites/my", { signal });
        if (Array.isArray(data)) {
          return data.map((item) => ({ ...item, _type: item.type || item._type }));
        }
        if (data && typeof data === 'object' && Array.isArray((data as any).favorites)) {
          return (data as any).favorites.map((item: any) => ({ ...item, _type: item.type || item._type }));
        }
        return [];
      } catch (err) {
        console.error("Error fetching favorites:", err);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFavoriteIds(userId: string | undefined) {
  return useQuery({
    queryKey: favoritesKeys.user(userId || "guest"),
    queryFn: async ({ signal }) => {
      if (!userId) return [];
      const data = await apiClient.get<FavoriteItem[]>("/favorites/my", { signal });
      return data.map((item) => ({ ...item, _type: item.type }));
    },
    select: (data) => ({
      ads: data.filter((i) => i.type !== "job").map((i) => i.adId),
      jobs: data.filter((i) => i.type === "job").map((i) => i.adId),
    }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
