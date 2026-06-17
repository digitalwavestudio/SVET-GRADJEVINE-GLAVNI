import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { User } from "@/src/modules/core/types/user";
import { Message, Conversation } from "@/src/context/MessagesContext";
import { apiClient } from "@/src/lib/apiClient";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  InfiniteData,
} from "@tanstack/react-query";
import { useMessagesStore } from "@/src/store/messagesStore";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { DashboardSubscriptionManager } from "@/src/modules/dashboard/services/subscriptionManager";

export function useMessagesNode(
  user: User | null,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();
  const activeConversationId = useMessagesStore(state => state.activeConversationId);
  const setActiveConversationId = useMessagesStore(state => state.setActiveConversationId);
  const isMountedFn = useRef(true);

  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );
  const [isTabSuspended, setIsTabSuspended] = useState(false);

  useEffect(() => {
    isMountedFn.current = true;
    return () => {
      isMountedFn.current = false;
      // Force cleanup of all message-related listeners on unmount
      DashboardSubscriptionManager.unregister(`messages_${activeConversationId}`);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (import.meta.env.DEV) console.log("⏸️ [useMessagesNode] Tab hidden, suspending polling.");
        setIsVisible(false);
        setIsTabSuspended(true);
      } else {
        if (import.meta.env.DEV) console.log("▶️ [useMessagesNode] Tab visible, resuming polling.");
        setIsTabSuspended(false);
        setIsVisible(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const isEnabled = !!user && (options?.enabled ?? false);

  // Use React Query for Conversations List with HTTP Polling and Redis Caching on Backend
  const {
    data: conversationsData,
    isLoading: loading,
    fetchNextPage: loadMoreConversations,
    hasNextPage: hasMoreConversations,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: dashboardKeys.messages.inbox(user?.id || "guest"),
    queryFn: async ({ pageParam, signal }) => {
      if (!user) return { items: [], hasMore: false, lastVisibleId: null };
      const url = pageParam
        ? `/messages/inbox?cursor=${pageParam}`
        : "/messages/inbox";
      const data = await apiClient.get<{ items: Conversation[]; hasMore: boolean; lastVisibleId: string | null }>(url, { signal });

      if (!pageParam) {
        localStorage.setItem(`messages_inbox_${user.id}`, JSON.stringify(data));
      }
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisibleId : undefined,
    initialPageParam: null,
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    initialData: () => {
      if (!user) return undefined;
      if (typeof window === "undefined") return undefined; // guard for SSR if any
      const cached = localStorage.getItem(`messages_inbox_${user.id}`);
      if (cached) {
        return {
          pageParams: [null],
          pages: [JSON.parse(cached)],
        };
      }
      return undefined;
    },
  });

  const conversationsRef = useRef<Conversation[]>([]);
  const conversations = useMemo(() => {
    const pages = conversationsData?.pages as { items: Conversation[] }[] | undefined;
    const current = pages?.flatMap((page) => page.items) || [];
    const old = conversationsRef.current;
    if (current.length !== old.length) {
      conversationsRef.current = current;
      return current;
    }
    const isDiff = current.some((item, i) => {
      const oItem = old[i];
      if (!oItem) return true;
      if (item.id !== oItem.id) return true;
      if (item.updatedAt !== oItem.updatedAt) return true;
      if (
        item.unreadCount?.[user?.id || ""] !==
        oItem.unreadCount?.[user?.id || ""]
      )
        return true;

      // Lagano i ultra brzo plitko poređenje svojstava (shallow comparison) relevantnih polja
      const lm = item.lastMessage as { text?: string; content?: string; senderId?: string; createdAt?: string } | undefined;
      const olm = oItem.lastMessage as { text?: string; content?: string; senderId?: string; createdAt?: string } | undefined;
      if (lm !== olm) {
        if (!lm || !olm) return true;
        if (lm.text !== olm.text) return true;
        if (lm.content !== olm.content) return true;
        if (lm.senderId !== olm.senderId) return true;
        if (lm.createdAt !== olm.createdAt) return true;
      }
      return false;
    });
    if (isDiff) {
      conversationsRef.current = current;
      return current;
    }
    return old;
  }, [conversationsData, user?.id]);

  const {
    data: messagesInfiniteData,
    isLoading: messagesLoading,
    fetchNextPage: loadMoreMessages,
    hasNextPage: hasMoreMessages,
    isFetchingNextPage: isFetchingNextMessages,
  } = useInfiniteQuery<{ items: Message[]; hasMore: boolean; nextCursor: string | null }, Error, InfiniteData<{ items: Message[]; hasMore: boolean; nextCursor: string | null }>, readonly ["messages", "chat", string], string | null>({
    queryKey: dashboardKeys.messages.chat(activeConversationId || ""),
    queryFn: async ({ pageParam, signal }) => {
      if (!user || !activeConversationId) {
        return { items: [], hasMore: false, nextCursor: null };
      }
      const url = pageParam
        ? `/messages/chat/${activeConversationId}/messages?cursor=${pageParam}`
        : `/messages/chat/${activeConversationId}/messages`;
      const response = await apiClient.get<{ items: Message[]; hasMore: boolean; nextCursor: string | null }>(url, { signal });

      if (!pageParam && isMountedFn.current && response && response.items) {
        const messagesToSave = response.items.slice(-100);
        localStorage.setItem(
          `messages_list_${activeConversationId}`,
          JSON.stringify(messagesToSave),
        );
      }
      return response;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor : undefined,
    initialPageParam: null as string | null,
    enabled: !!user && !!activeConversationId && isEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    initialData: () => {
      if (!user || !activeConversationId) return undefined;
      if (typeof window === "undefined") return undefined;
      const cached = localStorage.getItem(`messages_list_${activeConversationId}`);
      if (cached) {
        return {
          pageParams: [null],
          pages: [{
            items: JSON.parse(cached),
            hasMore: true,
            nextCursor: null
          }]
        };
      }
      return undefined;
    },
  });

  const messagesRef = useRef<Message[]>([]);

  // Removed Realtime Inbox (Conversations List) Listener - Enforcing BFF Polling Instead

  // Removed Realtime micro-listener for newest messages - Enforcing BFF Polling Instead

  const messages = useMemo(() => {
    const pages = messagesInfiniteData?.pages as { items: Message[] }[] | undefined;
    const rawItems = pages?.flatMap((page) => page.items) || [];
    // Reverse the descending items from backend to display ascending (chronological) in our UI
    const current = [...rawItems].reverse();
    const old = messagesRef.current;
    if (current.length !== old.length) {
      messagesRef.current = current;
      return current;
    }
    const isDiff = current.some((msg, i: number) => {
      const oMsg = old[i];
      if (!oMsg) return true;
      if (msg.id !== oMsg.id) return true;
      if (msg.text !== oMsg.text) return true;
      if (msg.read !== oMsg.read) return true;
      if (msg.createdAt !== oMsg.createdAt) return true;
      return false;
    });
    if (isDiff) {
      messagesRef.current = current;
      return current;
    }
    return old;
  }, [messagesInfiniteData]);

  const markMessagesAsRead = useCallback(
    async (conversationId: string) => {
      if (!user || !isMountedFn.current) return;
      try {
        await apiClient.post(`/messages/chat/${conversationId}/read`);
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.messages.inbox(user.id),
        });
      } catch (err) {
        console.error(err);
      }
    },
    [user, queryClient],
  );

  const sendMessage = useCallback(
    async (
      text: string,
      type: "text" | "offer" | "image" = "text",
      offerData?: unknown,
    ) => {
      if (!user || !activeConversationId || !isMountedFn.current) return;
      try {
        const selected = conversations.find(
          (c: Conversation) => c.id === activeConversationId,
        );
        const recipientId =
          selected?.participants?.find((id: string) => id !== user.id) || "";

        const newMessage: Message = {
          id: "opt-" + Date.now(),
          senderId: user.id,
          text: text,
          type: type as 'text' | 'offer' | 'image',
          offerData: offerData as Record<string, unknown> | undefined,
          createdAt: new Date().toISOString(),
          read: false,
        };

        queryClient.setQueryData(
          dashboardKeys.messages.chat(activeConversationId || ""),
          (oldData: { pages: { items: Message[]; hasMore: boolean; nextCursor: string | null }[]; pageParams: unknown[] } | undefined) => {
            if (!oldData || !oldData.pages) {
              return {
                pageParams: [null],
                pages: [{ items: [newMessage as Message], hasMore: false, nextCursor: null }]
              };
            }
            const newPages = [...oldData.pages];
            newPages[0] = {
              ...newPages[0],
              items: [newMessage as Message, ...newPages[0].items]
            };
            return {
              ...oldData,
              pages: newPages
            };
          },
        );

        queryClient.setQueryData(
          dashboardKeys.messages.inbox(user.id),
          (oldData: { pages: { items: Conversation[]; hasMore: boolean; lastVisibleId: string | null }[]; pageParams: unknown[] } | undefined) => {
            if (!oldData || !oldData.pages) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items
                  .map((conv: Conversation) => {
                    if (conv.id === activeConversationId) {
                      return {
                        ...conv,
                        lastMessage: {
                          text,
                          createdAt: newMessage.createdAt,
                          senderId: user.id,
                        },
                        updatedAt: newMessage.createdAt,
                      };
                    }
                    return conv;
                  })
                  .sort(
                    (a, b) =>
                      new Date((b.updatedAt as string | number) || 0).getTime() -
                      new Date((a.updatedAt as string | number) || 0).getTime(),
                  ),
              })),
            };
          },
        );

        await apiClient.post("/messages/send", {
          chatId: activeConversationId,
          content: text,
          type,
          offerData,
          recipientId,
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [user, activeConversationId, conversations, queryClient],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      if (!user || !activeConversationId || !isMountedFn.current) return null;
      try {
        const selected = conversations.find(
          (c: Conversation) => c.id === activeConversationId,
        );
        const recipientId =
          selected?.participants?.find((id: string) => id !== user.id) || "";

        const formData = new FormData();
        formData.append("media", file);
        formData.append("chatId", activeConversationId);
        formData.append("recipientId", recipientId);
        formData.append("type", "image");

        const data = await apiClient.post<{ url?: string; messageId?: string }>(
          "/messages/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );

        return data?.url || null;
      } catch (error) {
        console.error("Upload failed", error);
        throw error;
      }
    },
    [user, activeConversationId, conversations],
  );

  const startConversation = useCallback(
    async (
      partnerId: string,
      adData?: { id: string; type: string; title: string },
      initialMessage?: string,
    ) => {
      if (!user) throw new Error("Morate biti prijavljeni.");
      if (user.id === partnerId)
        throw new Error("Ne možete započeti prepisku sa samim sobom.");

      // We can also try opening if exists locally
      const participants = [user.id, partnerId].sort();
      const generalId = participants.join("_");
      const specificId = adData ? `${generalId}_${adData.id}` : generalId;
      const localId = adData ? specificId : generalId;
      const existing = conversations.find(
        (c: Conversation) => c.id === localId,
      );

      if (existing) {
        if (isMountedFn.current) setActiveConversationId(existing.id);
        if (initialMessage) await sendMessage(initialMessage);
        return existing.id;
      }

      try {
        const data = await apiClient.post<{ id: string }>("/messages/create", {
          partnerId,
          initialMessage,
          adData,
        });
        if (!data || !data.id) throw new Error("Neuspjesno kreiranje");

        if (isMountedFn.current) setActiveConversationId(data.id);
        return data.id;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [user, conversations, sendMessage, setActiveConversationId],
  );

  const totalUnread = useMemo(() => {
    return conversations.reduce(
      (sum: number, conv: Conversation) =>
        sum + (conv.unreadCount?.[user?.id || ""] || 0),
      0,
    );
  }, [conversations, user?.id]);

  return {
    conversations,
    loadMoreConversations,
    hasMoreConversations,
    isFetchingNextPage,
    messages,
    loading,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    uploadImage,
    startConversation,
    markMessagesAsRead,
    totalUnread,
  };
}
