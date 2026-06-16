import { AnimatePresence } from 'motion/react';
import React, { useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { getQuotaExceeded } from '@/src/lib/errorUtils';

const AbuseTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/AbuseTab').then(m => ({ default: m.AbuseTab })));
const BrandingTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/BrandingTab').then(m => ({ default: m.BrandingTab })));
const BroadcastTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/BroadcastTab').then(m => ({ default: m.BroadcastTab })));
const FinancesTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/FinancesTab').then(m => ({ default: m.FinancesTab })));
const MarketingTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/MarketingTab').then(m => ({ default: m.MarketingTab })));
const ModerationTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/ModerationTab').then(m => ({ default: m.ModerationTab })));
const OverviewTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const SupportTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/SupportTab').then(m => ({ default: m.SupportTab })));
const UsersTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/UsersTab').then(m => ({ default: m.UsersTab })));
const VerifyTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/VerifyTab').then(m => ({ default: m.VerifyTab })));
const SyncTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/SyncTab').then(m => ({ default: m.SyncTab })));
const AuditTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/AuditTab').then(m => ({ default: m.AuditTab })));
const GlobalSettingsTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/GlobalSettingsTab').then(m => ({ default: m.GlobalSettingsTab })));
const ObservabilityTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/ObservabilityTab').then(m => ({ default: m.ObservabilityTab })));
const ResilienceTab = lazy(() => import('@/src/modules/admin/components/admin/tabs/ResilienceTab').then(m => ({ default: m.ResilienceTab })));


import { AdminErrorBoundary } from '@/src/modules/admin/components/admin/AdminErrorBoundary';

import { AdminHeader } from '@/src/modules/admin/components/admin/AdminHeader';
import { AdminSidebar } from '@/src/modules/admin/components/admin/AdminSidebar';
import { 
  AdminStatsSkeleton, 
  AdminChartsSkeleton 
} from '@/src/modules/admin/components/admin/AdminSkeletons';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useAdminSettings } from '@/src/modules/admin/hooks/useAdminDashboardNode';
import { useAdminStats } from '@/src/modules/admin/hooks/useAdminStats';
import { useState } from 'react';
import { generateSlug } from '@/src/lib/seo';
import { SectorData, RegistrationData } from '@/src/modules/admin/components/admin/tabs/OverviewTab';

const AdminTabLoading = () => (
  <div className="space-y-6">
    <Skeleton className="w-48 h-8 rounded-[10px]" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-40 rounded-[10px]" />
      <Skeleton className="h-40 rounded-[10px]" />
      <Skeleton className="h-40 rounded-[10px]" />
    </div>
    <Skeleton className="w-full h-64 rounded-[10px]" />
  </div>
);

