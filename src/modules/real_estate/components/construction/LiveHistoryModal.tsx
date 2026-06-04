import { motion } from 'motion/react';
import React from 'react';

// You might need to import or move some types
interface LiveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveHistoryModal = React.memo(function LiveHistoryModal({ isOpen, onClose }: LiveHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-end bg-[#030507]/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        className="w-full max-w-md h-full bg-[#0A0F14] border-l border-white/10 shadow-2xl relative flex flex-col"
      >
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 relative z-20">
          <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                  SVI LIVE DOGAĐAJI
              </h3>
              <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase mt-1">Kompletna istorija dešavanja</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-[10px] p-2 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="relative pl-5 space-y-8 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/10 z-10">
              {[
                { id: 1, time: '10:45', action: 'Zastoj mehanizacije', desc: 'Bager guseničar (CAT) prijavio kvar, čeka se mobilni servis.', site: 'KUĆA NA VRAČARU', color: 'text-red-500', bg: 'bg-red-500', alert: true },
                { id: 2, time: '09:20', action: 'Isporuka resursa', desc: '15 m3 Betona MB30 stiglo, potpisana isporuka od strane šefa gradilišta.', site: 'BEOGRAD NA VODI', color: 'text-cyan-400', bg: 'bg-cyan-400' },
                { id: 3, time: '08:05', action: 'Prijava radnika', desc: 'Druga smena (6 radnika) uspešno prijavljena preko digitalnog dnevnika.', site: 'BEOGRAD NA VODI', color: 'text-white/60', bg: 'bg-white/60' },
                { id: 4, time: '07:30', action: 'Dnevnik otvoren', desc: 'Sva gradilišta aktivirana za novi radni dan, nema registrovanih kašnjenja.', site: 'GLOBALNI SISTEM', color: 'text-green-500', bg: 'bg-green-500' },
                { id: 5, time: 'Danas, 06:15', action: 'Obilazak terena', desc: 'Noćni čuvar predao smenu bez uočenih nepravilnosti.', site: 'BEOGRAD NA VODI', color: 'text-white/40', bg: 'bg-white/20' },
                { id: 6, time: 'Juče, 17:00', action: 'Zatvaranje dnevnika', desc: 'Sva gradilišta zaključena. Sva lica uspešno napustila teren.', site: 'GLOBALNI SISTEM', color: 'text-white/40', bg: 'bg-white/20' },
                { id: 7, time: 'Juče, 14:20', action: 'Nadzor inspekcije', desc: 'Rutinska provera od strane nadzornog organa. Sve mere bezbednosti na najvišem nivou.', site: 'KUĆA NA VRAČARU', color: 'text-secondary', bg: 'bg-secondary' },
                { id: 8, time: 'Juče, 10:10', action: 'Vanredna isporuka', desc: 'Dodatni građevinski resursi dopremljeni ranije usled dobrih vremenskih uslova.', site: 'BEOGRAD NA VODI', color: 'text-white/40', bg: 'bg-white/20' },
              ].map((item) => (
                <div key={item.id} className="relative z-10 group">
                    <div className={`absolute -left-[24px] top-1.5 w-2.5 h-2.5 rounded-full ${item.bg} ring-4 ring-[#0A0F14] group-hover:scale-125 transition-transform`}></div>
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
        </div>
      </motion.div>
    </motion.div>
  );
});
