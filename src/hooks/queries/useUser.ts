import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import type { UserProfile, FavoriteAd } from "@svet-gradjevine/shared";

export const userKeys = {
  all: ["users"] as const,
  profile: (userId: string) => [...userKeys.all, "profile", userId] as const,
};

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.profile(userId || "guest"),
    queryFn: async () => {
      if (!userId) return null;
      try {
        const { getAuth } = await import('firebase/auth');
        const isMe = getAuth().currentUser?.uid === userId;

        const url = isMe ? `/users/me` : `/users/${userId}/public`;

        const data = await apiClient.get<UserProfile>(url);
        return data;
      } catch (err) {
        const errorObject = err as Record<string, unknown> | null;
        if (errorObject && typeof errorObject === 'object' && 'status' in errorObject && errorObject.status === 403) {
          console.warn(
            "User profile fetch rejected (Quota Exceeded or Forbidden)",
          );
        } else {
          console.error("Error fetching user profile directly", err);
        }
      }
      return null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minuta keširanja da se spreči dupli load na navigaciji
    refetchOnWindowFocus: false,
  });
}

export function useUserMutations(userId: string | undefined) {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      if (!userId) throw new Error("User not logged in");
      await apiClient.put("/users/profile", data);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      }
    },
  });

  const toggleSavedAdMutation = useMutation({
    mutationFn: async ({ adId, type }: { adId: string; type: string }) => {
      if (!userId) throw new Error("User not logged in");
      await apiClient.post("/favorites/toggle", { adId, adType: type });
    },
    onMutate: async ({ adId, type }) => {
      if (!userId) return;
      const queryKey = ["favorites", "user", userId];
      await queryClient.cancelQueries({ queryKey });
      const previousFavorites = queryClient.getQueryData<FavoriteAd[]>(queryKey);

      queryClient.setQueryData<FavoriteAd[]>(queryKey, (old) => {
        if (!old) return [{ adId, type }];
        const exists = old.some((item) => item.adId === adId);
        if (exists) {
          return old.filter((item) => item.adId !== adId);
        } else {
          return [...old, { adId, type }];
        }
      });
      return { previousFavorites, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousFavorites && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousFavorites);
      }
    },
    onSettled: (data, error, variables, context) => {
      if (context?.queryKey) {
        // Optional: you can choose not to invalidate on success for complete optimism
        // to avoid unnecessary background pulls, but typically it's good to keep it or just skip.
        // We will skip invalidate to save reads, just let cache live since it's toggled.
      }
    },
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    toggleSavedAd: toggleSavedAdMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}
