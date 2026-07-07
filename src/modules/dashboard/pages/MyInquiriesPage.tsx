import { motion } from 'motion/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages, Conversation } from '@/src/context/MessagesContext';

type TabType = 'all' | 'accommodation' | 'jobs' | 'machines' | 'plots' | 'services';

export default function MyInquiriesPage() {
  const { user } = useAuth();
  const { conversations, loading, requireInbox, releaseInbox } = useMessages();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  React.useEffect(() => {
    requireInbox();
    return () => releaseInbox();
  }, [requireInbox, releaseInbox]);

  const filteredInquiries = conversations.filter(c => {
    // Only show conversations related to ads
    if (!c.adId) return false;
    
    // If standard user, they are likely the one who started it (participant metadata usually shows respondent)
    // But conceptually, we show all inquiries they are involved in that have an ad context
    
    if (activeTab === 'all') return true;
    if (activeTab === 'accommodation') return c.adType === 'accommodation';
    if (activeTab === 'jobs') return c.adType === 'jobs';
    if (activeTab === 'machines') return c.adType === 'machines';
    if (activeTab === 'plots') return c.adType === 'plots';
    if (activeTab === 'services') return c.adType === 'marketplace' || c.adType === 'catering';
    return true;
  });

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: 'SVI UPITI', icon: 'apps' },
    { id: 'accommodation', label: 'SMEŠTAJ', icon: 'hotel' },
    { id: 'jobs', label: 'POSAO', icon: 'work' },
    { id: 'machines', label: 'MAŠINE', icon: 'construction' },
    { id: 'plots', label: 'PLACEVI', icon: 'landscape' },
    { id: 'services', label: 'USLUGE', icon: 'settings_suggest' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-center md:text-left">MOJE PORUKE</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl text-center md:text-left">
            OVDE MOŽETE PRATITI SVE PORUKE KOJE STE POSLALI POSLODAVCIMA, VLASNICIMA SMEŠTAJA I PONUĐAČIMA USLUGA.
          </p>
        </div>

        {/* Navigation Bar / Tabs */}
        <div className="grid grid-cols-1 md:flex md:flex-wrap gap-2 p-1.5 bg-white/5 border border-white/10 rounded-[10px] w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-secondary !text-black shadow-lg'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <span className="text-white/40 text-xs font-bold uppercase tracking-widest animate-pulse">Ucitavanje...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInquiries.length > 0 ? (
              filteredInquiries.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/poruke?id=${conv.id}`}
                  className="group bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] hover:border-secondary/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-6 w-full">
                    <div className="w-16 h-16 rounded-[10px] bg-white/5 flex items-center justify-center text-secondary shrink-0 relative">
                       <span className="material-symbols-outlined text-3xl">
                         {conv.adType === 'accommodation' ? 'hotel' : 
                          conv.adType === 'jobs' ? 'work' : 
                          conv.adType === 'machines' ? 'construction' : 
                          conv.adType === 'plots' ? 'landscape' : 'mail'}
                       </span>
                       {conv.unreadCount && conv.unreadCount[user?.id || ''] > 0 && (
                         <div className="absolute -top-1 -right-1 w-5 h-5 bg-secondary !text-black rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#0A0F14]">
                            {conv.unreadCount[user?.id || '']}
                         </div>
                       )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-secondary transition-colors">
                          {conv.adTitle || 'PREPISKA'}
                        </h3>
                        <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-white/40 uppercase tracking-widest">
                          {conv.adType || 'UPIT'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-secondary">{conv.partnerName}</span>
                        <span>•</span>
                        <span>{typeof conv.lastMessage === 'string' ? `${conv.lastMessage.substring(0, 60)}${conv.lastMessage.length > 60 ? '...' : ''}` : conv.lastMessage?.text ? `${conv.lastMessage.text.substring(0, 60)}${conv.lastMessage.text.length > 60 ? '...' : ''}` : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 w-full md:w-auto mt-4 md:mt-0 justify-end">
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">POSLENJA PORUKA</div>
                      <div className="text-xs font-bold text-white/40">{(((conv.lastMessageAt as unknown) as { toMillis?: () => number })?.toMillis) ? new Date((((conv.lastMessageAt as unknown) as { toMillis?: () => number }).toMillis!())).toLocaleString() : 'Sada'}</div>
                    </div>
                    <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                      <span className="material-symbols-outlined text-white/20 group-hover:text-secondary transition-colors">chevron_right</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-20 text-center bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[10px] mb-4">
                <span className="material-symbols-outlined text-6xl text-white/5 mb-6">mark_email_read</span>
                <h3 className="text-lg font-black text-white/20 uppercase tracking-widest">NEMA PRONAĐENIH UPITA</h3>
                <p className="text-xs font-bold text-white/10 uppercase tracking-[0.2em] mt-2">IZABERITE DRUGU KATEGORIJU ILI ZAPOČNITE NOVI UPIT</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

