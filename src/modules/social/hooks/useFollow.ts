import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";

export function useIsFollowing(targetId: string | undefined) {
  return useQuery({
    queryKey: ["follow", "is-following", targetId],
    queryFn: async () => {
      if (!targetId) return false;
      const res = await apiClient.get<{ isFollowing: boolean }>(`/follow/is-following/${targetId}`);
      return res.isFollowing;
    },
    enabled: !!targetId,
    staleTime: 30 * 1000,
  });
}

export function useFollowers(targetId: string | undefined) {
  return useQuery({
    queryKey: ["follow", "followers", targetId],
    queryFn: async () => {
      if (!targetId) return { followers: [], count: 0 };
      return apiClient.get<{ followers: any[]; count: number }>(`/follow/followers/${targetId}`);
    },
    enabled: !!targetId,
    staleTime: 60 * 1000,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async (targetId: string) => {
      return apiClient.post(`/follow/${targetId}`, {});
    },
    onSuccess: (_, targetId) => {
      queryClient.invalidateQueries({ queryKey: ["follow", "is-following", targetId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "followers", targetId] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetId: string) => {
      return apiClient.delete(`/follow/${targetId}`);
    },
    onSuccess: (_, targetId) => {
      queryClient.invalidateQueries({ queryKey: ["follow", "is-following", targetId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "followers", targetId] });
    },
  });

  return {
    follow: followMutation.mutateAsync,
    unfollow: unfollowMutation.mutateAsync,
    isFollowingLoading: followMutation.isPending || unfollowMutation.isPending,
  };
}
