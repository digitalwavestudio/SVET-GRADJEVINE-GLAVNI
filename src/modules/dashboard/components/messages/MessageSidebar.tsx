import { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { OnlineStatus } from '@/src/components/ui/OnlineStatus';
import { Conversation } from '@/src/context/MessagesContext';

const formatConvTime = (updatedAt: unknown): string => {
  if (!updatedAt) return '';
  let ts: number;
  if (typeof updatedAt === 'object' && updatedAt !== null) {
    const u = updatedAt as Record<string, unknown>;
    if (typeof u.toMillis === 'function') ts = u.toMillis();
    else if (typeof u.seconds === 'number') ts = u.seconds * 1000;
    else ts = Date.now();
  } else ts = Number(updatedAt) || Date.now();
  const date = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Juče';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

interface MessageSidebarProps {
  conversations?: Conversation[];
  loadMoreConversations?: () => void;
  hasMoreConversations?: boolean;
  isFetchingNextPage?: boolean;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  userId: string;
}

export function MessageSidebar({
  conversations = [],
  loadMoreConversations = () => {},
  hasMoreConversations,
  isFetchingNextPage,
  activeConversationId,
  setActiveConversationId,
  userId
}: MessageSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLButtonElement | HTMLDivElement | HTMLElement | null) => {
    if (isFetchingNextPage || !node) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreConversations && loadMoreConversations) {
        loadMoreConversations();
      }
    }, { rootMargin: '100px' });
    if (node) observer.current.observe(node);
  }, [isFetchingNextPage, hasMoreConversations, loadMoreConversations]);

  const filteredConversations = (conversations ?? []).filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    const partnerName = (conv.partnerName || 'Korisnik').toLowerCase();
    const adTitle = (conv.adTitle || '').toLowerCase();
    const lastMsg = (typeof conv.lastMessage === 'string' ? conv.lastMessage : conv.lastMessage?.text || '').toLowerCase();
    return partnerName.includes(searchLower) || adTitle.includes(searchLower) || lastMsg.includes(searchLower);
  });

  return (
    <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex-col bg-[#070B0F]/50 absolute md:static inset-0 z-20 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 md:p-8 border-b border-white/5">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="font-black tracking-tighter uppercase text-xl md:text-2xl">PORUKE</h2>
          <button className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center hover:bg-secondary hover:!text-black transition-all">
            <span className="material-symbols-outlined text-lg">edit_square</span>
          </button>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
          <input 
            type="text" 
            placeholder="PRETRAŽI RAZGOVORE..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-[10px] py-3.5 pl-12 pr-4 text-[10px] font-black tracking-widest uppercase focus:border-secondary transition-all outline-none text-white placeholder:text-white/20"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar py-4">
        {filteredConversations.map((conv, i) => {
          const unread = conv.unreadCount?.[userId] || 0;
          const partnerName = conv.partnerName || 'Korisnik';
          
          return (
            <button
              key={conv.id}
              ref={i === filteredConversations.length - 1 ? lastElementRef : null}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full px-8 py-5 flex gap-5 items-center transition-all relative group ${
                activeConversationId === conv.id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.01]'
              }`}
            >
              {activeConversationId === conv.id && (
                <motion.div layoutId="activeConv" className="absolute left-0 top-2 bottom-2 w-1 bg-secondary rounded-r-full" />
              )}
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-[10px] flex items-center justify-center font-black text-xl uppercase transition-all ${
                  activeConversationId === conv.id || unread > 0 ? 'bg-secondary !text-black' : 'bg-white/5 text-white/20 group-hover:bg-white/10'
                }`}>
                  {partnerName ? partnerName.charAt(0) : 'K'}
                </div>
                {conv.partnerId && (
                  <OnlineStatus 
                    userId={conv.partnerId} 
                    className="absolute -bottom-1 -right-1 scale-75"
                    prefetchedOnline={conv.partnerPresence?.status === 'online'}
                    prefetchedLastSeen={conv.partnerPresence?.lastActive}
                  />
                )}
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#0A0F14] font-black">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`text-sm font-black tracking-tight uppercase truncate ${unread > 0 ? 'text-white' : 'text-white/60'}`}>
                    {partnerName}
                  </h3>
                  {conv.updatedAt && (
                    <span className="text-[9px] text-white/20 font-bold uppercase">
                      {formatConvTime(conv.updatedAt)}
                    </span>
                  )}
                </div>
                <p className={`text-[11px] truncate uppercase tracking-wider ${unread > 0 ? 'text-secondary font-black' : 'text-white/30 font-bold'}`}>
                  {typeof conv.lastMessage === 'string' ? conv.lastMessage : conv.lastMessage?.text || 'Nova poruka'}
                </p>
                {conv.adTitle && (
                  <span className="text-[8px] font-black text-white/20 tracking-widest uppercase truncate block mt-1">Oglas: {conv.adTitle}</span>
                )}
              </div>
            </button>
          )
        })}
        {filteredConversations.length === 0 && (
            <div className="text-center p-8 text-white/40 text-[10px] uppercase font-black">Nema pronađenih razgovora.</div>
        )}
        {isFetchingNextPage && (
          <div className="text-center p-4 text-white/40 text-[10px] uppercase font-black">
            Učitavanje...
          </div>
        )}
      </div>
    </div>
  );
}
