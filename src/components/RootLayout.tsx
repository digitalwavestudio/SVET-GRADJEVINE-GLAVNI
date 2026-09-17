import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, ScrollRestoration } from 'react-router-dom';
import { motion } from 'motion/react';
import { initGA, trackPageView } from '@/src/lib/analytics';
import NetworkStatus from '@/src/components/NetworkStatus';
import CookieConsent from '@/src/components/CookieConsent';
import BackToTop from '@/src/components/BackToTop';

import { useAffiliateTracking } from '@/src/hooks/useAffiliateTracking';
import { usePresence } from '@/src/hooks/usePresence';
import { useRealtimeSync } from '@/src/hooks/useRealtimeSync';
import QuotaBanner from '@/src/components/QuotaBanner';
import ProgressBar from '@/src/components/ui/ProgressBar';
import { AiChatWidget } from '@/src/components/AiChatWidget';

const PageLoader = () => (
  <div className="bg-surface min-h-screen"></div>
);

export function RootLayout() {
  const [serviceWorkerUpdateAvailable, setServiceWorkerUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener('statechange', () => {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                setServiceWorkerUpdateAvailable(true);
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
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-32 w-[450px] h-[450px] bg-blue-500/3 rounded-full blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-white/[0.02] rounded-full blur-[100px]"
          animate={{ x: [0, 20, -20, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="relative z-10">
        <ProgressBar />
        <QuotaBanner />

        <NetworkStatus />
        <CookieConsent />
        <ScrollRestoration />
        <BackToTop />

        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>

        {serviceWorkerUpdateAvailable && (
          <div role="status" className="fixed bottom-6 left-1/2 z-[999] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[12px] border border-secondary/30 bg-surface-container-high px-4 py-3 shadow-2xl backdrop-blur-xl">
            <p className="text-sm font-bold text-white">Dostupna je nova verzija aplikacije.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 rounded-[10px] bg-secondary px-4 py-2 text-xs font-black uppercase tracking-widest text-black hover:bg-yellow-400"
              >
                Osveži sada
              </button>
              <button
                type="button"
                onClick={() => setServiceWorkerUpdateAvailable(false)}
                className="flex-1 rounded-[10px] border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 hover:bg-white/5 hover:text-white"
              >
                Kasnije
              </button>
            </div>
          </div>
        )}

        <AiChatWidget />
      </div>
    </div>
  );
}
