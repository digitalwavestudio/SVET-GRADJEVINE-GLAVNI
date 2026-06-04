import { motion } from 'motion/react';
import React from 'react';
import { WorkerStatus, CalendarEvent, DayData } from '@/src/modules/real_estate/components/construction/types';

interface DayReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: number;
  date: Date;
  events: CalendarEvent[];
  getShiftedDay: (day: number) => number;
  totalDailyCost: number;
  historicalData: Record<number, DayData>;
  activeWorkersArray: WorkerStatus[];
  getHours: (checkIn?: string, checkOut?: string) => number;
}

export const DayReportModal = React.memo(function DayReportModal({
  isOpen,
  onClose,
  selectedDay,
  date,
  events,
  getShiftedDay,
  totalDailyCost,
  historicalData,
  activeWorkersArray,
  getHours
}: DayReportModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-[#030507]/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-2xl bg-[#0A0F14] border border-white/10 rounded-[10px] overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 p-6 z-20">
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-[10px] p-2 flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
        </div>
        
        <div className="p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-cyan-400/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <span className="w-14 h-14 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-cyan-400">
                    <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                  </span>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">IZVEŠTAJ DANA</h3>
                    <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">{selectedDay}. {date.toLocaleString('sr-Latn', {month: 'long', year: 'numeric'})}</p>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <div className="bg-[#131920] border border-white/5 rounded-[10px] p-6">
                  <span className="text-[9px] font-black tracking-[0.2em] text-white/30 uppercase block mb-2">Aktivni Događaji / Termini</span>
                  <div className="flex flex-col gap-1">
                    {events.filter(e => {
                      const start = getShiftedDay(e.day);
                      const end = e.endDay ? getShiftedDay(e.endDay) : start;
                      return selectedDay >= start && selectedDay <= end;
                    }).map((e, i) => (
                      <span key={i} className="text-xs font-bold text-white uppercase tracking-tight">• {e.title}</span>
                    ))}
                    {events.filter(e => {
                      const start = getShiftedDay(e.day);
                      const end = e.endDay ? getShiftedDay(e.endDay) : start;
                      return selectedDay >= start && selectedDay <= end;
                    }).length === 0 && <span className="text-xs text-white/20 italic">NEMA PLANIRANIH AKTIVNOSTI</span>}
                  </div>
              </div>
              <div className="bg-gradient-to-br from-[#131E2A] to-[#0A0F14] border border-cyan-400/20 rounded-[10px] p-6">
                  <span className="text-[9px] font-black tracking-[0.2em] text-cyan-400/50 uppercase block mb-2">Dnevni Trošak</span>
                  <span className="text-3xl font-black text-cyan-400">{selectedDay === date.getDate() ? totalDailyCost.toFixed(0) : historicalData[selectedDay]?.cost?.toFixed(0) || '0'} <span className="text-sm opacity-50">EUR</span></span>
              </div>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">EVIDENCIJA RADNIKA ZA TAJ DAN</span>
              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {activeWorkersArray.filter(w => w.isPresent || selectedDay !== date.getDate()).map((w, idx) => (
                      <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-[10px] -mx-2">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white capitalize">{w.name.toLowerCase() || 'Radnik'}</span>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{w.profession || 'Nepoznato'}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-white/40 tracking-widest block">{w.hourlyRate} EUR/h &times; {selectedDay === date.getDate() ? getHours(w.checkIn, w.checkOut).toFixed(1) : 8}h</span>
                            <span className="text-sm font-black text-white">{selectedDay === date.getDate() ? (w.hourlyRate * getHours(w.checkIn, w.checkOut)).toFixed(0) : (w.hourlyRate * 8).toFixed(0)} <span className="text-[10px] opacity-50">EUR</span></span>
                        </div>
                      </div>
                  ))}
                  {/* Ostali dodatni podaci iz arhive */}
                  {selectedDay !== date.getDate() && historicalData[selectedDay]?.workerCount > activeWorkersArray.length && (
                      <div className="py-4 text-center">
                        <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase block">+ dodatno radno angažovanje ({historicalData[selectedDay].workerCount - activeWorkersArray.length} radnika)</span>
                      </div>
                  )}
              </div>
            </div>

            <button 
              onClick={onClose}
              className="mt-10 w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-[10px] transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 relative z-10 cursor-pointer"
            >
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                EKSPORTUJ PDF IZVEŠTAJ DANA
            </button>
        </div>
      </motion.div>
    </motion.div>
  );
});
