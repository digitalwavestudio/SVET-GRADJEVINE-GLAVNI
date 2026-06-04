import React from 'react';
import { WorkerStatus, ResourceStatus } from '@/src/modules/real_estate/components/construction/types';

interface PortfolioGridWidgetProps {
  sites: { id: string; name: string }[];
  siteWorkers: Record<string, WorkerStatus[]>;
  siteResources: Record<string, ResourceStatus[]>;
  setActiveSiteId: (id: string | null) => void;
  handleAddSite: () => void;
  getHours: (checkIn: string, checkOut: string) => number;
}

export function PortfolioGridWidget({
  sites,
  siteWorkers,
  siteResources,
  setActiveSiteId,
  handleAddSite,
  getHours
}: PortfolioGridWidgetProps) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-3 mb-6 px-2">
        <span className="material-symbols-outlined text-secondary">corporate_fare</span>
        <h2 className="text-sm font-black uppercase tracking-widest text-white">AKTIVNA GRADILIŠTA (PORTFOLIO)</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map(site => {
           const sWorkers = siteWorkers[site.id] || [];
           const sRes = siteResources[site.id] || [];
           const actWCount = sWorkers.filter(w => w.isPresent).length;
           const wCost = sWorkers.reduce((acc, w) => acc + (w.isPresent && w.checkIn && w.checkOut ? w.hourlyRate * getHours(w.checkIn, w.checkOut) : 0), 0);
           const rCost = sRes.reduce((acc, r) => acc + (r.amount * r.unitPrice), 0);
           const tCost = wCost + rCost;
           
           // Simulacija upaljenog alarma (ako pređe neku fiktivnu granicu)
           const isOverBudget = tCost > 300;
           const completionRate = Math.min(100, Math.round((actWCount / (sWorkers.length || 1)) * 100));

           return (
             <div key={site.id} onClick={() => setActiveSiteId(site.id)} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 hover:border-white/10 transition-all cursor-pointer group hover:bg-white/[0.02] relative overflow-hidden flex flex-col h-full shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl rounded-full group-hover:bg-secondary/10 transition-colors pointer-events-none"></div>

                <div className="flex justify-between items-start mb-8 z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[10px] bg-[#131920] border border-white/10 flex items-center justify-center text-white/50 group-hover:text-secondary group-hover:bg-secondary/10 transition-colors shadow-inner">
                         <span className="material-symbols-outlined text-[20px]">construction</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white tracking-widest uppercase mb-1">{site.name}</h3>
                        <span className="text-[9px] font-bold text-white/40 tracking-[0.2em] uppercase">ID: {site.id.slice(0, 8)}</span>
                      </div>
                   </div>
                   {isOverBudget ? (
                     <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 rounded inline-flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-black tracking-widest uppercase text-red-500">Iznad budžeta</span>
                     </div>
                   ) : (
                     <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded inline-flex items-center gap-1.5 shrink-0">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        <span className="text-[8px] font-black tracking-widest uppercase text-green-500">U balansu</span>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 z-10">
                   <div>
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Dnevni Trošak</span>
                     <span className="font-mono text-xl font-black text-white">€{tCost.toFixed(0)}</span>
                   </div>
                   <div>
                     <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] block mb-1">Teren</span>
                     <span className="font-mono text-xl font-black text-white">{actWCount}<span className="text-[10px] text-white/30 ml-0.5">/ {sWorkers.length} rad.</span></span>
                   </div>
                </div>

                {/* Progress / Completion */}
                <div className="mt-auto z-10">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Aktivnost Kapaciteta</span>
                     <span className="text-[10px] font-mono font-bold text-white">{completionRate}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-[#131920] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
                   </div>
                </div>
             </div>
           );
        })}
        
        {/* AKCIJA - DODAJ PROJEKAT */}
        <div onClick={handleAddSite} className="bg-transparent border-2 border-dashed border-white/5 rounded-[10px] p-6 hover:border-secondary/30 hover:bg-white/[0.02] transition-all cursor-pointer group flex flex-col items-center justify-center min-h-[200px]">
           <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-secondary/10 group-hover:border-secondary/20 transition-all shadow-lg">
              <span className="material-symbols-outlined text-white/50 group-hover:text-secondary text-2xl transition-colors">add</span>
           </div>
           <h3 className="text-[10px] font-black text-white/50 group-hover:text-white uppercase tracking-widest transition-colors mb-1">Novi Projekat</h3>
           <p className="text-[10px] font-medium text-white/30 text-center max-w-[200px]">Pokreni novo gradilište i uvodnu dokumentaciju.</p>
        </div>
      </div>
    </div>
  );
}
