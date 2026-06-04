import { AnimatePresence } from 'motion/react';
import React, { useEffect, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { getQuotaExceeded } from '@/src/lib/errorUtils';

const AbuseTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/AbuseTab').then(m => ({ default: m.AbuseTab })));
const BrandingTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/BrandingTab').then(m => ({ default: m.BrandingTab })));
const BroadcastTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/BroadcastTab').then(m => ({ default: m.BroadcastTab })));
const FinancesTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/FinancesTab').then(m => ({ default: m.FinancesTab })));
const MarketingTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/MarketingTab').then(m => ({ default: m.MarketingTab })));
const ModerationTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/ModerationTab').then(m => ({ default: m.ModerationTab })));
const OverviewTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/OverviewTab').then(m => ({ default: m.OverviewTab })));
const SupportTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/SupportTab').then(m => ({ default: m.SupportTab })));
const UsersTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/UsersTab').then(m => ({ default: m.UsersTab })));
const VerifyTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/VerifyTab').then(m => ({ default: m.VerifyTab })));
const SyncTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/SyncTab').then(m => ({ default: m.SyncTab })));
const AuditTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/AuditTab').then(m => ({ default: m.AuditTab })));
const GlobalSettingsTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/GlobalSettingsTab').then(m => ({ default: m.GlobalSettingsTab })));
const ObservabilityTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/ObservabilityTab').then(m => ({ default: m.ObservabilityTab })));
const HousekeepingTab = lazy(() => import('@/src/modules/dashboard/components/admin/tabs/HousekeepingTab').then(m => ({ default: m.HousekeepingTab })));

import { AdminErrorBoundary } from '@/src/modules/dashboard/components/admin/AdminErrorBoundary';

import { AdminHeader } from '@/src/modules/dashboard/components/admin/AdminHeader';
import { AdminSidebar } from '@/src/modules/dashboard/components/admin/AdminSidebar';
import { 
  AdminStatsSkeleton, 
  AdminChartsSkeleton 
} from '@/src/modules/dashboard/components/admin/AdminSkeletons';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useAdminSettings } from '@/src/modules/admin/hooks/useAdminDashboardNode';
import { useAdminStats } from '@/src/modules/admin/hooks/useAdminStats';
import { useAdminStore } from '@/src/modules/admin/store/adminStore';
import { generateSlug } from '@/src/lib/seo';

const PageLoader = () => (
  <div className="bg-slate-950 min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const TabLoader = () => (
  <div className="h-96 w-full animate-pulse bg-white/5 rounded-[10px] flex items-center justify-center border border-white/5">
    <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Učitavanje modula...</span>
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RenderTabContent = ({ activeTab, isLoading, charts, launchMode, toggleLaunchMode, isUpdatingLaunchMode, getDetailLink, systemStats }: { activeTab: string, isLoading: boolean, charts: unknown, launchMode: boolean, toggleLaunchMode: () => void, isUpdatingLaunchMode: boolean, getDetailLink: (item: unknown) => string, systemStats: any }) => {
  const content = (() => {
    switch (activeTab) {
      case 'overview':
        if (isLoading) {
          return (
            <div className="space-y-8">
              <AdminStatsSkeleton />
              <Skeleton className="w-full h-32 rounded-[10px]" />
              <AdminChartsSkeleton />
            </div>
          );
        }
        return (
          <OverviewTab 
            dynamicSectorData={(charts as { sectorData?: any[] })?.sectorData || []}
            dynamicRegistrationData={(charts as { registrationData?: any[] })?.registrationData || []}
            launchMode={launchMode}
            toggleLaunchMode={toggleLaunchMode}
            isUpdatingLaunchMode={isUpdatingLaunchMode}
          />
        );
      case 'moderation': return <ModerationTab getDetailLink={getDetailLink} />;
      case 'users': return <UsersTab />;
      case 'verify': return <VerifyTab />;
      case 'finances': return <AdminErrorBoundary><FinancesTab stats={systemStats} /></AdminErrorBoundary>;
      case 'support': return <SupportTab />;
      case 'abuse': return <AdminErrorBoundary><AbuseTab /></AdminErrorBoundary>;
      case 'marketing': return <MarketingTab />;
      case 'broadcast': return <BroadcastTab />;
      case 'sync': return <SyncTab />;
      case 'audit': return <AuditTab />;
      case 'observability': return <AdminErrorBoundary><ObservabilityTab /></AdminErrorBoundary>;
      case 'settings': return <GlobalSettingsTab />;
      case 'branding': return <BrandingTab />;
      case 'housekeeping': return <HousekeepingTab />;
      default: return null;
    }
  })();

  return <Suspense fallback={<TabLoader />}>{content}</Suspense>;
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.isAdmin || user?.email === 'mancoresolution@gmail.com';
  const navigate = useNavigate();
  const activeTab = useAdminStore((state) => state.activeTab);
  const setActiveTab = useAdminStore((state) => state.setActiveTab);
  
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

  const getDetailLink = (val: unknown) => {
    const item = val as Record<string, unknown>;
    if (item._collection === 'jobs') {
       const title = (item.title || item.name || 'bez-naslova') as string;
       const loc = (item.location || item.loc || '') as string;
       const comp = (item.company || item.comp || '') as string;
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
    <div className="min-h-screen bg-slate-950 text-white font-body selection:bg-secondary selection:text-slate-950">
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        launchMode={launchMode}
        toggleLaunchMode={toggleLaunchMode}
        isUpdatingLaunchMode={isUpdatingLaunchMode}
      />

      <main className="ml-80 p-12">
        <AdminHeader activeTab={activeTab} systemStats={systemStats} />

        <AnimatePresence mode="wait">
          <RenderTabContent 
            key={activeTab}
            activeTab={activeTab} 
            isLoading={isLoading} 
            charts={charts} 
            launchMode={launchMode} 
            toggleLaunchMode={toggleLaunchMode} 
            isUpdatingLaunchMode={isUpdatingLaunchMode} 
            getDetailLink={getDetailLink} 
            systemStats={systemStats} 
          />
        </AnimatePresence>
      </main>
    </div>
  );
}
