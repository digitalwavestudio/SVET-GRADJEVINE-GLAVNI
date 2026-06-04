import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/src/lib/apiClient';
import { DashboardLayout } from '@/src/modules/core';
import OfferModal from '@/src/components/OfferModal';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';

import { MessageSidebar } from '../components/messages/MessageSidebar';
import { ConversationArea } from '../components/messages/ConversationArea';
import { ContextSidebar } from '../components/messages/ContextSidebar';

export default function MessagesPage() {
  const { user, getIdToken } = useAuth();
  const navigate = useNavigate();
  const { 
    conversations, 
    loadMoreConversations,
    hasMoreConversations,
    isFetchingNextPage,
    messages, 
    activeConversationId, 
    setActiveConversationId, 
    sendMessage, 
    uploadImage,
    markMessagesAsRead,
    requireInbox,
    releaseInbox
  } = useMessages();
  
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const isEmployer = user?.role === 'poslodavac';

  useEffect(() => {
    requireInbox();
    return () => releaseInbox();
  }, [requireInbox, releaseInbox]);

  useEffect(() => {
    if (!user) {
      navigate('/prijava');
    }
  }, [user, navigate]);
  
  const selectedConv = conversations.find(c => c.id === activeConversationId);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const handleReportChat = async () => {
    if (!activeConversationId || !reportReason) return;
    setIsReporting(true);
    const token = await getIdToken?.() || '';
    try {
      await apiClient.post(`/messages/report/${activeConversationId}`, { reason: reportReason });
      alert('Prijava je uspešno poslata administratorima.');
      setIsReportModalOpen(false);
      setReportReason('');
    } catch (e) {
      alert('Greška pri prijavi.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleSendOffer = async (offer: unknown) => {
    if (!activeConversationId) return;
    await sendMessage('Zvanična ponuda za posao', 'offer', offer);
    setIsOfferModalOpen(false);
  };

  // Mark as read when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      markMessagesAsRead(activeConversationId);
    }
  }, [activeConversationId, markMessagesAsRead]);

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] h-[calc(100dvh-100px)] flex flex-col md:flex-row bg-[#0A0F14] border border-white/5 rounded-[10px] md:rounded-[10px] overflow-hidden shadow-2xl relative">
        
        <MessageSidebar 
          conversations={conversations}
          loadMoreConversations={loadMoreConversations}
          hasMoreConversations={hasMoreConversations}
          isFetchingNextPage={isFetchingNextPage}
          activeConversationId={activeConversationId}
          setActiveConversationId={setActiveConversationId}
          userId={user.id}
        />

        <ConversationArea 
          user={user as unknown as Record<string, unknown>}
          activeConversationId={activeConversationId}
          selectedConv={selectedConv}
          messages={messages}
          isEmployer={isEmployer}
          setActiveConversationId={setActiveConversationId}
          onSendMessage={sendMessage}
          onUploadImage={uploadImage}
          setIsOfferModalOpen={setIsOfferModalOpen}
          setIsReportModalOpen={setIsReportModalOpen}
        />

        <ContextSidebar selectedConv={selectedConv} />
        
      </div>

      <OfferModal 
        isOpen={isOfferModalOpen} 
        onClose={() => setIsOfferModalOpen(false)} 
        onSend={handleSendOffer}
        recipientName={selectedConv?.partnerName || ''}
      />

      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0F14] border border-red-500/20 rounded-[10px] w-full max-w-md p-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 text-center">Prijavi Razgovor</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Razlog prijave (npr. neprikladan rečnik, spam)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 text-white font-bold text-xs uppercase tracking-widest px-4 py-4 rounded-[10px] outline-none focus:border-red-500/50 transition-colors"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleReportChat}
                  disabled={!reportReason.trim() || isReporting}
                  className="py-4 bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] font-black rounded-[10px] uppercase tracking-widest hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {isReporting ? 'SLANJE...' : 'POŠALJI PRIJAVU'}
                </button>
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="py-4 bg-white/5 text-white/40 text-[10px] font-black rounded-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  ODUSTANI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
