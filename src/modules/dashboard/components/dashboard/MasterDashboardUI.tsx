import React, { useMemo, memo, Suspense, lazy, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import DashboardGuard from '@/src/modules/dashboard/components/dashboard/DashboardGuard';
import FirestoreObservability from '@/src/modules/dashboard/components/dashboard/FirestoreObservability';
import { User } from '@/src/modules/core/types/user';
import { useDashboardMetrics } from '@/src/modules/dashboard/hooks/useDashboardStats';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { AvailabilityManager } from '@/src/modules/dashboard/components/dashboard/AvailabilityManager';
import { useUserStore } from '@/src/store/userStore';
import { Card } from '@/src/components/ui/Card';
import { DashboardEmptyState } from '@/src/components/ui/DashboardEmptyState';

const ProfileHealth = lazy(() => import('@/src/modules/dashboard/components/ProfileHealth'));
const SmartMatches = lazy(() => import('@/src/modules/dashboard/components/SmartMatches'));

interface MasterDashboardUIProps {
  masterStatus: string;
  toggleMasterStatus: () => Promise<void> | void;
  user: User | null;
}

interface SmartMatchItem {
  id: string;
  title?: string;
  name?: string;
  city?: string;
  matchRate?: number;
}

interface ApplicationItem {
  id: string;
  title?: string;
  name?: string;
  city?: string;
  status?: string;
  jobId?: string;
}

const MasterDashboardUI = memo(function MasterDashboardUI({ masterStatus, toggleMasterStatus, user }: MasterDashboardUIProps) {
  const { data, isLoading } = useDashboardMetrics();
  const roleData = data || {};
  
  const isStatusToggling = useUserStore(state => state.isMasterStatusToggling);
  const setIsStatusToggling = useUserStore(state => state.setIsMasterStatusToggling);
  
  const recentApps: ApplicationItem[] = roleData?.recentApplications || [];
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: recentApps.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // approximate height of row
    overscan: 5,
  });

  const handleToggleStatus = async () => {
    if (isStatusToggling) return;
    setIsStatusToggling(true);
    try {
      await toggleMasterStatus();
    } finally {
      setIsStatusToggling(false);
    }
  };

  const profileScore = useMemo(() => {
    if (!user) return 0;
    let score = 0;
    if (user.firstName && user.lastName) score += 10;
    if (user.photoURL || user.businessProfile?.logo) score += 15;
    if (user.phone) score += 15;
    if (user.description && user.description.length > 10) score += 20;
    if (user.profession) score += 15;
    if (user.hasCV) score += 15;
    if (user.facebook) score += 5;
    if (user.instagram) score += 5;
    return score;
  }, [user]);

  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }}}
      className="space-y-8"
    >
      {/* Principal Observability Layer - Visibility Restricted to Admin */}
      {user?.role === 'admin' && (
        <div className="mb-6">
          <FirestoreObservability />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="md:col-span-1 space-y-6">
          <Card layout="flexCol">
            <div className="space-y-8">
              <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">RADNI STATUS</h3>
              <button 
                onClick={handleToggleStatus} 
                disabled={isStatusToggling}
                className={`w-full p-6 rounded-[10px] border transition-all flex flex-col items-center gap-3 ${masterStatus === 'slobodan' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'} ${isStatusToggling ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
              >
                {isStatusToggling ? (
                  <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-outlined text-4xl">{masterStatus === 'slobodan' ? 'do_not_disturb_off' : 'do_not_disturb_on'}</span>
                )}
                <span className="text-xs font-black uppercase tracking-widest">{isStatusToggling ? 'AŽURIRANJE...' : masterStatus}</span>
              </button>
              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-[10px] flex justify-between items-center text-white">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">POSLATE PRIJAVE</span>
                  <span className="text-lg font-black">
                    {isLoading ? <Skeleton className="w-8 h-6 rounded" /> : (roleData?.recentApplications !== undefined ? (roleData?.recentApplications?.length || 0) : "N/A")}
                  </span>
                </div>
                {!isLoading && roleData?.recentApplications === undefined && (
                  <div className="text-[8px] font-bold text-orange-400 bg-orange-400/5 border border-orange-400/10 py-1.5 rounded-[5px] text-center uppercase tracking-wider transition-all">
                    Sistem prijava privremeno nedostupan
                  </div>
                )}
              </div>
            </div>
          </Card>
          
          <DashboardGuard variant="inline" title="Kalendar Dostupnosti">
            <AvailabilityManager />
          </DashboardGuard>

          <DashboardGuard variant="inline" title="Zdravlje profila">
            <Suspense fallback={<div className="h-48 w-full bg-white/5 animate-pulse rounded-lg flex items-center justify-center"><span className="text-white/20 text-xs font-bold uppercase tracking-widest">Učitavanje vizualizacije...</span></div>}>
              <ProfileHealth score={profileScore} />
            </Suspense>
          </DashboardGuard>
          
          {isLoading ? (
             <div className="h-64 w-full bg-white/5 animate-pulse rounded-lg flex items-center justify-center">
               <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Učitavanje...</span>
             </div>
          ) : roleData.smartMatches === undefined ? (
            <div className="bg-[#0A0F14] border border-white/5 p-6 rounded-[10px] text-center text-white/40 text-[9px] font-bold uppercase tracking-widest leading-relaxed flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-2xl text-orange-400 animate-pulse">cloud_off</span>
              <span>Preporučeni poslovi su privremeno nedostupni</span>
            </div>
          ) : roleData.smartMatches && (
            <DashboardGuard variant="inline" title="Preporučeni poslovi">
              <Suspense fallback={<div className="h-64 w-full bg-white/5 animate-pulse rounded-lg flex items-center justify-center"><span className="text-white/20 text-xs font-bold uppercase tracking-widest">Učitavanje vizualizacije...</span></div>}>
                <SmartMatches 
                  type="jobs" 
                  matches={(roleData.smartMatches as SmartMatchItem[]).map((j) => ({
                    id: j.id,
                    title: j.title || j.name || 'OGLAS',
                    subtitle: j.city || 'Srbija',
                    matchRate: j.matchRate || 80
                  }))} 
                />
              </Suspense>
            </DashboardGuard>
          )}
        </motion.div>
        
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="md:col-span-3 h-fit">
           <Card padding="lg" layout="default" className="h-fit">
              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center mb-10 shrink-0">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">VAŠE PRIJAVE I POSLOVI</h2>
                <Link to="/moj-profil/prijave" className="bg-secondary text-slate-950 font-black px-8 py-3 rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-yellow-400 transition-all text-center">POGLEDAJ SVE PRIJAVE</Link>
              </div>
              
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 shrink-0">NEDAVNE PRIJAVE (LIMIT 5)</h3>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-[10px]"></div>
                  ))}
                </div>
              ) : roleData.recentApplications === undefined ? (
                <DashboardEmptyState 
                  title="Aplikacijski podaci su privremeno nedostupni"
                  description="Sistem je parcijalno učitao kontrolnu tablu, ali lista vaših prijavnih dokumenata trenutno pati od kašnjenja u mreži."
                />
              ) : recentApps.length > 0 ? (
                <div ref={parentRef} className="h-[380px] overflow-y-auto no-scrollbar scroll-smooth pr-2">
                  <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const ad = recentApps[virtualItem.index];
                      return (
                        <div 
                          key={virtualItem.key}
                          className="py-1"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[10px] flex justify-between items-center h-full">
                             <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-xs">{ad.title || ad.name || `Prijava ${ad.id.substring(0, 5)}`}</h4>
                                <div className="text-[9px] font-bold text-white/40 uppercase mt-1 truncate">STATUS: {ad.status} • {ad.city || ''}</div>
                             </div>
                             <Link to={ad.jobId ? `/poslovi/${ad.jobId}` : '#'} className="text-white/40 hover:text-white shrink-0"><span className="material-symbols-outlined">visibility</span></Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <DashboardEmptyState 
                  icon="work_history"
                  title="NEMATE ZADNJIH PRIJAVA"
                  description="Prijavite se na aktivne konkurse za posao koji odgovaraju vašim veštinama i pronađite angažman još danas."
                  action={
                    <Link to="/poslovi" className="px-6 py-3 bg-white/5 text-white font-black rounded text-[10px] hover:bg-white/10 uppercase tracking-widest transition-all">
                      POGLEDAJ OTVORENE POSLOVE
                    </Link>
                  }
                />
              )}
           </Card>
        </motion.div>
      </div>
    </motion.div>
  );
});

export default MasterDashboardUI;


