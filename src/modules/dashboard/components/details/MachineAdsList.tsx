import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { FUEL_TYPES } from '@/src/constants/machineTaxonomy';
import { MachineAdData } from '../../types/ads';

interface MachineAdsListProps {
  ads: MachineAdData[];
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
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
                      {ad.status === 'pending' ? (
                        <span className="flex items-center gap-1.5 text-yellow-500 font-black text-[9px] tracking-widest uppercase bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                          <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"></span> Na čekanju
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-green-500 font-black text-[9px] tracking-widest uppercase bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                          <span className="w-1 h-1 rounded-full bg-green-500"></span> Aktivan
                        </span>
                      )}
                      {ad.isPremium && <span className="bg-white/10 text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border border-white/10 flex items-center gap-1"><span className="material-symbols-outlined text-[10px] text-[#ffad3a]">star</span> Premium</span>}
                      {ad.isUrgent && <span className="bg-orange-500/20 text-orange-500 font-black text-[9px] tracking-widest uppercase px-3 py-1 rounded-full border border-orange-500/20 flex items-center gap-1"><span className="material-symbols-outlined text-[10px]">bolt</span> Hitno</span>}
                    </div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight group-hover:text-[#ffad3a] transition-colors">{ad.adTitle || ad.title}</h3>
                    <p className="text-[10px] font-black text-[#a2acb9] tracking-widest uppercase mt-1">{ad.manufacturer || ad.brand} • {ad.modelstr || ad.model || 'N/A'}</p>
                  </div>
                  <div className="text-right">
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
                    <div className="flex gap-8">
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
                      
                      <Link 
                        to={`/postavi-oglas?type=machine&edit=${ad.id}`}
                        className="flex-1 md:flex-none h-12 px-6 bg-[#ffad3a]/10 border border-[#ffad3a]/20 rounded-[10px] flex items-center justify-center text-[10px] font-black text-[#ffad3a] uppercase tracking-widest hover:bg-[#ffad3a] hover:text-black transition-all gap-2 shadow-lg shadow-[#ffad3a]/10"
                      >
                        <span className="material-symbols-outlined text-base">edit_note</span>
                        IZMENI
                      </Link>

                      <button 
                        onClick={() => onPromote(ad.id, 'machines', false)}
                        className={`h-12 w-12 rounded-[10px] flex items-center justify-center transition-all ${ad.isPremium ? 'bg-secondary text-slate-950 font-bold' : 'bg-white/5 text-secondary border border-white/10 hover:bg-secondary hover:border-secondary hover:text-slate-950'}`}
                        title={ad.isPremium ? 'Premium oglas' : 'Izdvoj kao Premium'}
                      >
                        <span className="material-symbols-outlined text-xl" style={ad.isPremium ? { fontVariationSettings: "'FILL' 1" } : {}}>hotel_class</span>
                      </button>
                      
                      <button 
                        onClick={() => onPromote(ad.id, 'machines', true)}
                        className={`h-12 w-12 rounded-[10px] flex items-center justify-center transition-all ${ad.isUrgent ? 'bg-orange-500 border border-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-white/5 border border-white/10 text-orange-500 hover:bg-orange-500 hover:border-orange-500 hover:text-white'}`}
                        title={ad.isUrgent ? 'Hitno' : 'Označi kao Hitno'}
                      >
                        <span className="material-symbols-outlined text-xl" style={ad.isUrgent ? { fontVariationSettings: "'FILL' 1" } : {}}>bolt</span>
                      </button>

                      {ad.status === 'pending' && (
                        <button 
                          onClick={() => onApprove(ad.id)}
                          className="h-12 w-12 bg-green-500/10 border border-green-500/20 rounded-[10px] flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm shadow-green-500/10"
                          title="Aktiviraj (Simulacija)"
                        >
                          <span className="material-symbols-outlined text-xl">check_circle</span>
                        </button>
                      )}

                      <button 
                        onClick={() => onDelete(ad.id)}
                        className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-[10px] flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/10"
                      >
                        <span className="material-symbols-outlined text-xl">delete_sweep</span>
                      </button>
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
