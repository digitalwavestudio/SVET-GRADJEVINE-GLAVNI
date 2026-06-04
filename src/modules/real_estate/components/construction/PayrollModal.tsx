import { motion } from 'motion/react';
import React from 'react';
import { WorkerStatus } from '@/src/modules/real_estate/components/construction/types';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  rangeStart: number;
  rangeEnd: number;
  date: Date;
  activeWorkersArray: WorkerStatus[];
}

export const PayrollModal = React.memo(function PayrollModal({ isOpen, onClose, rangeStart, rangeEnd, date, activeWorkersArray }: PayrollModalProps) {
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
        className="w-full max-w-3xl bg-[#0A0F14] border border-white/10 rounded-[10px] overflow-hidden shadow-2xl relative"
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
                    <span className="material-symbols-outlined text-[24px]">price_check</span>
                  </span>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">PLATNI SPISAK</h3>
                    <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">ZA PERIOD OD {rangeStart}. DO {rangeEnd}. {date.toLocaleString('sr-Latn', {month: 'long', year: 'numeric'})}</p>
                  </div>
                </div>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex justify-between items-end border-b border-white/10 pb-2 mb-4">
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">IME RADNIKA</span>
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">IZNOS ZA ISPLATU</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {activeWorkersArray.map((w, idx) => {
                    const daysInPeriod = Math.abs(rangeEnd - rangeStart) + 1;
                    const hours = daysInPeriod * 8; // Pojednostavljeno za demo
                    const pay = hours * w.hourlyRate;
                    return (
                        <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2 rounded-[10px] -mx-2">
                          <div className="flex flex-col">
                              <span className="text-xs font-bold text-white capitalize">{w.name.toLowerCase() || 'Nepoznat Radnik'}</span>
                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{w.profession || 'Radnik'}</span>
                          </div>
                          <div className="text-right">
                              <span className="text-sm font-black text-cyan-400">{pay.toLocaleString('de-DE')} <span className="text-[10px] opacity-70 text-white/50">EUR</span></span>
                          </div>
                        </div>
                    )
                  })}
              </div>
            </div>

            <div className="flex justify-between items-end mt-8 border-t border-white/10 pt-6 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase mb-1">UKUPNA VREDNOST ZA ISPLATU</span>
                <span className="text-3xl font-black text-white tracking-tighter">
                  {activeWorkersArray.reduce((acc, w) => acc + ((Math.abs(rangeEnd - rangeStart) + 1) * 8 * w.hourlyRate), 0).toLocaleString('de-DE')} <span className="text-sm text-white/40 uppercase tracking-widest">EUR</span>
                </span>
              </div>
              <button 
                  onClick={onClose}
                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest text-[11px] py-4 px-8 rounded-[10px] transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                  <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                  PREUZMI SPISAK
              </button>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
});
