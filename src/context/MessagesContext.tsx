import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useMessagesNode } from '@/src/modules/dashboard/hooks/useMessagesNode';
import { useMessagesStore } from '@/src/store/messagesStore';

export interface OfferData {
  price?: number;
  currency?: string;
  status?: string;
  title?: string;
  position?: string | number;
  salary?: string | number;
  accommodation?: string | number;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string | number | { seconds: number; nanoseconds: number };
  read?: boolean;
  type?: 'text' | 'offer' | 'contract_generated' | 'image';
  offerData?: OfferData;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string | { text?: string; content?: string; senderId?: string; type?: string; createdAt?: string | number | Date; [key: string]: unknown };
  lastMessageAt: string | number | { seconds: number; nanoseconds: number };
  lastSenderId: string;
  updatedAt: string | number | { seconds: number; nanoseconds: number };
  unreadCount?: Record<string, number>;
  adId?: string;
  adType?: string;
  adTitle?: string;
  partnerId?: string; 
  partnerName?: string;
  partnerPresence?: { status: string; lastActive?: string | number | { seconds: number; nanoseconds: number } };
}

export interface MessagesContextType {
  conversations: Conversation[];
  loadMoreConversations: () => void;
  hasMoreConversations: boolean;
  isFetchingNextPage: boolean;
  messages: Message[];
  loading: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (text: string, type?: 'text' | 'image' | 'offer', extraData?: unknown) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  startConversation: (partnerId: string, adData?: { id: string, type: string, title: string }, initialMessage?: string) => Promise<string | undefined>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  totalUnread: number;
  requireInbox: () => void;
  releaseInbox: () => void;
}

// Dummy provider to not break AppProviders layout without heavy refactor, could just render children.
export function MessagesProvider({ children }: { children: React.ReactNode }) {
  // It no longer provides context, relies on Zustand + React Query global state
  return <>{children}</>;
}

export function useMessages(): MessagesContextType {
  const { user } = useAuth();
  const inboxConsumers = useMessagesStore(state => state.inboxConsumers);
  const requireInbox = useMessagesStore(state => state.requireInbox);
  const releaseInbox = useMessagesStore(state => state.releaseInbox);
  
  const options = React.useMemo(() => ({
    enabled: inboxConsumers > 0
  }), [inboxConsumers]);
  
  const messagesNode = useMessagesNode(user, options);

  return {
    ...messagesNode,
    requireInbox: requireInbox,
    releaseInbox: releaseInbox
  };
}
