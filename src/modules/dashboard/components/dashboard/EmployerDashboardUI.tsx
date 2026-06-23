import { memo, useState, useMemo, Suspense, lazy, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import ActivityFeed from '@/src/modules/dashboard/components/ActivityFeed';
import DashboardGuard from '@/src/modules/dashboard/components/dashboard/DashboardGuard';
import { useDashboardMetrics, useDashboardTrends } from '@/src/modules/dashboard/hooks/useDashboardStats';
import ChartSkeleton from '@/src/modules/dashboard/components/dashboard/ChartSkeleton';
import { SyncIndicator } from '@/src/modules/dashboard/components/dashboard/SyncIndicator';
import { RecentAd, ChartTrendData } from '../../types';
import { useAuth } from '@/src/context/AuthContext';
import { calculateProfileScore } from '@/src/modules/dashboard/utils/profileCompletion';
import ProfileHealth from '@/src/modules/dashboard/components/ProfileHealth';

const DashboardCharts = lazy(() => import('@/src/modules/dashboard/components/DashboardCharts'));
const PaymentInstructionsModal = lazy(() => import('@/src/modules/ads/components/ads/PaymentInstructionsModal').then(module => ({ default: module.PaymentInstructionsModal })));

const parseTrendDate = (value?: string) => {
  if (!value) return null;

  const timestamp = Date.parse(value);
  if (!Number.isNaN(timestamp)) {
    return timestamp;
  }

  const shortLabelMatch = value.match(/^(\d{1,2})\.\s*([^\s.]+)$/i);
  if (!shortLabelMatch) {
    return null;
  }

  const [, dayRaw, monthRaw] = shortLabelMatch;
  const monthMap: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    maj: 4,
    jun: 5,
    jul: 6,
    avg: 7,
    sep: 8,
    okt: 9,
    nov: 10,
    dec: 11,
  };
  const monthIndex = monthMap[monthRaw.toLowerCase()];
  const day = Number(dayRaw);

  if (monthIndex === undefined || Number.isNaN(day)) {
    return null;
  }

  return new Date(new Date().getFullYear(), monthIndex, day).getTime();
};

