import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { initGA, trackPageView } from '@/src/lib/analytics';
import NetworkStatus from '@/src/components/NetworkStatus';
import CookieConsent from '@/src/components/CookieConsent';
import BackToTop from '@/src/components/BackToTop';
import { VerificationBanner } from '@/src/components/VerificationBanner';
import { useAffiliateTracking } from '@/src/hooks/useAffiliateTracking';
import { usePresence } from '@/src/hooks/usePresence';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import QuotaBanner from '@/src/components/QuotaBanner';
import ProgressBar from '@/src/components/ui/ProgressBar';

const PageLoader = () => (
  <div className="bg-surface min-h-screen"></div>
);

export function RootLayout() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener('statechange', () => {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                newSW.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
      });
    }
  }, []);

  const location = useLocation();
  
  useAffiliateTracking();
  usePresence();
  useRealtimeSync();
  useEffect(() => {    const gaId = (typeof window !== 'undefined' && (window as any).__APP_ENV__?.VITE_GA_MEASUREMENT_ID) || import.meta.env.VITE_GA_MEASUREMENT_ID;
    initGA();
  }, []);

  useEffect(() => {
    trackPageView();
  }, [location]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary">
      <ProgressBar />
      <QuotaBanner />
      {location.pathname !== '/prijava' && <VerificationBanner />}
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
