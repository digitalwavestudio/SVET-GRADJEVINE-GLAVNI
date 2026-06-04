import React, { memo, useState, Suspense, lazy, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ActivityFeed from '@/src/modules/dashboard/components/ActivityFeed';
import DashboardGuard from '@/src/modules/dashboard/components/dashboard/DashboardGuard';
import { useDashboardMetrics, useDashboardTrends } from '@/src/modules/dashboard/hooks/useDashboardStats';
import ChartSkeleton from '@/src/modules/dashboard/components/dashboard/ChartSkeleton';
import { SiteLogisticsPlanner } from '@/src/modules/dashboard/components/dashboard/SiteLogisticsPlanner';
import { AvailabilityManager } from '@/src/modules/dashboard/components/dashboard/AvailabilityManager';
import { SyncIndicator } from '@/src/modules/dashboard/components/dashboard/SyncIndicator';
import { RecentAd, DashboardMetrics, ChartTrendData } from '../../types';

const DashboardCharts = lazy(() => import('@/src/modules/dashboard/components/DashboardCharts'));
const PaymentInstructionsModal = lazy(() => import('@/src/modules/ads/components/ads/PaymentInstructionsModal').then(module => ({ default: module.PaymentInstructionsModal })));

const EmployerDashboardUI = memo(function EmployerDashboardUI() {
  const { data: statsData } = useDashboardMetrics();
  const { data: trends = [] } = useDashboardTrends();
  const [selectedAdForPayment, setSelectedAdForPayment] = useState<RecentAd | null>(null);

  const recentAds: RecentAd[] = Array.isArray(statsData?.recentAds) 
    ? statsData.recentAds.map((ad) => ({
        id: ad.id,
        title: ad.title,
        status: ad.status || "active",
        applicantsCount: (ad as { applicantsCount?: number }).applicantsCount ?? 0,
        type: ad.postType,
        createdAt: ad.createdAt ? String(ad.createdAt) : undefined,
      }) as RecentAd)
    : [];
  const activeMetrics = (statsData as unknown as Partial<DashboardMetrics>) || ({} as Partial<DashboardMetrics>);
  const charts = { dailyAnalytics: Array.isArray(trends) ? (trends as ChartTrendData[]) : [] };

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: recentAds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 85, // estimate height of ad card
    overscan: 5,
  });

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
            <span className="text-xs font-black text-white uppercase tracking-widest">SISTEM AKTIVAN</span>
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-none tracking-[-0.05em]">DOBRO VEČE, <span className="text-secondary">KOMANDNI CENTAR</span></h2>
          <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-12 leading-relaxed">
            EVO KRATKOG PRESEKA UČINKA VAŠIH OGLASA ZA DANAS.
          </p>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
            <Link to="/postavi-oglas" className="w-full md:w-auto px-10 py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              POSTAVI OGLAS
            </Link>
            <Link to="/poslovi" className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">explore</span>
              POGLEDAJ SVE OGLASE
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="flex items-center gap-4">
        <h3 className="text-2xl font-black text-white uppercase tracking-tight">LOGISTIKA & OPERATIVA</h3>
        <div className="h-px flex-1 bg-white/5"></div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}}>
        <DashboardGuard variant="inline" title="Greška u Logističkom planeru">
          <SiteLogisticsPlanner recentAds={recentAds} />
        </DashboardGuard>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}}>
        <DashboardGuard variant="inline" title="Greška u kalendaru dostupnosti">
          <AvailabilityManager />
        </DashboardGuard>
      </motion.div>

      <div className="space-y-8">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="flex items-center gap-4 mt-8">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">MOJI OGLASI & POSLOVI</h3>
          <div className="h-px flex-1 bg-white/5"></div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="lg:col-span-2 space-y-8">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 flex flex-col min-h-[450px]">
              <div className="flex justify-between items-center mb-10 shrink-0">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">NAJNOVIJI OGLASI (LIMIT 5)</h4>
                {!statsData && (
                  <span className="text-[8px] font-black text-orange-400 bg-orange-400/5 border border-orange-400/10 px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                    PODACI PRIVREMENO OGRANIČENI
                  </span>
                )}
              </div>

              {recentAds === undefined || recentAds === null ? (
                <div className="bg-white/[0.01] border border-dashed border-white/5 rounded-[10px] p-12 text-center flex flex-col items-center gap-4">
                  <span className="material-symbols-outlined text-white/10 text-4xl">cloud_off</span>
                  <div className="space-y-1">
                    <h5 className="text-white/60 text-xs font-black uppercase tracking-wider">Spisak oglasa je privremeno nedostupan</h5>
                    <p className="text-white/20 text-[9px] uppercase tracking-widest max-w-xs mx-auto">Sistem je parcijalno uspeo da učita profil, ali ne i listu oglasa.</p>
                  </div>
                </div>
              ) : recentAds.length > 0 ? (
                <div ref={parentRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-2">
                  <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const ad = recentAds[virtualItem.index];
                      return (
                        <div 
                          key={virtualItem.key}
                          className="py-2"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[10px] flex justify-between items-center group/ad h-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-black text-sm uppercase tracking-tight group-hover/ad:text-secondary transition-colors truncate pr-2">{ad.title || ad.name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-white/40 uppercase shrink-0">PRIJAVE: {ad.applicantsCount || 0}</span>
                                <span className="text-white/20 text-[8px] shrink-0">•</span>
                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${
                                  ad.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                  ad.status === 'pending_payment' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                  ad.status === 'pending' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  ad.status === 'expired' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                  'bg-white/5 text-white/40'
                                }`}>
                                  {ad.status === 'active' ? 'AKTIVAN' :
                                  ad.status === 'pending_payment' ? 'ČEKA UPLATU' :
                                  ad.status === 'pending' ? 'MODERACIJA' :
                                  ad.status === 'expired' ? 'ISTEKAO' :
                                  ad.status === 'rejected' ? 'ODBIJEN' : ad.status}
                                </div>
                                {ad.status === 'active' && (
                                  <>
                                    <span className="text-white/20 text-[8px] shrink-0">•</span>
                                    <SyncIndicator adId={ad.id} category={ad.category || ad.type || 'listings'} />
                                    
                                    {ad.health && ad.health.status === 'poor' && (
                                      <div className="ml-2 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 animate-pulse group/tip relative">
                                        <span className="material-symbols-outlined text-[10px] text-red-500">warning</span>
                                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap">Potrebnija pažnja</span>
                                        
                                        {/* AI Optimization Tip Tooltip */}
                                        {ad.health.suggestion && (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none">
                                            <div className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                              <span className="material-symbols-outlined text-[10px]">psychology</span>
                                              AI SAVET ZA OPTIMIZACIJU
                                            </div>
                                            <p className="text-[10px] text-white/70 font-medium leading-relaxed italic">
                                              "{ad.health.suggestion}"
                                            </p>
                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-white/10 rotate-45"></div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              {ad.status === 'pending_payment' && (
                                <button 
                                  onClick={() => setSelectedAdForPayment(ad)}
                                  className="px-4 py-2 bg-orange-500 text-slate-950 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-orange-400 transition-colors flex items-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                  UPLATI
                                </button>
                              )}
                              <Link to={`/poslovi/${ad.id}`} className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined text-xl">open_in_new</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative shadow-2xl">
                    <div className="absolute inset-0 border border-secondary/20 rounded-full animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-3xl text-secondary">campaign</span>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest">NEMA AKTIVNIH OGLASA</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">
                      KREIRAJTE SVOJ PRVI OGLAS KAKO BI PRIVUKLI NOVE KANDIDATE.
                    </p>
                  </div>
                  <Link to="/postavi-oglas" className="mt-2 bg-secondary text-slate-950 text-[9px] font-black uppercase tracking-widest px-8 py-4 rounded-[10px] transition-all shadow-xl shadow-secondary/20 hover:bg-yellow-400 relative z-10">
                    KREIRAJ OGLAS SADA
                  </Link>
                </div>
              )}
            </div>
            
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">STATISTIKA POSETA OGLASIMA</h4>
                {!charts?.dailyAnalytics && (
                  <span className="text-[9px] font-black text-[#FEBF0D]/75 bg-[#FEBF0D]/5 border border-[#FEBF0D]/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                    Podaci o posetama su privremeno nedostupni
                  </span>
                )}
              </div>
              <DashboardGuard variant="inline" title="Greška u grafikonu poseta">
                <Suspense fallback={<ChartSkeleton />}>
                  <DashboardCharts data={charts?.dailyAnalytics?.map(d => ({
                    name: d.date,
                    prijave: d.applications,
                    pregledi: d.views
                  }))} />
                </Suspense>
              </DashboardGuard>
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="space-y-6">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group hover:border-secondary/30 transition-all">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">VAŠI OGLASI</div>
               <div className="text-5xl font-black text-white tracking-tighter mb-2 group-hover:text-secondary transition-colors">
                 {activeMetrics?.totalAds !== undefined ? activeMetrics.totalAds : "N/A"}
               </div>
               {activeMetrics?.totalAds === undefined && (
                 <div className="text-[8px] font-bold text-[#FEBF0D]/80 uppercase mt-1 tracking-wider">Sistemske metrike privremeno nedostupne</div>
               )}
               <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">UKUPAN BROJ OBJAVA</div>
            </div>

            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group hover:border-emerald-500/30 transition-all">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">AKTIVNI PAKET</div>
               <div className="text-3xl font-black text-emerald-400 tracking-tight uppercase mb-2">
                 {activeMetrics?.activePackage || "Nema paketa"}
               </div>
               {!activeMetrics && (
                 <div className="text-[8px] font-bold text-emerald-400/80 uppercase mt-1 tracking-wider">BFF podaci o finansijama su ograničeni</div>
               )}
               <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                 {activeMetrics?.packageExpiry ? "SISTEM LIMITIRAN DO REVIZIJE" : "PREMIUM PROMOCIJE"}
               </div>
            </div>

            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group hover:border-purple-400/30 transition-all">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">PREMIUM OGLASI</div>
               <div className="text-5xl font-black text-purple-400 tracking-tighter mb-2">
                 {activeMetrics?.premiumAdsCount !== undefined ? activeMetrics.premiumAdsCount : "0"}
               </div>
               <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">KUPLJENI PREMIUM ARTIKLI</div>
            </div>

            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group hover:border-amber-500/30 transition-all">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">INVESTIRANO u PROMOCIJU</div>
               <div className="text-4xl font-black text-amber-500 tracking-tighter mb-2">
                 {activeMetrics?.totalSpend !== undefined ? (activeMetrics?.totalSpend || 0).toLocaleString() : "N/A"}{" "}
                 {activeMetrics?.totalSpend !== undefined && <span className="text-xs text-white/40">RSD</span>}
               </div>
               <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">PRE-AGREGIRANI BEZBEDNI BUDŽET</div>
            </div>

            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group hover:border-blue-400/30 transition-all">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">NEOBRAĐENE PRIJAVE</div>
               <div className="text-5xl font-black text-blue-400 tracking-tighter mb-2">
                 {activeMetrics?.pendingApplications !== undefined ? activeMetrics.pendingApplications : "N/A"}
               </div>
               {activeMetrics?.pendingApplications === undefined && (
                 <div className="text-[8px] font-mono font-bold text-red-500/80 uppercase mt-1 tracking-wider">Modul za prijave privremeno nedostupan</div>
               )}
               <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">KANDIDATI KOJI ČEKAJU</div>
            </div>
            
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
               <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-8">NEDAVNE AKTIVNOSTI</div>
               <DashboardGuard variant="inline" title="Greška u listi aktivnosti">
                 <ActivityFeed />
               </DashboardGuard>
            </div>
          </motion.div>
        </div>
      </div>

      <Suspense fallback={null}>
        <PaymentInstructionsModal 
          isOpen={!!selectedAdForPayment} 
          onClose={() => setSelectedAdForPayment(null)} 
          ad={selectedAdForPayment} 
        />
      </Suspense>
    </motion.div>
  );
});

export default EmployerDashboardUI;
