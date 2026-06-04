import { create } from 'zustand';

interface MessagesState {
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  inboxConsumers: number;
  requireInbox: () => void;
  releaseInbox: () => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  inboxConsumers: 0,
  requireInbox: () => set((state) => ({ inboxConsumers: state.inboxConsumers + 1 })),
  releaseInbox: () => set((state) => ({ inboxConsumers: Math.max(0, state.inboxConsumers - 1) })),
}));
