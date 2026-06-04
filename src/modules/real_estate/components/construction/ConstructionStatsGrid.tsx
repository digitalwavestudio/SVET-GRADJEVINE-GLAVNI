import React from 'react';

interface ConstructionStatsGridProps {
  isAllSites: boolean;
  currentSiteName?: string;
  activeCount: number;
  totalWorkersCount: number;
  totalDailyCost: number;
  estimatedMonthly: number;
  dateStr: string;
}

export function ConstructionStatsGrid({
  isAllSites,
  currentSiteName,
  activeCount,
  totalWorkersCount,
  totalDailyCost,
  estimatedMonthly,
  dateStr
}: ConstructionStatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-1 bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 block">{isAllSites ? 'PORTFOLIO' : 'NAZIV GRADILIŠTA'}</span>
        <div className="flex items-end gap-2">
          <span className="text-lg md:text-xl font-black text-white leading-none uppercase line-clamp-2">{isAllSites ? 'GLOBALNI PREGLED' : (currentSiteName || 'NEPOZNATO')}</span>
        </div>
      </div>
      <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none"></div>
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 block relative z-10">PRISUTNI RADNICI</span>
        <div className="flex items-end gap-2 relative z-10">
          <span className="text-4xl font-black text-white leading-none">{activeCount}</span>
          <span className="text-xs font-bold text-green-500 tracking-widest mb-[2px]">/ {totalWorkersCount}</span>
        </div>
      </div>
      <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 block">ODSUTNI</span>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-white leading-none">{totalWorkersCount - activeCount}</span>
          <span className="text-xs font-bold text-error tracking-widest mb-[2px] uppercase">Radnika</span>
        </div>
      </div>
      <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full group-hover:bg-secondary/10 transition-colors pointer-events-none"></div>
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 block relative z-10">
          TROŠAK • <span className="text-secondary">{dateStr}</span>
        </span>
        <div className="flex items-end gap-2 relative z-10">
          <span className="text-3xl lg:text-4xl font-black text-secondary leading-none">{totalDailyCost.toFixed(0)}</span>
          <span className="text-[10px] font-bold text-white/40 tracking-widest mb-[2px]">EUR</span>
        </div>
      </div>
      <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] shadow-2xl relative overflow-hidden group flex flex-col justify-between">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40 mb-2 block">MESEČNA PROJEKCIJA</span>
        <div className="flex items-end gap-2">
          <span className="text-3xl lg:text-4xl font-black text-white leading-none">~{Math.round(estimatedMonthly).toLocaleString('de-DE')}</span>
          <span className="text-[10px] font-bold text-white/40 tracking-widest mb-[2px]">EUR</span>
        </div>
      </div>
    </div>
  );
}
