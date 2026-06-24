import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAdminSupport } from '@/src/modules/admin/hooks/useAdminSupport';
import { useDebounce } from '@/src/hooks/useDebounce';

interface SupportTabProps {
  [key: string]: never;
}

export function SupportTab(_props: SupportTabProps) {
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const { supportTickets, isLoading } = useAdminSupport(debouncedQuery);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);

  return (
    <motion.div 
       key="support"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: -20 }}
       className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]"
    >
      {/* Inbox List */}
      <div className="lg:col-span-1 bg-[#0A0F14] border border-white/5 rounded-[10px] flex flex-col overflow-hidden">
         <div className="p-8 border-b border-white/5">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">INBOX (Aktivni tiketi)</h3>
            <div className="relative">
               <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
               <input 
                 aria-label="Unos polja" 
                 type="text" 
                 placeholder="Pretraži tikete (email)..." 
                 value={localQuery}
                 onChange={(e) => setLocalQuery(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all" 
               />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto no-scrollbar">
            {supportTickets.map((t: any) => (
               <button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full text-left p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors ${activeTicket?.id === t.id ? 'bg-white/[0.02] border-l-2 border-l-secondary' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">#{t.id.slice(-6)}</span>
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{t.createdAt?.toMillis ? new Date(t.createdAt.toMillis()).toLocaleDateString() : ''}</span>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1 truncate">{t.subject}</h4>
                  <div className="flex items-center gap-2 mb-3">
                     <div className="w-5 h-5 rounded-[10px] bg-white/5 flex items-center justify-center text-[10px] font-black text-secondary">{t.name ? t.name[0] : '?'}</div>
                     <span className="text-[10px] font-bold text-white/60 uppercase">{t.name}</span>
                  </div>
                  <div className="flex gap-2">
                     <span className="text-[8px] font-black px-2 py-1 rounded-[10px] bg-white/5 text-white/40 uppercase tracking-widest border border-white/10">{t.status || 'OTVORENO'}</span>
                  </div>
               </button>
            ))}
            {supportTickets.length === 0 && <div className="p-8 text-center text-white/40 font-bold text-xs">Nema tiketa.</div>}
         </div>
      </div>

      {/* Chat/Ticket View */}
      <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[10px] flex flex-col overflow-hidden">
         <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
            {activeTicket ? (
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-black text-secondary tracking-widest uppercase">#{activeTicket.id.slice(-6)}</span>
                  <span className="text-[9px] font-black px-3 py-1 bg-red-500/10 text-red-500 rounded-[10px] uppercase tracking-widest border border-red-500/20">{activeTicket.status || 'OTVORENO'}</span>
               </div>
               <h2 className="text-2xl font-black text-white uppercase tracking-tight">{activeTicket.subject}</h2>
            </div>
            ) : <div></div>}
            <div className="flex gap-2">
               <button className="w-10 h-10 bg-white/5 rounded-[10px] flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <span className="material-symbols-outlined text-lg">more_vert</span>
               </button>
            </div>
         </div>
         
         <div className="flex-1 p-8 overflow-y-auto space-y-6">
            {activeTicket ? (
            <div className="flex gap-4 max-w-[80%]">
               <div className="w-10 h-10 shrink-0 bg-white/5 rounded-[10px] flex items-center justify-center text-lg font-black text-secondary">{activeTicket.name ? activeTicket.name[0] : '?'}</div>
               <div>
                  <div className="flex items-baseline gap-3 mb-1">
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{activeTicket.name}</span>
                     <span className="text-[9px] font-bold text-white/20">{activeTicket.email}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-[10px] rounded-tl-none p-5 text-xs text-white/60 font-bold uppercase tracking-widest leading-relaxed whitespace-pre-wrap">
                     {activeTicket.message}
                  </div>
               </div>
            </div>
            ) : (
            <div className="flex items-center justify-center h-full text-white/30 text-xs uppercase font-bold tracking-widest">
               IZABERITE TIKET
            </div>
            )}
         </div>

         {/* Quick Reply Box */}
         <div className="p-8 border-t border-white/5 bg-white/[0.01]">
            <textarea 
               placeholder="Upišite odgovor ovde..." 
               className="w-full bg-[#0A0F14] border border-white/10 rounded-[10px] p-4 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all resize-none h-24 mb-4"
            />
            <div className="flex justify-between items-center">
               <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 rounded-[10px] text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-colors">ZATVORI TIKET</button>
                  <button className="px-4 py-2 bg-white/5 rounded-[10px] text-[9px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:bg-white/10 transition-colors">PROSLEDI FINANSIJAMA</button>
               </div>
               <button className="bg-secondary !text-black font-black px-6 py-3 rounded-[10px] hover:bg-yellow-400 transition-all text-xs tracking-widest uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">send</span>
                  POŠALJI ODGOVOR
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
