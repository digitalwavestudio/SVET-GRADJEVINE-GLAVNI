import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  InfiniteData,
} from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { mutationGuard } from "@/src/lib/mutationGuard";
import { toast } from "react-hot-toast";
import { queryKeys as factoryQueryKeys, dashboardKeys } from "@/src/lib/queryKeysFactory";
import { offlineSyncManager } from "@/src/lib/offlineSyncManager";
import { useAuth } from "@/src/context/AuthContext";

export const myAdsKeys = {
  all: dashboardKeys.myAds.all,
  user: (userId: string) => dashboardKeys.myAds.user(userId),
};

export interface MyAd {
  id: string;
  title?: string;
  price?: number;
  status?: string;
  views?: number;
  createdAt?: string | number | Date;
  [key: string]: unknown;
}

export interface PaginatedAds {
  docs: MyAd[];
  lastVisibleId: string | null;
  hasMore: boolean;
}

export function useMyAds(userId: string | undefined, searchQuery?: string) {
  const queryClient = useQueryClient();
  const queryKey = [...myAdsKeys.user(userId || "guest"), searchQuery || ""];

  const result = useInfiniteQuery<
    PaginatedAds,
    Error,
    InfiniteData<PaginatedAds>,
    unknown[],
    string | null
  >({
    queryKey,
    queryFn: async ({ pageParam = null, signal }) => {
      if (!userId) return { docs: [], lastVisibleId: null, hasMore: false };

      let url = `/ads/my-ads?limitCount=15`;
      if (pageParam) url += `&cursor=${pageParam}`;
      if (searchQuery) url += `&searchQ=${encodeURIComponent(searchQuery)}`;

      const response = await apiClient.get<PaginatedAds>(url, { signal });
      return {
        docs: response.docs || [],
        lastVisibleId: response.lastVisibleId || null,
        hasMore: response.hasMore || false,
      };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisibleId : undefined,
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes stale time
    gcTime: 10 * 60 * 1000,    // 10 minutes cache/gc time
  });

  // Instant query abort / cancellation on unmount or tab/view change
  useEffect(() => {
    return () => {
      queryClient.cancelQueries({ queryKey });
    };
  }, [userId, searchQuery, queryClient]);

  const ads = result.data ? result.data.pages.flatMap((page) => page.docs) : [];

  return {
    data: ads,
    isLoading: result.isLoading,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    refetch: result.refetch,
    isError: result.isError,
    error: result.error,
  };
}

async function performOptimisticUpdate({
  queryClient,
  userId,
  user,
  id,
  action,
}: {
  queryClient: import('@tanstack/react-query').QueryClient;
  userId: string;
  user: any;
  id: string;
  action: "delete" | "approve" | "reject";
}) {
  const cacheKey = myAdsKeys.user(userId);
  await queryClient.cancelQueries({ queryKey: cacheKey });
  await queryClient.cancelQueries({ queryKey: factoryQueryKeys.ads.all });

  const prevData = queryClient.getQueryData<InfiniteData<PaginatedAds>>(cacheKey);

  let originalStatus: string | undefined = undefined;
  if (prevData) {
    for (const page of prevData.pages) {
      const found = page.docs.find((ad) => ad.id === id);
      if (found) {
        originalStatus = found.status;
        break;
      }
    }
  }

  const previousAds = prevData ? JSON.parse(JSON.stringify(prevData)) : undefined;

  queryClient.setQueryData<InfiniteData<PaginatedAds>>(cacheKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        docs: action === "delete" 
          ? page.docs.filter((ad) => ad.id !== id)
          : page.docs.map((ad) => ad.id === id ? { ...ad, status: action === "approve" ? "active" : "rejected" } : ad),
      })),
    };
  });

  let originalBffData: unknown = undefined;
  let bffKey: readonly unknown[] | null = null;
  if (user?.id) {
    const currentUser = user as { role?: string; userType?: string; id: string };
    const role = currentUser.role || currentUser.userType || "";
    bffKey = dashboardKeys.bff(role, currentUser.id);
    originalBffData = queryClient.getQueryData(bffKey);
    
    if (originalBffData) {
      queryClient.setQueryData(bffKey, (old: unknown) => {
        if (!old) return old;
        const typedOld = old as { stats?: { activeAds?: number; totalAds?: number; pendingAds?: number } };
        const updatedStats = { ...(typedOld.stats || {}) };
        
        if (action === "delete") {
          const statusToDecrease = originalStatus || "active";
          if (statusToDecrease === "active") {
            if (typeof updatedStats.activeAds === "number") updatedStats.activeAds = Math.max(0, updatedStats.activeAds - 1);
            if (typeof updatedStats.totalAds === "number") updatedStats.totalAds = Math.max(0, updatedStats.totalAds - 1);
          } else if (statusToDecrease === "pending" || statusToDecrease === "pending_payment") {
            if (typeof updatedStats.pendingAds === "number") updatedStats.pendingAds = Math.max(0, updatedStats.pendingAds - 1);
            if (typeof updatedStats.totalAds === "number") updatedStats.totalAds = Math.max(0, updatedStats.totalAds - 1);
          } else {
            if (typeof updatedStats.totalAds === "number") updatedStats.totalAds = Math.max(0, updatedStats.totalAds - 1);
          }
        } else if (action === "approve") {
          if (typeof updatedStats.activeAds === "number") updatedStats.activeAds += 1;
          if (originalStatus === "pending" || originalStatus === "pending_payment") {
            if (typeof updatedStats.pendingAds === "number") updatedStats.pendingAds = Math.max(0, updatedStats.pendingAds - 1);
          }
        } else if (action === "reject") {
          if (originalStatus === "active") {
            if (typeof updatedStats.activeAds === "number") updatedStats.activeAds = Math.max(0, updatedStats.activeAds - 1);
          } else if (originalStatus === "pending" || originalStatus === "pending_payment") {
            if (typeof updatedStats.pendingAds === "number") updatedStats.pendingAds = Math.max(0, updatedStats.pendingAds - 1);
          }
        }
        
        return { ...typedOld, stats: updatedStats };
      });
    }
  }

  return { previousAds, originalBffData, bffKey };
}

