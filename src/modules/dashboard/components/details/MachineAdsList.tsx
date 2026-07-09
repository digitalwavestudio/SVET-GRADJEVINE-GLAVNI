import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FUEL_TYPES } from '@/src/constants/machineTaxonomy';
import { MachineAdData } from '../../types/ads';
import { DashboardAdStatusBadge } from './shared/DashboardAdStatusBadge';
import { DashboardAdActions } from './shared/DashboardAdActions';

interface MachineAdsListProps {
  ads: MachineAdData[];
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string, type?: string) => void;
}

export function MachineAdsList({ ads, onPromote, onApprove, onDelete }: MachineAdsListProps) {
  if (ads.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-2">
        <span className="material-symbols-outlined text-[#ffad3a] text-2xl">precision_manufacturing</span>
        <h2 className="text-lg font-black text-white uppercase tracking-widest">Mašine i Transport</h2>
        <div className="flex-1 h-px bg-white/10 ml-4"></div>
        <span className="text-[10px] font-black text-[#ffad3a] tracking-widest uppercase">{ads.length} OBJAVA</span>
      </div>

      <div className="grid grid-cols-1 gap-6">
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
              className="bg-[#13212e] border border-white/5 rounded-[10px] overflow-hidden flex flex-col xl:flex-row shadow-2xl hover:border-[#ffad3a]/30 transition-all group"
            >
              {/* Image Thumbnail */}
              <div className="w-full xl:w-72 h-48 xl:h-auto bg-[#050f19] relative shrink-0">
                {ad.images?.[0] ? (
                  <OptimizedImage 
                    src={ad.images[0]} 
                    fallbackType="machine" 
                    alt={ad.adTitle || ad.title || 'Mašina'} 
                    className="w-full h-full object-cover" 
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 capitalize text-4xl italic font-headline text-white">
                    {ad.manufacturer?.charAt(0) || 'M'}
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-[10px] text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${ad.adType === 'prodaja' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-[#ffad3a]/20 text-[#ffad3a] border-[#ffad3a]/30'}`}>
                    {ad.adType || 'Mašina'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <DashboardAdStatusBadge status={ad.status} />
                      {ad.isPremium && <span className="backdrop-blur-sm bg-white/10 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-md border border-white/10 flex items-center gap-1"><span className="material-symbols-outlined text-[10px] text-[#ffad3a]">star</span> Premium</span>}
                      {ad.isUrgent && <span className="backdrop-blur-sm bg-orange-500/20 text-orange-500 font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-md border border-orange-500/20 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">bolt</span> Hitno</span>}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#ffad3a] transition-colors">{ad.adTitle || ad.title}</h3>
                    <p className="text-[10px] font-black text-[#a2acb9] tracking-widest uppercase mt-1">{ad.manufacturer || ad.brand} • {ad.modelstr || ad.model || 'N/A'}</p>
                  </div>
                  <div className="text-left md:text-right mt-2 md:mt-0">
                      <div className="text-[10px] font-black text-[#a2acb9] tracking-widest uppercase mb-1">CENA</div>
                      <div className="text-2xl font-black text-[#ffad3a] tracking-tighter">
                        {ad.price ? `€${Number(ad.price).toLocaleString()}` : (ad.pricePerDay ? `€${ad.pricePerDay}/dan` : 'NA UPIT')}
                      </div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-[#050f19] p-4 rounded-[10px] border border-white/5">
                      <div className="text-[8px] font-black text-[#a2acb9] tracking-[0.2em] mb-1 uppercase">Godište</div>
                      <div className="text-xs font-black text-white uppercase tracking-widest">{ad.year || 'N/A'}</div>
                    </div>
                    <div className="bg-[#050f19] p-4 rounded-[10px] border border-white/5">
                      <div className="text-[8px] font-black text-[#a2acb9] tracking-[0.2em] mb-1 uppercase">Radni sati</div>
                      <div className="text-xs font-black text-white uppercase tracking-widest">{ad.workingHours ? `${ad.workingHours} h` : 'N/A'}</div>
                    </div>
                    <div className="bg-[#050f19] p-4 rounded-[10px] border border-white/5">
                      <div className="text-[8px] font-black text-[#a2acb9] tracking-[0.2em] mb-1 uppercase">Gorivo</div>
                      <div className="text-xs font-black text-white uppercase tracking-widest truncate">
                        {FUEL_TYPES.find(f => f.id === (ad.fuelType || ad.machFuel) || f.slug === (ad.fuelType || ad.machFuel))?.name || (ad.fuelType || ad.machFuel) || 'N/A'}
                      </div>
                    </div>
                    <div className="bg-[#050f19] p-4 rounded-[10px] border border-white/5">
                      <div className="text-[8px] font-black text-[#a2acb9] tracking-[0.2em] mb-1 uppercase">Snaga</div>
                      <div className="text-xs font-black text-white uppercase tracking-widest">{ad.powerKw ? `${ad.powerKw} kW` : 'N/A'}</div>
                    </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-6 border-t border-white/5">
                    <div className="flex justify-between md:justify-start w-full md:w-auto gap-8">
                      <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#a2acb9] text-xl opacity-40">visibility</span>
                          <div>
                            <div className="text-[8px] font-black text-[#a2acb9] tracking-widest uppercase">Prikaza</div>
                            <div className="text-sm font-black text-white tracking-tighter">{ad.viewsCount || 0}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[#a2acb9] text-xl opacity-40">mark_email_unread</span>
                          <div>
                            <div className="text-[8px] font-black text-[#a2acb9] tracking-widest uppercase">Upita</div>
                            <div className="text-sm font-black text-white tracking-tighter">{ad.applicantsCount || ad.appCount || 0}</div>
                          </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Link 
                        to={`/gradjevinske-masine/${ad.id}`}
                        className="flex-1 md:flex-none h-12 px-6 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all gap-2"
                      >
                        <span className="material-symbols-outlined text-base">pageview</span>
                        PREGLED
                      </Link>
                      
                      <DashboardAdActions 
                        ad={ad} 
                        size="md" 
                        collection="machines" 
                        onPromote={onPromote} 
                        onApprove={onApprove} 
                        onDelete={onDelete} 
                      />
                    </div>
                  </div>
              </div>
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
