import React from 'react';
import { WorkerStatus } from '@/src/modules/real_estate/components/construction/types';

interface PayrollWidgetProps {
  date: Date;
  rangeStart: number;
  setRangeStart: React.Dispatch<React.SetStateAction<number>>;
  rangeEnd: number;
  setRangeEnd: React.Dispatch<React.SetStateAction<number>>;
  daysArray: number[];
  activeWorkersArray: WorkerStatus[];
  setIsPayrollModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function PayrollWidget({
  date,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  daysArray,
  activeWorkersArray,
  setIsPayrollModalOpen
}: PayrollWidgetProps) {
  return (
    <div className="w-full lg:w-[30%] bg-gradient-to-b from-[#131920]/80 to-[#0A0F14]/80 border border-cyan-400/20 rounded-[10px] p-6 lg:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden h-fit lg:sticky lg:top-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex items-center gap-3 mb-8 relative z-10">
            <span className="material-symbols-outlined text-cyan-400 text-3xl">payments</span>
            <div>
              <h4 className="font-black text-white tracking-widest uppercase text-base leading-tight">OBRAČUN PLATA</h4>
              <span className="text-[9px] font-black text-cyan-400/60 uppercase tracking-[0.2em]">Kalkulator za {date.toLocaleString('sr-Latn', { month: 'long' })}</span>
            </div>
        </div>
        
        {/* RANGE SELECTORS */}
        <div className="flex gap-4 mb-8 relative z-10">
           <div className="flex-1 bg-[#0A0F14]/50 border border-white/10 rounded-[10px] p-3 focus-within:border-cyan-400/50 transition-colors">
              <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1">Od Datuma</span>
              <div className="relative">
                 <select value={rangeStart} onChange={e => setRangeStart(Number(e.target.value))} className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer placeholder:text-white/20 mb-1">
                    {daysArray.filter(d => d <= rangeEnd).map(d => <option key={`start-${d}`} value={d} className="bg-[#0A0F14] text-white font-bold">{d}. {date.toLocaleString('sr-Latn', { month: 'short' })}</option>)}
                 </select>
                 <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-white/30 text-[18px] pointer-events-none">expand_more</span>
              </div>
           </div>
           <div className="flex-1 bg-[#0A0F14]/50 border border-white/10 rounded-[10px] p-3 focus-within:border-cyan-400/50 transition-colors">
              <span className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1">Do Datuma</span>
              <div className="relative">
                 <select value={rangeEnd} onChange={e => setRangeEnd(Number(e.target.value))} className="w-full bg-transparent text-white font-bold text-sm appearance-none outline-none cursor-pointer placeholder:text-white/20 mb-1">
                    {daysArray.filter(d => d >= rangeStart && d <= date.getDate()).map(d => <option key={`end-${d}`} value={d} className="bg-[#0A0F14] text-white font-bold">{d}. {date.toLocaleString('sr-Latn', { month: 'short' })}</option>)}
                 </select>
                 <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-white/30 text-[18px] pointer-events-none">expand_more</span>
              </div>
           </div>
        </div>

        <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.2em] mb-4 relative z-10 border-b border-white/5 pb-2">Angažovani Radnici ({activeWorkersArray.length})</span>
        
        <div className="flex-1 space-y-2 relative z-10 overflow-y-auto custom-scrollbar pr-2 mb-8 max-h-[300px]">
          {activeWorkersArray.map((w, idx) => {
              const daysInPeriod = Math.abs(rangeEnd - rangeStart) + 1;
              const hours = daysInPeriod * 8; // Pojednostavljeno za demo
              const pay = hours * w.hourlyRate;
              return (
                <div key={idx} className="flex justify-between items-center bg-[#0A0F14]/30 hover:bg-[#0A0F14]/80 transition-colors rounded-[10px] p-3 border border-white/5">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-white capitalize">{w.name.toLowerCase() || 'Nepoznat Radnik'}</span>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{w.profession || 'Radnik'}</span>
                   </div>
                   <div className="text-right flex items-center gap-4">
                      <div className="text-right">
                         <span className="text-[9px] font-black text-white/30 tracking-widest block uppercase">Sati</span>
                         <span className="text-[11px] font-bold text-white/70">{hours}</span>
                      </div>
                      <div className="text-right min-w-[70px]">
                         <span className="text-[9px] font-black text-white/30 tracking-widest block uppercase">Iznos</span>
                         <span className="text-xs font-black text-cyan-400">{pay.toLocaleString('de-DE')} <span className="text-[9px] opacity-50">€</span></span>
                      </div>
                   </div>
                </div>
              )
          })}
        </div>

        <div className="pt-6 border-t border-white/10 relative z-10">
           <div className="flex justify-between items-end mb-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-cyan-400/50 tracking-[0.2em]">Total za period</span>
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{rangeStart}. - {rangeEnd}. {date.toLocaleString('sr-Latn', { month: 'long' })}</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tighter">{
                 activeWorkersArray.reduce((acc, w) => acc + ((Math.abs(rangeEnd - rangeStart) + 1) * 8 * w.hourlyRate), 0).toLocaleString('de-DE')
              } <span className="text-sm text-cyan-400">EUR</span></span>
           </div>

           <button 
             onClick={() => setIsPayrollModalOpen(true)}
             className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-[10px] transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 cursor-pointer"
           >
              <span className="material-symbols-outlined text-[18px]">print</span>
              GENERISANJE PLATNOG SPISKA
           </button>
        </div>
    </div>
  );
}
