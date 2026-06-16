import { Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { initGA, trackPageView } from '@/src/lib/analytics';
import NetworkStatus from '@/src/components/NetworkStatus';
import CookieConsent from '@/src/components/CookieConsent';
import BackToTop from '@/src/components/BackToTop';
import { VerificationBanner } from '@/src/components/VerificationBanner';
import { measurePageLoad } from '@/src/lib/performance';
import { AppProviders } from '@/src/components/AppProviders';
import { useAffiliateTracking } from '@/src/hooks/useAffiliateTracking';
import { usePresence } from '@/src/hooks/usePresence';
import { MainLayout } from '@/src/modules/core/components/layout/MainLayout';
import NotFoundPage from '@/src/modules/core/pages/NotFoundPage';

import { getJobsRouter } from '@/src/modules/jobs/routes';
import { getCompaniesRouter } from '@/src/modules/companies/routes';
import { getRealEstateRouter } from '@/src/modules/real_estate/routes';
import { getMachinesRouter } from '@/src/modules/machines/routes';
import { getCateringRouter } from '@/src/modules/catering/routes';
import { getAccommodationsRouter } from '@/src/modules/accommodations/routes';
import { getDashboardRouter, getDashboardPublicRouter } from '@/src/modules/dashboard/routes';
import { getAuthRouter, getAuthDashboardRouter } from '@/src/modules/auth/routes';
import { getToolsDashboardRouter, getToolsPublicRouter } from '@/src/modules/tools/routes';
import { getCoreRouter, getCoreDashboardRouter } from '@/src/modules/core/routes';
import { getMarketplaceRouter, getMarketplaceDashboardRouter } from '@/src/modules/marketplace/routes';
import { getAdsRouter } from '@/src/modules/ads/routes';
import { getCheckoutRouter } from '@/src/modules/checkout/routes';
import { getMastersRouter } from '@/src/modules/masters/routes';
import { getSearchRouter } from '@/src/modules/search/routes';

const PageLoader = () => (
  <div className="bg-surface min-h-screen flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import QuotaBanner from '@/src/components/QuotaBanner';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { usePerformanceNavigation } from '@/src/lib/performance';

function RootLayout() {
  const location = useLocation();
  
  useAffiliateTracking();
  usePresence();
  useRealtimeSync();
  usePerformanceNavigation(); // Automatic route-level tracing

  useEffect(() => {
    measurePageLoad();
    initGA(import.meta.env.VITE_GA_MEASUREMENT_ID);
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
      <ProgressBar />
      <QuotaBanner />
      {location.pathname !== '/prijava' && location.pathname !== '/registracija' && <VerificationBanner />}
      <NetworkStatus />
      <CookieConsent />
      <ScrollRestoration />
      <BackToTop />
      
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

import GlobalRouteError from '@/src/components/GlobalRouteError';

let router: ReturnType<typeof createBrowserRouter> | null = null;

function getRouter() {
  if (!router) {
    router = createBrowserRouter(
      createRoutesFromElements(
        <Route element={<RootLayout />} errorElement={<GlobalRouteError />}>
          {/* MAIN LAYOUT (NavBar + Footer) */}
          <Route element={<MainLayout />}>
            {getCoreRouter()}
            
            {/* MODULES */}
            {getJobsRouter()}
            {getCompaniesRouter()}
            {getRealEstateRouter()}
            {getMachinesRouter()}
            {getCateringRouter()}
            {getAccommodationsRouter()}
            {getMarketplaceRouter()}
            {getMastersRouter()}
            {getAdsRouter()}
            {getCheckoutRouter()}
            {getSearchRouter()}
            {getDashboardPublicRouter()}
            {getToolsPublicRouter()}
          </Route>

          {/* AUTH LAYOUT (No NavBar/Footer) */}
          {getAuthRouter()}

          {/* DASHBOARD LAYOUT (Handled individually by pages) */}
          {getDashboardRouter()}
          {getAuthDashboardRouter()}
          {getToolsDashboardRouter()}
          {getCoreDashboardRouter()}
          {getMarketplaceDashboardRouter()}

          {/* NOT FOUND falls back to main layout to show footer over it or blank */}
          <Route element={<MainLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      )
    );
  }
  return router;
}

import { Toaster } from 'react-hot-toast';
import { AuthLoader } from '@/src/components/AuthLoader';

function App() {
  return (
    <AppProviders>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0A0F14',
            color: '#fff',
            border: '1px solid rgba(255,173,58,0.2)',
          },
        }}
      />
      <AuthLoader>
        <RouterProvider router={getRouter()} />
      </AuthLoader>
    </AppProviders>
  );
}

export default App;
