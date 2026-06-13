import { useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  InfiniteData,
} from "@tanstack/react-query";
import {
  moderationService,
  ModerationItem,
} from "@/src/services/moderationService";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { toast } from "react-hot-toast";

interface ModerationPage {
  items: ModerationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useAdminModeration(searchQuery?: string) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data,
    isLoading: isQueueLoading,
    isFetchingNextPage: isFetchingMore,
    hasNextPage,
    fetchNextPage: fetchMore,
    refetch,
  } = useInfiniteQuery<
    ModerationPage,
    Error,
    InfiniteData<ModerationPage>,
    any,
    string | null
  >({
    queryKey: [...dashboardKeys.adminModerationQueue(), searchQuery || ""],
    queryFn: async ({ pageParam = null, signal }) => {
      const result = await moderationService.fetchPendingQueue(
        pageParam as string | undefined,
        25,
        searchQuery,
      );
      return result;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const moderationActionMutation = useMutation({
    mutationFn: async ({
      adminId,
      collectionName,
      targetId,
      action,
      reason,
      itemData,
    }: {
      adminId: string;
      collectionName: string;
      targetId: string;
      action: "approve" | "reject";
      reason?: string;
      itemData?: any;
    }) => {
      setProcessingId(targetId);
      return moderationService.executeModerationAction(
        {
          adminId,
          collectionName,
          targetId,
          action,
          reason,
        },
        itemData,
      );
    },
    onMutate: async ({ targetId }) => {
      const queryKey = [...dashboardKeys.adminModerationQueue(), searchQuery || ""];
      await queryClient.cancelQueries({ queryKey });

      const previousQueue = queryClient.getQueryData<InfiniteData<ModerationPage>>(queryKey);

      queryClient.setQueryData<InfiniteData<ModerationPage>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.filter((item) => item.id !== targetId),
            })),
          };
        },
      );

      return { previousQueue };
    },
    onError: (err, variables, context) => {
      const queryKey = [...dashboardKeys.adminModerationQueue(), searchQuery || ""];
      if (context?.previousQueue) {
        queryClient.setQueryData(queryKey, context.previousQueue);
      }
      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || "Greška pri obradi");
    },
    onSuccess: (data, variables) => {
      toast.success(variables.action === "approve" ? "Oglas odobren!" : "Oglas je odbijen.");
    },
    onSettled: () => {
      setProcessingId(null);
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.adminModerationQueue(), searchQuery || ""],
      });
    },
  });

  const removePendingItem = (id: string) => {
    // Optimistic cache update
    queryClient.setQueryData<InfiniteData<ModerationPage>>(
      [...dashboardKeys.adminModerationQueue(), searchQuery || ""],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.id !== id),
          })),
        };
      },
    );
  };

  const pendingQueue = data?.pages.flatMap((page) => page.items) || [];

  return {
    pendingQueue,
    isQueueLoading,
    processingId,
    setProcessingId,
    removePendingItem,
    fetchMore,
    refetch,
    hasMore: hasNextPage,
    isFetchingMore,
    moderationActionMutation,
  };
}
