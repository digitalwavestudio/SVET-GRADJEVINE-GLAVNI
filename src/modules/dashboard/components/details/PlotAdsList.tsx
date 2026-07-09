import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { REAL_ESTATE_PURPOSES } from '@/src/constants/taxonomy';
import { MachineAdData } from '../../types/ads';
import { DashboardAdStatusBadge } from './shared/DashboardAdStatusBadge';
import { DashboardAdActions } from './shared/DashboardAdActions';

interface PlotAdsListProps {
  ads: MachineAdData[];
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string, type?: string) => void;
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
                <DashboardAdStatusBadge status={ad.status} />
                
                {ad.plotPurpose && (
                  <span className="bg-white/5 border border-white/10 text-white/70 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full">
                    {REAL_ESTATE_PURPOSES.find(p => p.id === ad.plotPurpose || p.slug === ad.plotPurpose)?.name || ad.plotPurpose}
                  </span>
                )}
                
                {ad.isPremium && <span className="backdrop-blur-sm bg-secondary/20 text-secondary border border-secondary/20 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">hotel_class</span> Premium</span>}
                {ad.isUrgent && <span className="backdrop-blur-sm bg-orange-500/20 text-orange-500 border border-orange-500/20 font-black text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-md flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">bolt</span> Hitno</span>}
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
                <span className="flex items-center gap-2 md:border-l border-white/10 md:pl-6 text-white/70" title="Pregledi">
                  <span className="material-symbols-outlined text-[14px] text-white/40">visibility</span>
                  {ad.viewsCount || 0} PREGLEDA
                </span>
              </div>
            </div>

              <div className="flex flex-col md:flex-row md:items-center justify-stretch md:justify-start gap-2 w-full xl:w-auto mt-4 xl:mt-0 pt-4 xl:pt-0 border-t border-white/5 xl:border-none">
                <DashboardAdActions 
                  ad={ad} 
                  size="md" 
                  collection="real_estate" 
                  onPromote={onPromote} 
                  onApprove={onApprove} 
                  onDelete={onDelete} 
                />
              </div>
          </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}
