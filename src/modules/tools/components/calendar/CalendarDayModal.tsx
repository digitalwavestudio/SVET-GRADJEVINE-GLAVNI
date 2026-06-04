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

interface CalendarDayModalProps {
  isOpen: boolean;
  selectedDay: number | null;
  currentMonthLabel: string;
  monthEvents: CalendarEvent[];
  getShiftedDay: (day: number) => number;
  deleteCalendarEvent: (id: string) => Promise<void>;
  setIsModalOpen: (open: boolean) => void;
  setIsDiaryOpen: (open: boolean) => void;
}

export function CalendarDayModal({
  isOpen,
  selectedDay,
  currentMonthLabel,
  monthEvents,
  getShiftedDay,
  deleteCalendarEvent,
  setIsModalOpen,
  setIsDiaryOpen
}: CalendarDayModalProps) {
  if (!isOpen || selectedDay === null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-[#030507]/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-[#0A0F14] border border-white/10 rounded-[10px] overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 p-8 z-20">
          <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-10 lg:p-14 relative overflow-hidden">
          <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="flex items-center gap-6 mb-12 relative z-10">
            <span className="w-16 h-16 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[32px]">calendar_today</span>
            </span>
            <div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">DETALJI DANA</h3>
              <p className="text-[11px] font-black tracking-[0.3em] text-white/40 uppercase">{selectedDay}. {currentMonthLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 relative z-10">
            <div className="bg-[#131920] border border-white/5 rounded-[10px] p-6">
              <span className="text-[9px] font-black tracking-[0.2em] text-white/30 uppercase block mb-4">Aktivne Stvari / Isplate</span>
              <div className="flex flex-col gap-3">
                {monthEvents.filter(e => {
                  const start = getShiftedDay(e.day);
                  const end = e.endDay ? getShiftedDay(e.endDay) : start;
                  return selectedDay >= start && selectedDay <= end;
                }).length > 0 ? (
                  monthEvents.filter(e => {
                    const start = getShiftedDay(e.day);
                    const end = e.endDay ? getShiftedDay(e.endDay) : start;
                    return selectedDay >= start && selectedDay <= end;
                  }).map((e) => (
                    <div key={e.id} className="flex justify-between items-center bg-white/5 p-3 rounded-[10px] border border-white/5 group/list">
                       <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-6 rounded-full ${
                             e.type === 'phase' ? (e.color || 'bg-secondary') :
                             e.type === 'payment' ? 'bg-emerald-500' :
                             e.type === 'interview' ? 'bg-blue-500' : 'bg-white/20'
                          }`} />
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-white uppercase tracking-tighter">{e.title}</span>
                             {e.hasAlarm && (
                               <span className="material-symbols-outlined text-[12px] text-yellow-400 animate-pulse">notifications_active</span>
                             )}
                          </div>
                       </div>
                       <button 
                         onClick={async () => {
                           try {
                             if(e.id) await deleteCalendarEvent(e.id);
                           } catch (err) {
                             console.error("Error deleting event:", err);
                           }
                         }}
                         className="w-8 h-8 rounded-[10px] bg-error/10 text-error flex items-center justify-center opacity-0 group-hover/list:opacity-100 transition-all hover:bg-error hover:text-white"
                       >
                          <span className="material-symbols-outlined text-sm">delete</span>
                       </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm font-black text-white/20 italic">NIŠTA PLANIRANO</span>
                )}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#131E2A] to-[#0A0F14] border border-emerald-500/20 rounded-[10px] p-6">
              <span className="text-[9px] font-black tracking-[0.2em] text-emerald-500/50 uppercase block mb-2">Planirani Cash-Flow</span>
              <div className="flex flex-col gap-1">
                {monthEvents.filter(e => getShiftedDay(e.day) === selectedDay && (e.type === 'payment' || e.type === 'bill')).length > 0 ? (
                  monthEvents.filter(e => getShiftedDay(e.day) === selectedDay && (e.type === 'payment' || e.type === 'bill')).map((e, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white/80">{e.title}</span>
                      <span className={`text-sm font-black ${e.type === 'payment' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {e.type === 'payment' ? '-1.200€' : '540€'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm font-black text-white/20 italic">BEZ TRANSAKCIJA</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Arhiva Dokumentacije</span>
              <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Pristup Trezoru</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/5 rounded-[10px] flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">photo_library</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">Slike (4)</div>
                  <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Gradilište S-1</div>
                </div>
              </div>
              <div 
                onClick={() => setIsDiaryOpen(true)}
                className="p-4 bg-white/5 border border-white/5 rounded-[10px] flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">history_edu</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">Dnevnik</div>
                  <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Dnevni zapis</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex gap-4 relative z-10">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-white text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-[10px] transition-all hover:bg-white/90"
            >
              Pripravi Izveštaj
            </button>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-6 border border-white/10 hover:bg-white/5 text-white py-4 rounded-[10px] transition-all"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
