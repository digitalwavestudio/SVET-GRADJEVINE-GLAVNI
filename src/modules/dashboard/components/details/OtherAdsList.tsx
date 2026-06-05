import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { MachineAdData } from '../../types/ads';
import { DashboardAdStatusBadge } from './shared/DashboardAdStatusBadge';
import { DashboardAdActions } from './shared/DashboardAdActions';

interface OtherAdsListProps {
  ads: MachineAdData[];
  showTitle?: boolean;
  onPromote: (id: string, collection: string, isUrgentCheck: boolean) => void;
  onApprove: (id: string) => void;
  onDelete: (id: string) => void;
}

export function OtherAdsList({ ads, showTitle = true, onPromote, onApprove, onDelete }: OtherAdsListProps) {
  if (ads.length === 0) return null;

  return (
    <div>
      {showTitle && (
        <div className="flex items-center gap-3 mb-6 px-2 mt-8">
          <span className="material-symbols-outlined text-white/40 text-2xl">list_alt</span>
          <h2 className="text-lg font-black text-white/60 uppercase tracking-widest">Ostali oglasi</h2>
          <div className="flex-1 h-px bg-white/10 ml-4"></div>
        </div>
      )}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-white/[0.01]">
          <div className="grid grid-cols-6 gap-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
            <div className="col-span-2">NASLOV I TIP</div>
            <div>STATUS</div>
            <div>PREGLEDI</div>
            <div>PRIJAVE / UPITI</div>
            <div className="text-right">AKCIJE</div>
          </div>
        </div>
        
        <div className="divide-y divide-white/5">
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
                className="p-8 grid grid-cols-6 gap-4 items-center hover:bg-white/[0.02] transition-all group"
              >
              <div className="col-span-2 flex items-center gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-[10px] flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-secondary/30 transition-all font-black text-white/20 text-xl group-hover:bg-secondary/10 group-hover:text-secondary shrink-0">
                  {ad.logo ? (
                    <OptimizedImage 
                      src={ad.logo} 
                      fallbackType="company" 
                      alt="Logo" 
                      className="w-full h-full object-cover" 
                      containerClassName="w-full h-full"
                    />
                  ) : (
                    (ad.title || ad.adTitle || ad.name)?.charAt(0) || 'O'
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 group-hover:text-secondary transition-colors truncate">{ad.title || ad.adTitle || ad.name}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{ad.typeLabel}</p>
                    {ad.collName === 'companies' && (
                      <div className="flex items-center gap-1.5">
                        {((ad.portfolioImages?.length ?? 0) > 0 || (ad.references?.length ?? 0) > 0 || (ad.licenses?.length ?? 0) > 0 || (ad.certifications?.length ?? 0) > 0) && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-tight" title="Proširen B2B profil">
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>corporate_fare</span>
                            Enriched
                          </span>
                        )}
                        {(ad.portfolioImages?.length ?? 0) > 0 && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/10 border border-secondary/20 rounded text-[8px] font-black text-secondary uppercase tracking-tight">
                            <span className="material-symbols-outlined text-[10px]">photo_library</span>
                            {ad.portfolioImages?.length}
                          </span>
                        )}
                      </div>
                    )}
                    {ad.collName === 'accommodations' && (
                      <div className="flex items-center gap-1.5">
                        {(ad.invoiceAvailable || ad.parkingAvailable || ad.truckAccess) && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase tracking-tight" title="B2B Smeštaj">
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>business_center</span>
                            B2B Ready
                          </span>
                        )}
                      </div>
                    )}
                    {ad.collName === 'catering' && (
                      <div className="flex items-center gap-1.5">
                        {(ad.invoiceAvailable || ad.haccpCertified || ad.packagingIncluded || (ad.dailyCapacityMeals ?? 0) > 0) && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black text-orange-400 uppercase tracking-tight" title="B2B Ketering">
                            <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                            B2B Ready
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <DashboardAdStatusBadge status={ad.status} />
              </div>
              
              <div className="text-sm font-black text-white tracking-tighter">
                {ad.viewsCount || 0}
              </div>

              <div className="text-sm font-black text-white tracking-tighter">
                {ad.applicantsCount || 0}
              </div>
              
                <div className="text-right flex justify-end gap-3">
                {ad.collName === 'companies' && (
                  <Link 
                    to={`/firma/${ad.id}`} 
                    className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"
                    title="Pogledaj profil"
                  >
                    <span className="material-symbols-outlined text-lg">visibility</span>
                  </Link>
                )}
                  
                  <DashboardAdActions 
                    ad={ad} 
                    size="sm" 
                    collection={ad.collName || ''} 
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
    </div>
  );
}