const EmployerDashboardUI = memo(function EmployerDashboardUI() {
  const { user } = useAuth();
  // isLoading = još uvek nema nikakvih podataka (prvo učitavanje)
  // isFetching = pozadinski osvežava se, ali imamo stare podatke
  const { data: statsData, isLoading } = useDashboardMetrics();
  const { data: trends = [] } = useDashboardTrends();
  const [selectedAdForPayment, setSelectedAdForPayment] = useState<RecentAd | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('month');
  const profileScore = calculateProfileScore(user);

  const recentAds: RecentAd[] = Array.isArray(statsData?.recentAds) 
    ? statsData.recentAds.map((ad) => ({
        id: ad.id,
        title: ad.title,
        status: ad.status || "active",
        applicantsCount: (ad as { applicantsCount?: number }).applicantsCount ?? 0,
        type: ad.postType,
        health: (ad as { health?: RecentAd['health'] }).health,
        createdAt: ad.createdAt ? String(ad.createdAt) : undefined,
      }) as RecentAd)
    : [];

  const filteredTrends = useMemo(() => {
    const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    const safeTrends = Array.isArray(trends) ? (trends as ChartTrendData[]) : [];
    const withTimestamps = safeTrends.map((trend, index) => ({
      trend,
      index,
      timestamp: parseTrendDate(trend.date),
    }));
    const hasParsableDates = withTimestamps.some(({ timestamp }) => timestamp !== null);

    if (!hasParsableDates) {
      return safeTrends.slice(-days);
    }

    const now = Date.now();
    const rangeMs = days * 86400000;

    return withTimestamps
      .filter(({ timestamp }) => timestamp !== null && now - timestamp <= rangeMs)
      .map(({ trend }) => trend);
  }, [trends, timeframe]);

  const charts = { dailyAnalytics: Array.isArray(filteredTrends) ? (filteredTrends as ChartTrendData[]) : [] };

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary text-sm">monitoring</span>
                <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Statistika vaših oglasa</h4>
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest max-w-sm">
                Pratite koliko radnika je pregledalo vaše objavljene poslove i koliko njih se prijavilo.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-[8px]">
                <button 
                  onClick={() => setTimeframe('day')}
                  className={`px-4 py-1.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'day' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                >
                  Dan
                </button>
                <button 
                  onClick={() => setTimeframe('week')}
                  className={`px-4 py-1.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                >
                  7 Dana
                </button>
                <button 
                  onClick={() => setTimeframe('month')}
                  className={`px-4 py-1.5 rounded-[6px] text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === 'month' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}
                >
                  30 Dana
                </button>
              </div>
            </div>
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

        <div className="lg:col-span-1 flex flex-col justify-stretch">
          <DashboardGuard variant="inline" title="Zdravlje profila">
            <ProfileHealth score={profileScore} hideButton={false} />
          </DashboardGuard>
        </div>

        <Suspense fallback={null}>
          <PaymentInstructionsModal 
            isOpen={!!selectedAdForPayment} 
            onClose={() => setSelectedAdForPayment(null)} 
            ad={selectedAdForPayment} 
          />
        </Suspense>
      </div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-8">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="material-symbols-outlined text-secondary text-3xl">work</span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">UPRAVLJANJE OGLASIMA</h3>
          </div>
          <div className="h-px w-full sm:flex-1 bg-white/5"></div>
        </motion.div>

        {/* KPI / Stats Grid - Full width above content */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-5 lg:p-6 group hover:border-white/10 transition-all flex flex-col justify-between min-h-[130px]">
             <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">UKUPAN BROJ OBJAVA</div>
             <div>
               <div className={`text-3xl lg:text-4xl font-black text-white tracking-tighter group-hover:text-secondary transition-colors ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "…" : (statsData?.totalAds ?? 0)}
                </div>
             </div>
          </div>

          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-5 lg:p-6 group hover:border-emerald-500/30 transition-all flex flex-col justify-between min-h-[130px]">
             <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">AKTIVNI PAKET</div>
             <div>
               <div className={`text-xl lg:text-2xl font-black text-emerald-400 tracking-tight uppercase ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "…" : (statsData?.activePackage || "NEMA PAKETA")}
                </div>
                <div className="text-[8px] font-bold text-white/20 uppercase mt-1 tracking-widest leading-tight">
                  {statsData?.activePackage && statsData.activePackage !== "Nema paketa" ? "AKTIVAN PAKET" : "PREMIUM PROMOCIJE"}
               </div>
             </div>
          </div>

          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-5 lg:p-6 group hover:border-purple-400/30 transition-all flex flex-col justify-between min-h-[130px]">
             <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">PREMIUM OGLASI</div>
             <div>
               <div className={`text-3xl lg:text-4xl font-black text-purple-400 tracking-tighter ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "…" : (statsData?.premiumAdsCount ?? 0)}
               </div>
               <div className="text-[8px] font-bold text-white/20 uppercase mt-1 tracking-widest">KUPLJENI ARTIKLI</div>
             </div>
          </div>

          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-5 lg:p-6 group hover:border-amber-500/30 transition-all flex flex-col justify-between min-h-[130px]">
             <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">INVESTIRANO (RSD)</div>
             <div>
               <div className={`text-2xl lg:text-3xl font-black text-amber-500 tracking-tighter ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "…" : (statsData?.totalSpend ?? 0).toLocaleString()}
               </div>
               <div className="text-[8px] font-bold text-white/20 uppercase mt-1 tracking-widest">BEZBEDNI BUDŽET</div>
             </div>
          </div>

          <div className="col-span-2 md:col-span-1 xl:col-span-1 bg-[#0A0F14] border border-white/5 rounded-[10px] p-5 lg:p-6 group hover:border-blue-400/30 transition-all flex flex-col justify-between min-h-[130px]">
             <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">NEOBRAĐENE PRIJAVE</div>
             <div>
               <div className={`text-3xl lg:text-4xl font-black text-blue-400 tracking-tighter ${isLoading ? "animate-pulse" : ""}`}>
                  {isLoading ? "…" : (statsData?.pendingApplications ?? 0)}
                </div>
                <div className="text-[8px] font-bold text-white/20 uppercase mt-1 tracking-widest">KANDIDATI NA ČEKANJU</div>
             </div>
          </div>
        </motion.div>

        {/* Content Layout - Ads list and Activity Feed side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="lg:col-span-2 flex flex-col">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-10 flex flex-col flex-1 min-h-[450px]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
                <div>
                  <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">POSLEDNJI OBJAVLJENI OGLASI</h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest max-w-sm">Pregled nedavnih poslova i prijavljenih radnika.</p>
                </div>
                {!statsData && !isLoading && (
                  <span className="text-[8px] font-black text-orange-400 bg-orange-400/5 border border-orange-400/10 px-3 py-1.5 rounded-full uppercase tracking-widest animate-pulse self-start sm:self-auto">
                    PRIVREMENO OGRANIČENO
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
                <div ref={parentRef} className="max-h-[350px] overflow-y-auto no-scrollbar scroll-smooth pr-2">
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
                          <div className="bg-white/[0.02] border border-white/5 p-4 sm:p-5 rounded-[10px] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group/ad h-full transition-colors hover:bg-white/[0.03]">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="text-white font-black text-sm uppercase tracking-tight group-hover/ad:text-secondary transition-colors truncate pr-2">{ad.title || ad.name}</div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase shrink-0">KANDIDATA: {ad.applicantsCount || 0}</span>
                                <span className="text-white/20 text-[8px] shrink-0 hidden sm:inline">•</span>
                                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${
                                  ad.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                  ad.status === 'pending_payment' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                  ad.status === 'pending' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  ad.status === 'expired' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                  'bg-white/5 text-white/40'
                                }`}>
                                  {ad.status === 'active' ? 'AKTIVAN' :
                                  ad.status === 'pending_payment' ? 'ZAHTEVA PLAĆANJE' :
                                  ad.status === 'pending' ? 'NA ČEKANJU' :
                                  ad.status === 'expired' ? 'ISTEKAO' :
                                  ad.status === 'rejected' ? 'ODBIJEN' : ad.status}
                                </div>
                                {ad.status === 'active' && (
                                  <>
                                    <span className="text-white/20 text-[8px] shrink-0 hidden sm:inline">•</span>
                                    <SyncIndicator adId={ad.id} category={ad.category || ad.type || 'listings'} />
                                    
                                    {ad.health && ad.health.status === 'poor' && (
                                      <div className="ml-2 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-1.5 animate-pulse group/tip relative">
                                        <span className="material-symbols-outlined text-[10px] text-red-500">warning</span>
                                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap">💡 AI SAVET</span>
                                        
                                        {ad.health.suggestion && (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none">
                                            <div className="text-[8px] font-black text-secondary uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                              <span className="material-symbols-outlined text-[10px]">psychology</span>
                                              AI SAVET ZA OPTIMIZACIJU
                                            </div>
                                            <p className="text-[10px] text-white/70 font-medium leading-relaxed italic">
                                              "${ad.health.suggestion}"
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                              {ad.status === 'pending_payment' && (
                                <button 
                                  onClick={() => setSelectedAdForPayment(ad)}
                                  className="flex-1 sm:flex-none px-4 py-2 bg-orange-500 text-slate-950 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-orange-400 transition-colors flex items-center justify-center gap-2"
                                >
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                  UPLATI
                                </button>
                              )}
                              <Link to={`/poslovi/${ad.id}`} className="flex-1 sm:flex-none h-10 px-4 sm:px-0 sm:w-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined text-xl">open_in_new</span>
                                <span className="sm:hidden ml-2 text-[9px] font-black uppercase tracking-widest">OTVORI OGLAS</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-[10px] p-12 text-center flex flex-col items-center justify-center gap-6 relative overflow-hidden group flex-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative shadow-2xl">
                    <div className="absolute inset-0 border border-secondary/20 rounded-full animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-2xl sm:text-3xl text-secondary">campaign</span>
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-white text-xs sm:text-sm font-black uppercase tracking-widest">NEMA AKTIVNIH OGLASA</h3>
                    <p className="text-white/40 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">
                      KREIRAJTE SVOJ PRVI OGLAS KAKO BI PRIVUKLI NOVE KANDIDATE.
                    </p>
                  </div>
                  <Link to="/postavi-oglas" className="mt-2 bg-secondary text-slate-950 text-[9px] font-black uppercase tracking-widest px-6 py-3 sm:px-8 sm:py-4 rounded-[10px] transition-all shadow-xl shadow-secondary/20 hover:bg-yellow-400 relative z-10 w-full sm:w-auto">
                    KREIRAJ OGLAS SADA
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="lg:col-span-1 flex flex-col">
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-10 flex-1 min-h-[300px] lg:min-h-[450px]">
               <div className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-6 lg:mb-8">NEDAVNE AKTIVNOSTI</div>
               <DashboardGuard variant="inline" title="Greška u listi aktivnosti">
                 <ActivityFeed />
               </DashboardGuard>
            </div>
          </motion.div>
        </div>
      </motion.div>
  );
});

export default EmployerDashboardUI;
