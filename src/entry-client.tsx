window.onerror = function(message, source, lineno, colno, error) {
  const msgStr = String(message || '').toLowerCase();
  if (
    msgStr.includes('cannot set property fetch') ||
    msgStr.includes('fetch of #<window>') ||
    msgStr.includes('resizeobserver') ||
    msgStr.includes('script error') ||
    msgStr.includes('serviceworker') ||
    msgStr.includes('abort')
  ) {
    console.warn('[Benign Platform Error Ignored]:', message);
    return true;
  }

  try {
    fetch('/api/dev/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'window.onerror', message, source, lineno, colno, stack: error?.stack })
    }).catch(() => console.warn('[Entry] window.onerror log fetch failed'));
  } catch (e) { console.error("[Entry] window.onerror handler error:", e); }

  console.error('[Entry] Global Error:', { message, source, lineno, colno, stack: error?.stack });
};
window.addEventListener('unhandledrejection', function(event) {
  const reasonStr = String(event.reason?.message || event.reason || '').toLowerCase();
  if (
    reasonStr.includes('cannot set property fetch') ||
    reasonStr.includes('fetch of #<window>') ||
    reasonStr.includes('resizeobserver') ||
    reasonStr.includes('serviceworker') ||
    reasonStr.includes('abort')
  ) {
    console.warn('[Benign Rejection Ignored]:', event.reason);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  try {
    fetch('/api/dev/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'unhandledrejection', reason: event.reason?.message || String(event.reason), stack: event.reason?.stack })
    }).catch(() => console.warn('[Entry] unhandledrejection log fetch failed'));
  } catch (e) { console.error("[Entry] unhandledrejection handler error:", e); }

  console.error('[Entry] Unhandled Promise Rejection:', event.reason);
});
import { StrictMode, useEffect, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { QueryClientProvider, hydrate } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/src/lib/queryClient';
import { initZodLocalization } from '@svet-gradjevine/shared';
import ErrorBoundary from '@/src/components/common/ErrorBoundary';
import App from '@/src/App';

initZodLocalization();
import './index.css';

const ssrData = typeof window !== 'undefined' ? (window as any).__SSR_DATA__ : null;
const dehydratedState = ssrData?.dehydratedState;
if (dehydratedState) {
  hydrate(queryClient, dehydratedState);
}

function Root() {
  const [persister, setPersister] = useState<any | null>(null);

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
      }
    } catch (e) {
      console.warn('Query persister init failed:', e);
    }

    return () => {
      mounted = false;
    };
  }, []);

  return persister ? (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
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
      <ErrorBoundary>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    </PersistQueryClientProvider>
  ) : (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Entry] Root element not found!');
} else {
  const hasSsr = rootElement.hasChildNodes() || !!dehydratedState;
  const app = (
    <StrictMode>
      <Root />
    </StrictMode>
  );
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
    navigator.serviceWorker.ready.then(reg => {
      setInterval(() => { reg.update(); }, 60000);
    });
  }

  if (hasSsr) {
    hydrateRoot(rootElement, app, {
      onRecoverableError(error) {
        const err = error as { message?: string; digest?: string };
        if (err.message?.includes('#418') || err.digest?.includes('418')) return;
        console.error(error);
      }
    });
  } else {
    createRoot(rootElement).render(app);
  }
}
