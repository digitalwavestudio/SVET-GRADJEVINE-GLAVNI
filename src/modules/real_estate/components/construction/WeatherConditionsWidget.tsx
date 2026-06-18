import React from 'react';

export function WeatherConditionsWidget() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-4 bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl text-secondary">cloud</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                Vremenski Uslovi
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse hidden md:block"></span>
              </h3>
              <p className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase leading-relaxed">Beograd, idealno za spoljne radove</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto flex-1 lg:ml-10">
            <div className="bg-[#131920] border border-white/5 rounded-[10px] p-4 col-span-1">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Temp</span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-white leading-none">18</span>
                <span className="text-xs text-white/50 mb-1">°C</span>
              </div>
            </div>
            
            <div className="bg-[#131920] border border-white/5 rounded-[10px] p-4 col-span-1 border-b-2 border-b-secondary/40">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-secondary">air</span> Vetar
              </span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-white leading-none">12</span>
                <span className="text-xs text-white/50 mb-1">km/h</span>
              </div>
            </div>

            <div className="bg-[#131920] border border-white/5 rounded-[10px] p-4 col-span-1">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-blue-400">water_drop</span> Padavine
              </span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-black text-white leading-none">0</span>
                <span className="text-xs text-white/50 mb-1">%</span>
              </div>
            </div>

            <div className="bg-[#131920] border border-white/5 rounded-[10px] p-4 col-span-1">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block flex items-center gap-1">
                   <span className="material-symbols-outlined text-[14px] text-green-500">precision_manufacturing</span> Kranovi
                 </span>
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest px-2 py-1 bg-green-500/10 rounded-[10px] border border-green-500/20">OPERATIVNO</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
