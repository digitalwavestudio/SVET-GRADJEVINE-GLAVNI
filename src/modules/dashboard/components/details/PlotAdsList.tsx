import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { REAL_ESTATE_PURPOSES } from '@/src/constants/taxonomy';
import { MachineAdData } from '../../types/ads';

interface PlotAdsListProps {
  ads: MachineAdData[];
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PlotAdsList({ ads, onPromote, onApprove, onDelete }: PlotAdsListProps) {
  if (ads.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 px-2">
        <span className="material-symbols-outlined text-secondary text-2xl">real_estate_agent</span>
        <h2 className="text-lg font-black text-white uppercase tracking-widest">Investicione lokacije i placevi</h2>
        <div className="flex-1 h-px bg-white/10 ml-4"></div>
      </div>
      
      <div className="space-y-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {ads.map((ad) => {
            const isLargeList = ads.length > 20;
            return (
            <motion.div 
              layout={!isLargeList}
              layoutId={!isLargeList ? `ad-card-${ad.id}` : undefined}
              key={ad.id}
              initial={isLargeList ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={isLargeList ? { opacity: 0, transition: { duration: 0.1 } } : { opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
              transition={{ 
                type: "spring",
                stiffness: 280,
                damping: 28,
                mass: 0.8
              }}
              className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center relative group hover:border-white/10 transition-all shadow-xl"
            >
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {ad.status === 'pending' ? (
                  <span className="flex items-center gap-1.5 text-yellow-500 font-black text-[9px] tracking-widest uppercase bg-yellow-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> Na čekanju
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-green-500 font-black text-[9px] tracking-widest uppercase bg-green-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktivan
                  </span>
                )}
                
                {ad.plotPurpose && (
                  <span className="bg-white/5 border border-white/10 text-white/70 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full">
                    {REAL_ESTATE_PURPOSES.find(p => p.id === ad.plotPurpose || p.slug === ad.plotPurpose)?.name || ad.plotPurpose}
                  </span>
                )}
                
                {ad.isPremium && <span className="bg-secondary/20 text-secondary border border-secondary/20 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">hotel_class</span> Premium</span>}
                {ad.isUrgent && <span className="bg-orange-500/20 text-orange-500 border border-orange-500/20 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">bolt</span> Hitno</span>}
              </div>

              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-secondary transition-colors">
                {ad.title || ad.tacnaLokacija || ad.location || 'Oglas bez naslova'}
              </h3>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                {ad.area && (
                  <span className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[14px] text-white/40">aspect_ratio</span>
                    {ad.area} {ad.areaUnit}
                  </span>
                )}
                {ad.price ? (
                  <span className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[14px]">payments</span>
                    {ad.price} EUR
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[14px] text-white/40">payments</span>
                    Po dogovoru
                  </span>
                )}
                {ad.purpose && (
                  <span className="flex items-center gap-2 text-white/70">
                    <span className="material-symbols-outlined text-[14px] text-white/40">category</span>
                    {REAL_ESTATE_PURPOSES.find(p => p.id === ad.purpose || p.slug === ad.purpose)?.name || ad.purpose}
                  </span>
                )}
                <span className="flex items-center gap-2 border-l border-white/10 pl-6 text-white/70" title="Pregledi">
                  <span className="material-symbols-outlined text-[14px] text-white/40">visibility</span>
                  {ad.viewsCount || 0} PREGLEDA
                </span>
              </div>
            </div>

              <div className="flex items-center gap-2 w-full xl:w-auto mt-4 xl:mt-0 pt-4 xl:pt-0 border-t border-white/5 xl:border-none">
                <>
                  <button onClick={() => onPromote(ad.id, 'real_estate', false)} className={`w-12 h-12 rounded-[10px] flex items-center justify-center transition-all ${ad.isPremium ? 'bg-secondary text-slate-950 font-bold' : 'bg-white/5 text-secondary hover:bg-secondary hover:text-slate-950'}`} title={ad.isPremium ? 'Premium oglas' : 'Izdvoj kao Premium'}>
                    <span className="material-symbols-outlined text-xl" style={ad.isPremium ? { fontVariationSettings: "'FILL' 1" } : {}}>hotel_class</span>
                  </button>
                  <button onClick={() => onPromote(ad.id, 'real_estate', true)} className={`w-12 h-12 rounded-[10px] flex items-center justify-center transition-all ${ad.isUrgent ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-orange-500 hover:bg-orange-500 hover:text-white'}`} title={ad.isUrgent ? 'Hitno' : 'Označi kao Hitno'}>
                    <span className="material-symbols-outlined text-xl" style={ad.isUrgent ? { fontVariationSettings: "'FILL' 1" } : {}}>bolt</span>
                  </button>
                </>
              <Link to={`/postavi-oglas?type=plac&edit=${ad.id}`} className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all xl:flex-none" title="Izmeni plac">
                <span className="material-symbols-outlined text-xl">edit</span>
              </Link>
              {ad.status === 'pending' && (
                <button onClick={() => onApprove(ad.id)} className="w-12 h-12 rounded-[10px] bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)] xl:flex-none" title="Aktiviraj (Simulacija uplate)">
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                </button>
              )}
              <button onClick={() => onDelete(ad.id)} className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center hover:bg-error hover:text-white transition-all xl:flex-none" title="Obriši plac">
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}
