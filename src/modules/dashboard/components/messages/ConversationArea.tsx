import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { OnlineStatus } from '@/src/components/ui/OnlineStatus';
import { Conversation, Message } from '@/src/context/MessagesContext';
import { MessageInput } from './MessageInput';

interface ConversationAreaProps {
  user: Record<string, unknown>;
  activeConversationId: string | null;
  selectedConv: Conversation | undefined;
  messages: Message[];
  // No longer used in conversation components
  isEmployer: boolean;
  setActiveConversationId: (id: string | null) => void;
  onSendMessage: (text: string, type: 'text' | 'image' | 'offer', extraData?: unknown) => Promise<void>;
  onUploadImage: (file: File) => Promise<string | null>;
  setTypingStatus?: (isTyping: boolean) => void;
  setIsOfferModalOpen: (isOpen: boolean) => void;
  setIsReportModalOpen: (isOpen: boolean) => void;
  partnerTyping?: boolean;
}

export function ConversationArea({
  user,
  activeConversationId,
  selectedConv,
  messages,
  partnerTyping,
  isEmployer,
  setActiveConversationId,
  onSendMessage,
  onUploadImage,
  setTypingStatus,
  setIsOfferModalOpen,
  setIsReportModalOpen
}: ConversationAreaProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAcceptOffer = async () => {
    if (!activeConversationId) return;
    await onSendMessage('PONUDA PRIHVAĆENA.', 'text');
  };

  return (
    <div className={`flex-1 flex-col relative w-full h-full ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
      {/* Chat Header */}
      <div className="px-4 md:px-10 py-4 md:py-6 border-b border-white/5 flex justify-between items-center bg-[#070B0F]/30 backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-5">
          <button 
            onClick={() => setActiveConversationId(null)}
            className="md:hidden w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center font-black text-secondary uppercase text-lg">
                {selectedConv ? (selectedConv.partnerName ? selectedConv.partnerName.charAt(0) : 'K') : '?'}
            </div>
            {selectedConv?.partnerId && (
              <OnlineStatus 
                userId={selectedConv.partnerId} 
                className="absolute -bottom-1 -right-1 scale-75"
                prefetchedOnline={selectedConv.partnerPresence?.status === 'online'}
                prefetchedLastSeen={selectedConv.partnerPresence?.lastActive}
              />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tighter uppercase text-white">
              {selectedConv?.partnerName || 'Odaberite razgovor'}
            </h3>
            {partnerTyping && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-1"
              >
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-secondary rounded-full animate-bounce"></span>
                  <span className="w-1 h-1 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1 h-1 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
                Kuca poruku...
              </motion.p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {isEmployer && (
            <button 
              onClick={() => setIsOfferModalOpen(true)}
              className="bg-secondary text-slate-950 font-black px-3 py-2 md:px-5 md:py-2.5 rounded-[10px] md:rounded-[10px] hover:bg-yellow-400 transition-all text-[9px] md:text-[10px] tracking-widest uppercase flex items-center gap-1 md:gap-2 shadow-lg shadow-secondary/10"
            >
              <span className="material-symbols-outlined text-sm md:text-lg">description</span>
              <span className="hidden sm:inline">POŠALJI PONUDU</span>
              <span className="sm:hidden">PONUDA</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-2">
            <button className="w-10 h-10 md:w-11 md:h-11 rounded-[10px] md:rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-secondary hover:text-slate-950 transition-all">
              <span className="material-symbols-outlined text-[18px]">call</span>
            </button>
          </div>
          <div className="w-px h-6 md:h-8 bg-white/5 mx-1 md:mx-2 hidden sm:block"></div>
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-[10px] md:rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#141B23] border border-white/10 rounded-[10px] shadow-2xl overflow-hidden z-50">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsReportModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-error uppercase text-[10px] font-black tracking-widest hover:bg-white/5 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">flag</span>
                  Prijavi korisnika
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-10 py-10 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-90">
        <div className="flex justify-center mb-10">
          <span className="bg-white/5 text-[9px] font-black text-white/30 px-4 py-1.5 rounded-full uppercase tracking-[0.3em]">DANAS</span>
        </div>
        
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => {
            const isMe = msg.senderId === user.id;
            return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] sm:max-w-[65%] group ${isMe && msg.type !== 'contract_generated' ? 'items-end' : msg.type === 'contract_generated' ? 'items-center mx-auto' : 'items-start'} flex flex-col`}>
                {msg.type === 'offer' ? (
                  <div className="bg-slate-950 border border-secondary/30 rounded-[10px] p-8 shadow-2xl w-full max-w-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-secondary/10 rounded-[10px] flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-2xl">contract</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">ZVANIČNA PONUDA</h4>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">POSLATO PREKO PLATFORME</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">POZICIJA</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{msg.offerData?.position || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">PLATA</span>
                        <span className="text-[10px] font-black text-secondary uppercase tracking-tight">{msg.offerData?.salary || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">SMEŠTAJ</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{msg.offerData?.accommodation || 'N/A'}</span>
                      </div>
                    </div>

                    {!isMe && (
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleAcceptOffer} className="py-3 bg-secondary text-slate-950 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg hover:scale-[1.02] active:scale-95">PRIHVATI</button>
                        <button className="py-3 bg-white/5 text-white/40 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">ODBIJ</button>
                      </div>
                    )}
                    {isMe && (
                      <div className="py-3 bg-white/5 text-white/20 text-[9px] font-black rounded-[10px] uppercase tracking-widest text-center">ČEKA SE ODGOVOR DRUGE STRANE</div>
                    )}
                  </div>
                ) : msg.type === 'contract_generated' ? (
                   <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-4 rounded-[10px] text-xs font-black tracking-widest leading-relaxed shadow-xl text-center uppercase flex items-center justify-center gap-3 w-full max-w-lg mb-4">
                     <span className="material-symbols-outlined text-2xl">verified_user</span>
                     {msg.text}
                   </div>
                ) : msg.type === 'image' ? (
                  <div className={`p-2 rounded-[10px] shadow-xl ${
                    isMe 
                      ? 'bg-secondary rounded-tr-none' 
                      : 'bg-[#141B23] border border-white/5 rounded-tl-none'
                  }`}>
                    <img src={msg.text} alt="Poslata slika" className="max-w-xs md:max-w-md rounded-lg object-contain" />
                  </div>
                ) : (
                  <div className={`px-6 py-4 rounded-[10px] text-sm font-bold leading-relaxed shadow-xl ${
                    isMe 
                      ? 'bg-secondary text-slate-950 rounded-tr-none' 
                      : 'bg-[#141B23] border border-white/5 text-white/90 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                )}
                <div className={`flex items-center gap-2 mt-2 ${isMe ? 'justify-end mr-2' : 'justify-start ml-2'}`}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                    {msg.createdAt ? new Date(typeof msg.createdAt === 'object' && 'seconds' in msg.createdAt ? msg.createdAt.seconds * 1000 : ((((msg as unknown) as Record<string, unknown>).timestamp as number) || Number(msg.createdAt) || Date.now())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                  {isMe && (
                    <span className={`material-symbols-outlined text-xs ${msg.read ? 'text-secondary' : 'text-white/20'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {msg.read ? 'done_all' : 'done'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )})}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>

      {/* Message Input */}
      <MessageInput 
        activeConversationId={activeConversationId}
        onSendMessage={onSendMessage}
        onUploadImage={onUploadImage}
      />
    </div>
  );
}
