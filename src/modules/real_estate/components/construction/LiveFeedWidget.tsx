import React from 'react';

interface LiveFeedWidgetProps {
  setIsHistoryModalOpen: (open: boolean) => void;
}

export function LiveFeedWidget({ setIsHistoryModalOpen }: LiveFeedWidgetProps) {
  return (
    <div className="w-full xl:w-[40%] 2xl:w-[35%] bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-8 flex flex-col relative h-fit shadow-2xl shrink-0">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/5 blur-3xl rounded-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 relative z-10 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
          <h2 className="text-sm font-black uppercase tracking-widest text-white">LIVE TEREN</h2>
        </div>
        <span className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase border border-white/10 px-2 py-1 rounded bg-[#131920]">Danas</span>
      </div>

      <div className="mb-8 relative z-20">
         <div className="bg-[#070B0F] border border-white/10 rounded-[10px] p-4 focus-within:border-secondary/50 focus-within:shadow-[0_0_15px_rgba(255,204,0,0.1)] transition-all flex flex-col gap-3">
            <textarea 
              rows={2} 
              placeholder="Napiši brzi izveštaj sa gradilišta..."
              className="bg-transparent border-none outline-none text-xs text-white/80 placeholder:text-white/30 resize-none font-sans"
            ></textarea>
            <div className="flex justify-between items-center border-t border-white/5 pt-3">
               <div className="flex gap-2">
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-colors tooltip-target" title="Zakači fotografiju">
                    <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                 </button>
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-red-500 transition-colors tooltip-target" title="Prijavi Hitnost / Problem">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                 </button>
                 <button className="w-7 h-7 rounded-[10px] hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-green-500 transition-colors tooltip-target" title="Prijavi isporuku">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                 </button>
               </div>
               <button className="px-4 py-1.5 bg-secondary/10 hover:bg-secondary text-secondary hover:text-slate-900 border border-secondary/20 rounded-[10px] text-[9px] font-black uppercase tracking-widest transition-all">
                  OBJAVI
               </button>
            </div>
         </div>
      </div>

      <div className="relative pl-5 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10 z-10">
         {[
            { id: 1, time: '10:45', action: 'Zastoj mehanizacije', desc: 'Bager guseničar (CAT) prijavio kvar, čeka se mobilni servis.', site: 'KUĆA NA VRAČARU', color: 'text-red-500', bg: 'bg-red-500', alert: true },
            { id: 2, time: '09:20', action: 'Isporuka betona', desc: '15 m3 Betona MB30 stiglo, potpisana isporuka od strane šefa gradilišta.', site: 'BEOGRAD NA VODI', color: 'text-cyan-400', bg: 'bg-cyan-400' },
            { id: 3, time: '08:05', action: 'Prijava radnika', desc: 'Druga smena (6 radnika) uspešno prijavljena preko digitalnog dnevnika.', site: 'BEOGRAD NA VODI', color: 'text-white/60', bg: 'bg-white/60' },
            { id: 4, time: '07:30', action: 'Dnevnik otvoren', desc: 'Sva gradilišta aktivirana za novi radni dan, nema registrovanih kašnjenja.', site: 'GLOBALNI SISTEM', color: 'text-green-500', bg: 'bg-green-500' },
         ].map((item) => (
            <div key={item.id} className="relative z-10 group">
               {/* Bullet */}
               <div className={`absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full ${item.bg} ring-4 ring-[#0A0F14] group-hover:scale-125 transition-transform`}></div>
               
               {/* Content */}
               <div className="flex flex-col gap-1.5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors p-3 rounded-[10px] border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-mono font-bold text-white/40">{item.time}</span>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.action}</span>
                     {item.alert && <span className="bg-red-500/10 text-red-500 text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest border border-red-500/20">HITNO</span>}
                  </div>
                  <span className="text-xs font-sans font-medium text-white/80 leading-relaxed pr-2">{item.desc}</span>
                  <span className="text-[9px] font-bold text-white/30 flex items-center gap-1 mt-1 uppercase tracking-wider">
                     <span className="material-symbols-outlined text-[10px]">location_on</span> {item.site}
                  </span>
               </div>
            </div>
         ))}
      </div>
      
      <button 
          onClick={() => setIsHistoryModalOpen(true)}
          className="w-full mt-6 bg-transparent border border-white/5 hover:border-white/20 text-white/50 hover:text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-[10px] transition-all flex items-center justify-center gap-2 z-10 cursor-pointer"
      >
          UČITAJ SVE REKORDE
      </button>
    </div>
  );
}
