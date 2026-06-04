import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import NicheWidgets from '@/src/modules/dashboard/components/NicheWidgets';
import { getAccommodationLink } from '@/src/lib/routeFilters';
import { useDashboardMetrics } from '@/src/modules/dashboard/hooks/useDashboardStats';
import { DashboardMetrics } from '@/src/modules/dashboard/types';

interface AccommodationDashboardUIProps {
  setIsUpgradeOpen: (val: boolean) => void;
}

const AccommodationDashboardUI = memo(function AccommodationDashboardUI({ setIsUpgradeOpen }: AccommodationDashboardUIProps) {
  const { data } = useDashboardMetrics();
  const roleData = (data as any as Partial<DashboardMetrics>) || {};
  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }}}
      className="flex flex-col gap-12"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 md:p-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-xs font-black text-white uppercase tracking-widest">SMEŠTAJ ZA RADNIKE</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-none tracking-[-0.05em]">KONTROLNA TABLA, <span className="text-secondary">SMEŠTAJ</span></h2>
          <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-12 leading-relaxed">
            PREGLEDAJTE VAŠE KAPACITETE I ODGOVORITE NA UPITE KOMPANIJA.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
            <Link to="/postavi-oglas" className="w-full md:w-auto px-10 py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              POSTAVI OGLAS
            </Link>
            <Link to="/moj-profil/kapaciteti" className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">fact_check</span>
              KAPACITETI
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="lg:col-span-2 space-y-8">
           <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">MOJI OBJEKTI</h2>
                 <Link to="/postavi-oglas" className="bg-secondary text-slate-950 font-black px-6 py-2.5 rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-yellow-400 transition-all">DODAJ NOVI</Link>
              </div>

              <div className="space-y-4">
                 {roleData.recentAds && roleData.recentAds.length > 0 ? roleData.recentAds.map((ad: any, i: number) => {
                   const detailUrl = getAccommodationLink(ad.id);
                   return (
                     <div key={ad.id || `ad-${i}`} className="bg-white/[0.02] border border-white/10 p-5 rounded-[10px] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-white/5 rounded-[10px] overflow-hidden shrink-0 border border-white/5 relative">
                              {ad.images?.[0] || ad.imageStatus === 'processing' ? (
                                <OptimizedImage 
                                  src={ad.images?.[0]} 
                                  fallbackType="accommodation" 
                                  alt="Slika" 
                                  className="w-full h-full object-cover transition-all" 
                                  containerClassName="w-full h-full"
                                  isProcessing={ad.imageStatus === 'processing'}
                                />
                              ) : (
                                <span className="material-symbols-outlined text-white/10 m-auto h-full flex items-center justify-center">image</span>
                              )}
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{ad.title || ad.adTitle || ad.name}</h4>
                              <div className="flex items-center gap-4">
                                 <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-[10px] ${ad.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>{ad.status?.toUpperCase() || 'NA ČEKANJU'}</span>
                                 <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">visibility</span> {ad.viewsCount || 0} PREGLEDA
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-center">
                           <Link to={detailUrl} className="w-10 h-10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/10 rounded-[10px] flex items-center justify-center transition-all" title="Pogledaj na sajtu">
                              <span className="material-symbols-outlined text-xl">open_in_new</span>
                           </Link>
                           <Link to={`/postavi-oglas?edit=true&id=${ad.id}&type=smestaj`} className="w-10 h-10 bg-white/5 text-white/40 hover:text-[#ffad3a] hover:bg-white/10 border border-white/10 rounded-[10px] flex items-center justify-center transition-all" title="Izmeni oglas">
                              <span className="material-symbols-outlined text-xl">edit_note</span>
                           </Link>
                        </div>
                     </div>
                   );
                 }) : (
                   <div className="py-12 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[10px]">
                      <span className="material-symbols-outlined text-white/5 text-5xl mb-3">hotel</span>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Prazno. Postavite vaš prvi smeštaj.</p>
                   </div>
                 )}
              </div>
           </div>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="space-y-8 h-min">
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 text-center text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <div className="text-4xl font-black mb-3 text-[#ffad3a]">{roleData?.totalAds || 0}</div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 text-white mb-8">AKTIVNI KAPACITETI</div>
              <p className="text-[11px] font-bold text-white/30 uppercase leading-relaxed mb-10">Vaši kapaciteti su vidljivi firmama. Redovno ažurirajte status slobodnih mesta za veći broj upita.</p>
              <button onClick={() => setIsUpgradeOpen(true)} className="w-full py-4 bg-white/5 border border-white/10 hover:bg-secondary hover:text-black hover:border-secondary text-white font-black rounded-[10px] text-[10px] tracking-widest uppercase transition-all">VIP PROMOCIJA</button>
            </div>
          </div>
          <NicheWidgets niche="smestaj" roleData={roleData} />
        </motion.div>
      </div>
    </motion.div>
  );
});

export default AccommodationDashboardUI;