const PageLoader = () => (
  <div className="bg-slate-950 min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'users' | 'verify' | 'finances' | 'support' | 'abuse' | 'marketing' | 'broadcast' | 'branding' | 'sync' | 'audit' | 'settings' | 'observability' | 'housekeeping' | 'resilience'>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const {
      launchMode,
      isUpdatingLaunchMode,
      toggleLaunchMode
  } = useAdminSettings(isAdmin);

  const { data, isLoading, isError } = useAdminStats();

  const charts = data?.chartData;
  const systemStats = data || {};

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  const getDetailLink = (item: any) => {
    if (item._collection === 'jobs') {
       const title = item.title || item.name || 'bez-naslova';
       const loc = item.location || item.loc || '';
       const comp = item.company || item.comp || '';
       const slug = generateSlug(title, loc, comp);
       return `/posao/${slug}~${item.id}`;
    }
    if (item._collection === 'marketplace' || item._collection === 'listings' && item.type === 'marketplace') {
       return `/alat-i-oprema/${item.id}`;
    }
    if (item._collection === 'accommodations') return `/smestaj/${item.id}`;
    if (item._collection === 'caterings') return `/ketering/provajder/${item.id}`;
    if (item._collection === 'machines') return `/gradjevinske-masine/${item.id}`;
    if (item._collection === 'plots') return `/nekretnine/${item.id}`;
    if (item._collection === 'companies') return `/firma/${item.id}`;
    if (item._collection === 'users') return `/profil/${item.id}`;
    return '#';
  };

  if (authLoading) return <PageLoader />;
  if (isError) {
    const isQuotaError = getQuotaExceeded();
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-white">
        <span className={`material-symbols-outlined text-5xl mb-4 ${isQuotaError ? 'text-amber-500' : 'text-red-500'}`}>
          {isQuotaError ? 'speed' : 'error'}
        </span>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
          {isQuotaError ? 'Sistem je pod neverovatnim opterećenjem' : 'Greška pri učitavanju'}
        </h2>
        <p className="text-white/40 mb-8">
          {isQuotaError ? 'Ograničen mod je aktivan. Sačekajte da se resursi oslobode.' : 'Došlo je do greške prilikom učitavanja administrativnih podataka.'}
        </p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-secondary text-slate-900 rounded font-black uppercase text-xs">Pokušaj ponovo</button>
      </div>
    );
  }

  if (!isAdmin && !authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
          <span className="material-symbols-outlined text-red-500 text-5xl">lock</span>
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">PRISTUP OBIJEN</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest max-w-md">
          NEMATE ADMINISTRATORSKE PRIVILEGIJE ZA PRISTUP OVOM MODULU.
        </p>
        <Link to="/" className="mt-10 px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-[10px] hover:bg-white/10 transition-all text-xs tracking-widest uppercase">
          Povratak na početnu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-body selection:bg-secondary selection:text-slate-950 flex flex-col md:flex-row">
      
      {/* Hamburger / Top Bar for Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0A0F14] sticky top-0 z-40">
         <div className="flex items-center gap-3">
           <span className="material-symbols-outlined text-secondary">terminal</span>
           <span className="font-black tracking-widest text-sm uppercase">Admin Hub</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 rounded ml-auto">
            <span className="material-symbols-outlined">menu</span>
         </button>
      </div>

      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setIsMobileMenuOpen(false); }} 
        launchMode={launchMode}
        toggleLaunchMode={toggleLaunchMode}
        isUpdatingLaunchMode={isUpdatingLaunchMode}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="md:ml-80 p-4 md:p-12 flex-1 w-full overflow-hidden">
        <AdminHeader activeTab={activeTab} />

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <Suspense fallback={
              <div className="space-y-8">
                <AdminStatsSkeleton />
                <Skeleton className="w-full h-32 rounded-[10px]" />
                <AdminChartsSkeleton />
              </div>
            }>
              {isLoading ? (
                <div className="space-y-8">
                  <AdminStatsSkeleton />
                  <Skeleton className="w-full h-32 rounded-[10px]" />
                  <AdminChartsSkeleton />
                </div>
              ) : (
                <OverviewTab 
                  dynamicSectorData={(charts?.sectorData || []) as any as SectorData[]}
                  dynamicRegistrationData={(charts?.registrationData || []) as any as RegistrationData[]}
                  launchMode={launchMode}
                  toggleLaunchMode={toggleLaunchMode}
                  isUpdatingLaunchMode={isUpdatingLaunchMode}
                />
              )}
            </Suspense>
          )}
          {activeTab === 'moderation' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><ModerationTab getDetailLink={getDetailLink} /></div>
            </Suspense>
          )}
          {activeTab === 'users' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><UsersTab /></div>
            </Suspense>
          )}
          {activeTab === 'verify' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><VerifyTab /></div>
            </Suspense>
          )}
          {activeTab === 'finances' && (
            <AdminErrorBoundary>
              <Suspense fallback={<AdminTabLoading />}>
                <div className="glass-card p-4"><FinancesTab stats={systemStats} /></div>
              </Suspense>
            </AdminErrorBoundary>
          )}
          {activeTab === 'support' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><SupportTab /></div>
            </Suspense>
          )}
          {activeTab === 'abuse' && (
            <AdminErrorBoundary>
              <Suspense fallback={<AdminTabLoading />}>
                <div className="glass-card p-4"><AbuseTab /></div>
              </Suspense>
            </AdminErrorBoundary>
          )}
          {activeTab === 'marketing' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><MarketingTab /></div>
            </Suspense>
          )}
          {activeTab === 'broadcast' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><BroadcastTab /></div>
            </Suspense>
          )}
          {activeTab === 'sync' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><SyncTab /></div>
            </Suspense>
          )}
          {activeTab === 'audit' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><AuditTab /></div>
            </Suspense>
          )}
          {activeTab === 'observability' && (
            <AdminErrorBoundary>
              <Suspense fallback={<AdminTabLoading />}>
                <div className="glass-card p-4"><ObservabilityTab /></div>
              </Suspense>
            </AdminErrorBoundary>
          )}
          {activeTab === 'resilience' && (
            <AdminErrorBoundary>
              <Suspense fallback={<AdminTabLoading />}>
                <div className="glass-card p-4"><ResilienceTab /></div>
              </Suspense>
            </AdminErrorBoundary>
          )}
          {activeTab === 'settings' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><GlobalSettingsTab /></div>
            </Suspense>
          )}
          {activeTab === 'branding' && (
            <Suspense fallback={<AdminTabLoading />}>
              <div className="glass-card p-4"><BrandingTab /></div>
            </Suspense>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
