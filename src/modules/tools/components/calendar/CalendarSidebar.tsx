import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface CalendarEvent {
  id?: string;
  day: number;
  month: number;
  year: number;
  endDay?: number;
  title: string;
  type: string;
  color?: string;
  hasAlarm?: boolean;
}

interface CalendarSidebarProps {
  siteMetrics: {
    activeWorkers: number;
    totalWorkers: number;
    dailyCost: number;
  };
  events: CalendarEvent[];
  selectedDay: number | null;
  setSelectedDay: (day: number | null) => void;
  setNewEvent: (event: any) => void;
  setIsPaymentModalOpen: (open: boolean) => void;
  setIsEventModalOpen: (open: boolean) => void;
  setIsDiaryOpen: (open: boolean) => void;
  setIsModalOpen: (open: boolean) => void;
  newEvent: any;
}

export function CalendarSidebar({
  siteMetrics,
  events,
  selectedDay,
  setSelectedDay,
  setNewEvent,
  setIsPaymentModalOpen,
  setIsEventModalOpen,
  setIsDiaryOpen,
  setIsModalOpen,
  newEvent
}: CalendarSidebarProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* OPERATIVNA KONTROLA - GAZDINSKI WIDGET */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[80px]">analytics</span>
         </div>
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-[10px] flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined text-xl">query_stats</span>
               </div>
               <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">KONTROLA OPERATIVE</h4>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Dnevni presek za firmu</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-5 rounded-[10px]">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">RADNICI TRENUTNO (LIVE)</span>
                     <span className="text-xl font-black text-white tracking-tighter">{siteMetrics?.activeWorkers} <span className="text-[9px] opacity-40 uppercase tracking-widest">/ {siteMetrics?.totalWorkers}</span></span>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-black">
                     {Math.round(((siteMetrics?.activeWorkers || 0) / (siteMetrics?.totalWorkers || 1)) * 100)}%
                  </div>
               </div>

               <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-5 rounded-[10px]">
                  <div className="flex flex-col">
                     <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">DNEVNA ISPLATA (PROCENA)</span>
                     <span className="text-xl font-black text-emerald-400 tracking-tighter">{siteMetrics?.dailyCost?.toLocaleString('de-DE')}€</span>
                  </div>
                  <span className="material-symbols-outlined text-white/20">payments</span>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex gap-2">
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-emerald-500"></div>
               </div>
               <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[40%] h-full bg-secondary"></div>
               </div>
            </div>
            <div className="flex justify-between mt-2">
               <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">ROK IZGRADNJE</span>
               <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">NA VREME</span>
            </div>
         </div>
      </div>

      {/* DAN ISPLATE - PRIMARY ACTION */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
         <button 
          onClick={() => {
            setNewEvent({ ...newEvent, day: selectedDay || 1, type: 'payment' });
            setIsPaymentModalOpen(true);
          }}
          className="w-full flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[10px] hover:bg-emerald-500/10 transition-all group"
         >
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-[10px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">payments</span>
               </div>
               <div className="text-left">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none opacity-40">FINANSIJSKI ROK</div>
                  <div className="text-[11px] font-black text-white uppercase tracking-widest leading-none mt-1">DAN ISPLATE</div>
               </div>
            </div>
            <span className="material-symbols-outlined text-white/20 group-hover:text-white transition-colors">add_circle</span>
         </button>
      </div>

      {/* TERMINI KAO SEKUNDARNA STVAR */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
         <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-secondary/10 border border-secondary/20 rounded-[10px] flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">event_available</span>
               </div>
               <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">TERMINI & DOGAĐAJI</h4>
                  <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">Intervjui i Obilasci</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            {events.filter(e => ['interview', 'meeting'].includes(e.type)).slice(0, 3).map((e, idx) => (
               <div key={idx} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[10px]">
                  <div className={`w-1 h-8 rounded-full ${e.type === 'interview' ? 'bg-blue-500' : 'bg-green-500'}`} />
                  <div className="flex flex-col min-w-0">
                     <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{e.title}</span>
                     <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{e.day}. April</span>
                  </div>
               </div>
            ))}
            {events.filter(e => ['interview', 'meeting'].includes(e.type)).length === 0 && (
               <div className="py-4 text-center">
                  <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">Nema planiranih termina</span>
               </div>
            )}
         </div>

         <button 
          onClick={() => setIsEventModalOpen(true)}
          className="w-full mt-8 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-[10px] transition-all text-[9px] tracking-[0.2em] uppercase"
         >
            DODAJ NOVI TERMIN
         </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-secondary rounded-[10px] p-8 relative overflow-hidden !text-black shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl tracking-tighter uppercase">{selectedDay}. APRIL</h3>
              <button onClick={() => setSelectedDay(null)} className="material-symbols-outlined !text-black/40 hover:!text-black">close</button>
            </div>
            
            <div className="space-y-3">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Dostupni resursi</div>
              <button className="w-full flex items-center justify-between p-4 bg-slate-950/5 border border-slate-950/10 rounded-[10px] hover:bg-slate-950/10 transition-all">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  <span className="text-[10px] font-bold uppercase">Fotografije</span>
                </div>
                <span className="text-[10px] font-black opacity-40">4</span>
              </button>
              <button 
                onClick={() => setIsDiaryOpen(true)}
                className="w-full flex items-center justify-between p-4 bg-slate-950/5 border border-slate-950/10 rounded-[10px] hover:bg-slate-950/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  <span className="text-[10px] font-bold uppercase">Dnevnik</span>
                </div>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-950/10">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-slate-950 text-white font-black py-4 rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-slate-900 transition-all"
              >
                DETALJAN IZVEŠTAJ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
