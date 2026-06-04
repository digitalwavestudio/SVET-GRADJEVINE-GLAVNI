import React, { Suspense, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { initGA, trackPageView } from '@/src/lib/analytics';
import ErrorBoundary from '@/src/components/ErrorBoundary';
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

import { JobsRouter } from '@/src/modules/jobs/routes';
import { CompaniesRouter } from '@/src/modules/companies/routes';
import { RealEstateRouter } from '@/src/modules/real_estate/routes';
import { MachinesRouter } from '@/src/modules/machines/routes';
import { CateringRouter } from '@/src/modules/catering/routes';
import { AccommodationsRouter } from '@/src/modules/accommodations/routes';
import { DashboardRouter, DashboardPublicRouter } from '@/src/modules/dashboard/routes';
import { AuthRouter, AuthDashboardRouter } from '@/src/modules/auth/routes';
import { ToolsDashboardRouter, ToolsPublicRouter } from '@/src/modules/tools/routes';
import { CoreRouter, CoreDashboardRouter } from '@/src/modules/core/routes';
import { MarketplaceRouter, MarketplaceDashboardRouter } from '@/src/modules/marketplace/routes';
import { AdsRouter } from '@/src/modules/ads/routes';
import { CheckoutRouter } from '@/src/modules/checkout/routes';
import { MastersRouter } from '@/src/modules/masters/routes';
import { MagazineRouter } from '@/src/modules/magazine/routes';
import { SearchRouter } from '@/src/modules/search/routes';

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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<GlobalRouteError />}>
      {/* MAIN LAYOUT (NavBar + Footer) */}
      <Route element={<MainLayout />}>
        {CoreRouter}
        
        {/* MODULES */}
        {JobsRouter}
        {CompaniesRouter}
        {RealEstateRouter}
        {MachinesRouter}
        {CateringRouter}
        {AccommodationsRouter}
        {MarketplaceRouter}
        {MastersRouter}
        {AdsRouter}
        {CheckoutRouter}
        {/* {MagazineRouter} */}
        {SearchRouter}
        {DashboardPublicRouter}
        {ToolsPublicRouter}
      </Route>

      {/* AUTH LAYOUT (No NavBar/Footer) */}
      {AuthRouter}

      {/* DASHBOARD LAYOUT (Handled individually by pages) */}
      {DashboardRouter}
      {AuthDashboardRouter}
      {ToolsDashboardRouter}
      {CoreDashboardRouter}
      {MarketplaceDashboardRouter}

      {/* NOT FOUND falls back to main layout to show footer over it or blank */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  )
);

import { Toaster } from 'react-hot-toast';
import { AuthLoader } from '@/src/components/AuthLoader';

function App() {
  return (
    <ErrorBoundary>
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
          <RouterProvider router={router} />
        </AuthLoader>
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