export function useMyAdsMutations(userId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const typeToCategory: Record<string, string> = {
    job: 'jobs',
    accommodation: 'accommodations',
    machine: 'machines',
    catering: 'caterings',
    plot: 'plots',
    real_estate: 'real_estate',
    company: 'companies',
  };

  const updateAdStatus = async (id: string, status: string) => {
    return mutationGuard(() => apiClient.patch(`/ads/${id}`, { status }), {
      actionName: `updateAdStatus_${status}`,
      context: { id, userId },
    });
  };

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type?: string }) => {
      if (!navigator.onLine) {
        offlineSyncManager.addToOutbox("deleteAd", { id });
        return { offline: true };
      }
      const category = typeToCategory[type || ''] || 'marketplace';
      return mutationGuard(() => apiClient.delete(`/ads/${category}/${id}`), {
        actionName: 'deleteAd',
        context: { id, userId },
      });
    },
    onMutate: async ({ id }) => {
      if (!userId) return;
      return performOptimisticUpdate({ queryClient, userId, user, id, action: "delete" });
    },
    onError: (err, variables, context) => {
      if (!navigator.onLine) {
        // Safe check, offline actions aren't actually an error unless specifically thrown
        return;
      }
      if (userId && context?.previousAds) {
        // ROLLBACK: Re-insert previous correct state if API route fails
        queryClient.setQueryData(myAdsKeys.user(userId), context.previousAds);
        // Sprovedi "Soft Refetch" da bi se Infinite Pages u potpunosti resinhronizovale sa serverom
        queryClient.refetchQueries({ queryKey: myAdsKeys.user(userId), type: 'active' });
      }
      if (context?.bffKey && context?.originalBffData) {
        queryClient.setQueryData(context.bffKey, context.originalBffData);
      }
      toast.error("Neuspešno brisanje oglasa. Oglas je vraćen na listu.");
    },
    onSettled: (data, err, variables, context) => {
      // Optimizacija: izbacujemo invalidateQueries na nivou cele liste.
      // Sva logika je vec in-place u onMutate, cime se izbegavaju read operacije!
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      if (!navigator.onLine) {
        throw new Error(
          "Niste povezani na mrežu. Akcije na oglasima su onemogućene dok ste van mreže.",
        );
      }
      return await updateAdStatus(id, "active");
    },
    onMutate: async ({ id }) => {
      if (!userId) return;
      return performOptimisticUpdate({ queryClient, userId, user, id, action: "approve" });
    },
    onError: (err, variables, context) => {
      if (userId && context?.previousAds) {
        queryClient.setQueryData(myAdsKeys.user(userId), context.previousAds);
        // Sprovedi "Soft Refetch" da bi se Infinite Pages u potpunosti resinhronizovale sa serverom
        queryClient.refetchQueries({ queryKey: myAdsKeys.user(userId), type: 'active' });
      }
      if (context?.bffKey && context?.originalBffData) {
        queryClient.setQueryData(context.bffKey, context.originalBffData);
      }
      toast.error("Neuspešna aktivacija oglasa.");
    },
    onSuccess: () => {
      toast.success("Oglas je uspešno aktiviran.");
    },
    onSettled: (data, err, variables, context) => {
      // Optimizacija: izbacujemo invalidateQueries na nivou cele liste.
      // Sva logika je vec in-place u onMutate, cime se izbegavaju read operacije!
    },
  });

  // Supporting Reject Action inline for full enterprise coverage
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!navigator.onLine) {
        throw new Error("Niste povezani na mrežu.");
      }
      return await updateAdStatus(id, "rejected");
    },
    onMutate: async ({ id }) => {
      if (!userId) return;
      return performOptimisticUpdate({ queryClient, userId, user, id, action: "reject" });
    },
    onError: (err, variables, context) => {
      if (userId && context?.previousAds) {
        queryClient.setQueryData(myAdsKeys.user(userId), context.previousAds);
        // Sprovedi "Soft Refetch" da bi se Infinite Pages u potpunosti resinhronizovale sa serverom
        queryClient.refetchQueries({ queryKey: myAdsKeys.user(userId), type: 'active' });
      }
      if (context?.bffKey && context?.originalBffData) {
        queryClient.setQueryData(context.bffKey, context.originalBffData);
      }
      toast.error("Neuspešno odbijanje oglasa.");
    },
    onSuccess: () => {
      toast.success("Oglas je odbijen.");
    },
    onSettled: (data, err, variables, context) => {
      // Optimizacija: izbacujemo invalidateQueries na nivou cele liste.
      // Sva logika je vec in-place u onMutate, cime se izbegavaju read operacije!
    },
  });

  return {
    deleteAd: deleteMutation.mutateAsync,
    approveAd: approveMutation.mutateAsync,
    rejectAd: rejectMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

export function usePlatformSettings() {
  return useQuery({
    queryKey: factoryQueryKeys.platformSettings,
    queryFn: async ({ signal }) => {
      try {
        const data = await apiClient.get<{ launchMode?: boolean; [key: string]: unknown }>("/settings/platform", { signal });
        return data || { launchMode: true };
      } catch (e) {
        return { launchMode: true };
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}
