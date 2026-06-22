import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
// import { onCLS, onINP, onLCP } from 'web-vitals';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/src/lib/queryClient';
import { initZodLocalization } from '@svet-gradjevine/shared';
import { initFrontendTracing } from '@/src/lib/tracing';
import { initErrorMonitor } from '@/src/lib/errorMonitor';
import { installGlobalErrorHandler } from '@/src/lib/globalErrorHandler';
import ErrorBoundary from '@/src/components/common/ErrorBoundary';
import App from '@/src/App';

// Install global error/rejection handlers BEFORE React boots up.
// (Must run before any async work that could throw unhandled rejections.)
installGlobalErrorHandler();

initZodLocalization();
// initFrontendTracing();
// initErrorMonitor();
import './index.css';



/*
function reportWebVitals(metric: any) {
  // Report metrics to Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // values must be integers
      metric_name: metric.name,
      metric_value: metric.value,
      non_interaction: true,
    });
  }
}

onCLS(reportWebVitals);
onINP(reportWebVitals);
onLCP(reportWebVitals);
*/

// vite-plugin-pwa handles the service worker registration automatically 
// when configured with injectRegister: 'auto' in vite.config.ts.
// We remove the unregister logic so the PWA can be installed.

if (import.meta.env.DEV) console.log('[MAIN] Application starting...');

function Root() {
  const [persister, setPersister] = useState<any | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const p = createAsyncStoragePersister({
          storage: {
            getItem: async (key: string) => Promise.resolve(window.localStorage.getItem(key)),
            setItem: async (key: string, value: string) => Promise.resolve(window.localStorage.setItem(key, value)),
            removeItem: async (key: string) => Promise.resolve(window.localStorage.removeItem(key)),
          },
        });
        if (mounted) setPersister(p);
      } else {
        if (mounted) setPersister(null);
      }
    } catch (e) {
      console.warn('Query persister init failed:', e);
      if (mounted) setPersister(null);
    } finally {
      if (mounted) setReady(true);
    }

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return null;

  const content = (
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  );

  if (persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          // Bump buster on any breaking change to the persisted cache shape.
          // Old/malformed entries (e.g. queryKey not an array) are wiped automatically.
          buster: "v2-fix-dehydrate-null-queryKey-2026-06",
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              if (!query?.queryKey || !Array.isArray(query.queryKey)) return false;
              const keysToPersist = ['premium-partners', 'categories', 'static-config', 'configs'];
              return keysToPersist.some((key) => {
                const stringKey = typeof key === 'string' ? key : JSON.stringify(key);
                return query.queryKey.some((qk) => {
                  if (qk === null || qk === undefined) return false;
                  const qkStr = typeof qk === 'string' ? qk : JSON.stringify(qk);
                  return qkStr.includes(stringKey);
                });
              });
            },
          },
        }}
      >
        {content}
      </PersistQueryClientProvider>
    );
  }

  return <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[MAIN] Root element not found!');
} else {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Root />
    </StrictMode>
  );
}
