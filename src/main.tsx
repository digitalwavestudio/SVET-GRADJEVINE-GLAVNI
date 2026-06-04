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
    return true; // Cancel error bubbling & console dump
  }

  try {
    fetch('/api/dev/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'window.onerror', message, source, lineno, colno, stack: error?.stack })
    }).catch(() => {});
  } catch (e) {}

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; color: red; background: #222; font-family: monospace;">` +
      `<h2>Global Error Caught!</h2>` +
      `<p><strong>Message:</strong> ${message}</p>` +
      `<p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>` +
      `<pre>${error?.stack || ''}</pre>` +
      `</div>`;
  }
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
    }).catch(() => {});
  } catch (e) {}

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; color: red; background: #222; font-family: monospace;">` +
      `<h2>Unhandled Promise Rejection!</h2>` +
      `<pre>${event.reason?.stack || String(event.reason)}</pre>` +
      `</div>`;
  }
});
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// import { onCLS, onINP, onLCP } from 'web-vitals';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient, persister } from '@/src/lib/queryClient';
import { initZodLocalization } from '@svet-gradjevine/shared';
import { initFrontendTracing } from '@/src/lib/tracing';
import { initErrorMonitor } from '@/src/lib/errorMonitor';
import ErrorBoundary from '@/src/components/common/ErrorBoundary';
import App from '@/src/App';

initZodLocalization();
// initFrontendTracing();
// initErrorMonitor();
import './index.css';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

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

console.log('[MAIN] Application starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[MAIN] Root element not found!');
} else {
  console.log('[MAIN] Rendering to root');
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <ErrorBoundary>
        {persister ? (
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister,
              maxAge: 1000 * 60 * 60 * 24, // 24 sata
              dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                  const keysToPersist = ["premium-partners", "categories", "magazine", "static-config", "configs"];
                  return keysToPersist.some((key) => {
                    const stringKey = typeof key === "string" ? key : JSON.stringify(key);
                    return query.queryKey.some((qk) => {
                      const qkStr = typeof qk === "string" ? qk : JSON.stringify(qk);
                      return qkStr.includes(stringKey);
                    });
                  });
                },
              },
            }}
          >
            <HelmetProvider>
              <App />
            </HelmetProvider>
          </PersistQueryClientProvider>
        ) : (
          <QueryClientProvider client={queryClient}>
            <HelmetProvider>
              <App />
            </HelmetProvider>
          </QueryClientProvider>
        )}
      </ErrorBoundary>
    </StrictMode>
  );
}
