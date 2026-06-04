import React from 'react';
import { ResourceStatus } from '@/src/modules/real_estate/components/construction/types';

interface ZonePlanAndNotesWidgetProps {
  activeCount: number;
  activeResourcesArray: ResourceStatus[];
  localDiaryText: string;
  handleDiaryChange: (value: string) => void;
}

export function ZonePlanAndNotesWidget({
  activeCount,
  activeResourcesArray,
  localDiaryText,
  handleDiaryChange
}: ZonePlanAndNotesWidgetProps) {
  return (
    <div className="bg-[#0A0F14] border-t-8 border-[#070B0F]">
         <div className="p-6 md:p-8 flex justify-between items-center bg-[#0A0F14]">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-green-400">landscape</span>
               <h2 className="text-md lg:text-lg font-black uppercase tracking-widest text-white">
                 ZONA GRADILIŠTA / STANJE
               </h2>
             </div>
             <div className="flex items-center gap-4">
                 {/* Kratka dnevna statistika */}
                 <div className="hidden lg:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest bg-[#131920]/80 border border-white/5 px-4 py-2 rounded-[10px] text-white/50">
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-[14px]">engineering</span> {activeCount} Radnika</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-cyan-400 text-[14px]">precision_manufacturing</span> {activeResourcesArray.filter(r=>r.type === 'MEHANIZACIJA').length} Mašina</span>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 border-t border-white/5 relative">
              
              {/* SLIKA PLANA */}
              <div className="bg-[#0A0F14] p-6 lg:p-8 flex flex-col min-h-[400px]">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">map</span>
                      NACRT TERENA
                  </span>
                  <div className="flex-1 w-full bg-[#131920]/50 border-2 border-dashed border-white/10 hover:border-green-400/30 transition-colors rounded-[10px] flex flex-col items-center justify-center cursor-pointer group">
                      <span className="material-symbols-outlined text-4xl text-white/10 group-hover:text-green-400/50 mb-4 transition-colors">add_photo_alternate</span>
                      <span className="text-[11px] font-black text-white/40 uppercase tracking-widest text-center px-8">Klikni da ubaciš sliku mape<br/>ili plana gradilišta</span>
                  </div>
              </div>

              {/* LIČNE BELEŠKE */}
              <div className="bg-[#0A0F14] p-6 lg:p-8 flex flex-col">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                      DNEVNIK RADOVA / BELEŠKE
                  </span>
                  <div className="flex-1 w-full relative">
                      <textarea 
                          value={localDiaryText}
                          onChange={(e) => handleDiaryChange(e.target.value)}
                          placeholder="Upiši podsetnike, najave isporuka, upozorenja za resurse..."
                          className="w-full h-full min-h-[300px] bg-[#131920]/80 border border-white/5 rounded-[10px] p-6 text-sm font-sans font-medium text-white/80 placeholder:text-white/20 outline-none focus:border-green-400/50 focus:bg-green-400/5 transition-all resize-none shadow-inner"
                      ></textarea>
                      <div className="absolute bottom-6 right-6">
                          <span className="material-symbols-outlined text-white/10 text-4xl pointer-events-none">edit_document</span>
                      </div>
                  </div>
              </div>

          </div>
    </div>
  );
}
