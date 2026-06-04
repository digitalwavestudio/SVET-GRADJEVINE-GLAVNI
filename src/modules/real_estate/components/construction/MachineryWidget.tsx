import React from 'react';
import { ResourceStatus } from '@/src/modules/real_estate/components/construction/types';

interface MachineryWidgetProps {
  resources: ResourceStatus[];
  resourcesCost: number;
  updateResource: (id: string, field: keyof ResourceStatus, value: unknown) => Promise<void>;
  handleRemoveResource: (id: string) => Promise<void>;
  handleAddResource: () => void;
}

export function MachineryWidget({
  resources,
  resourcesCost,
  updateResource,
  handleRemoveResource,
  handleAddResource
}: MachineryWidgetProps) {
  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl mt-8">
      {/* SEKCIJA MEHANIZACIJE */}
      <div className="p-6 md:p-8 flex justify-between items-center bg-[#070B0F]/50 border-b border-white/5">
         <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-cyan-400">precision_manufacturing</span>
            <h2 className="text-md lg:text-lg font-black uppercase tracking-widest">
              MEHANIZACIJA NA GRADILIŠTU
            </h2>
         </div>
         <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/60 bg-cyan-400/10 px-3 py-1 rounded-[10px] border border-cyan-400/20">
            DNEVNI TROŠAK: €{resourcesCost.toFixed(0)}
         </div>
      </div>
      
      <div className="flex flex-col">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="col-span-8 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">NAZIV MAŠINE / OPREME</div>
              <div className="col-span-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-center">SATI</div>
              <div className="col-span-2 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-right">UKUPNO</div>
          </div>

          <div className="flex flex-col divide-y divide-white/5 pb-4">
            {resources.map(res => {
              const total = res.amount * res.unitPrice;

              return (
                <div key={res.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 px-6 lg:px-8 py-5 items-center hover:bg-white/[0.02] transition-colors relative group bg-[#0A0F14] lg:bg-transparent rounded-[10px] lg:rounded-none border border-white/5 lg:border-none p-4 lg:p-0 shadow-lg lg:shadow-none mb-4 lg:mb-0 mx-4 lg:mx-0 mt-4 lg:mt-0">
                    
                    {/* NAZIV */}
                    <div className="col-span-1 lg:col-span-8 text-left group">
                       <span className="lg:hidden text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 block">Naziv mašine</span>
                       <div className="relative flex items-center w-full bg-[#131920]/80 border border-white/5 rounded-[10px] overflow-hidden shadow-inner focus-within:border-cyan-400 focus-within:bg-cyan-400/5 transition-all">
                           <div className="pl-3 pr-2 py-2.5 flex items-center justify-center border-r border-white/5 bg-white/[0.01] group-focus-within:bg-cyan-400/10 transition-colors">
                              <button onClick={() => handleRemoveResource(res.id)} className="material-symbols-outlined text-error text-[18px] hover:text-red-400">remove_circle</button>
                           </div>
                           <input 
                              type="text"
                              value={res.name}
                              onChange={(e) => updateResource(res.id, 'name', e.target.value)}
                              placeholder="Npr. Bager Guseničar"
                              className="w-full bg-transparent pl-4 pr-4 py-3 lg:py-2.5 text-xs font-sans font-medium text-white/90 outline-none placeholder:text-white/20 uppercase transition-all"
                           />
                       </div>
                    </div>

                    <div className="col-span-1 lg:col-span-4 grid grid-cols-2 gap-4 pt-4 lg:pt-0 border-t border-white/5 lg:border-none items-center">
                        {/* KOLIČINA / SATI */}
                        <div className="flex justify-start lg:justify-center items-center gap-2">
                            <span className="lg:hidden text-[9px] font-black text-white/30 uppercase tracking-[0.2em] w-12">Sati:</span>
                            <div className="flex items-center bg-[#131920]/80 border border-white/5 rounded-[10px] overflow-hidden shadow-inner focus-within:border-cyan-400 focus-within:bg-cyan-400/5 transition-all w-full max-w-[140px]">
                              <input 
                                  type="number"
                                  value={res.amount}
                                  onChange={(e) => updateResource(res.id, 'amount', Number(e.target.value))}
                                  className="w-full bg-transparent px-3 py-2.5 text-[14px] font-mono font-black text-white outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                        </div>

                        {/* TOTAL */}
                        <div className="flex justify-end items-center">
                            <span className="lg:hidden text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mr-2">Ukupno:</span>
                            <span className="font-mono font-black text-lg lg:text-base tracking-wide lg:text-right text-white">
                                €{total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
              );
            })}

            <button 
              onClick={handleAddResource}
              className="w-full py-6 mt-4 lg:mt-0 text-center hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
                <span className="text-[10px] font-black text-cyan-400/50 group-hover:text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  DODAJ NOVU MAŠINU U OBRAČUN
                </span>
            </button>
          </div>
        </div>
    </div>
  );
}
