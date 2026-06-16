/**
 * Svet Građevine - Enterprise Performance Monitoring Core
 * Integration with Firebase Performance SDK & OpenTelemetry
 */
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
 // import { trace } from 'firebase/performance';
// import { perf } from '../firebase-app';
import { exportService } from './exportService';
import { getTracer } from './tracing';
// import { SpanStatusCode, type Span } from '@opentelemetry/api';

const perf = null;
const SpanStatusCode = { OK: 0, ERROR: 1 } as any;
const trace = (...args: any[]) => ({ start: () => {}, stop: () => {}, putAttribute: () => {} }) as any;
type Span = any;
type Trace = any;

const tracer = getTracer('app-performance');

const ENABLE_LOGS = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERF_LOGS === 'true';

const logger = {
  info: (msg: string, data?: any) => {
    if (!ENABLE_LOGS) return;
    console.log(`%c[PERF] ${msg}`, 'color: #ffad3a; font-weight: bold;', data || '');
  },
  error: (msg: string, error?: any) => {
    console.error(`%c[PERF_ERROR] ${msg}`, 'color: #ff4d4d; font-weight: bold;', error || '');
  }
};

function safePerf<T>(label: string, fn: () => T): T | undefined {
  try { return fn(); } catch (e) { console.warn(`[Perf] ${label}:`, e); return undefined; }
}

/**
 * Executes an async function and records its duration to Firebase Performance & OTel
 */
export const traceAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
  if (!perf) return fn();
  
  const customTrace = trace(perf, name);
  customTrace.start();
  const start = performance.now();
  
  return tracer.startActiveSpan(name, async (span: Span) => {
    try {
      const result = await fn();
      safePerf('customTrace.stop', () => customTrace.stop());
      const end = performance.now();
      const duration = end - start;
      
      span.setStatus({ code: SpanStatusCode.OK });

      // Export to BigQuery
      exportService.enqueue({
        type: 'performance',
        name,
        duration,
        route: window.location.pathname
      });

      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      safePerf('customTrace.stop', () => customTrace.stop());
      logger.error(`${name} failed`, error);
      
      exportService.reportError(error, {
        type: 'performance_failure',
        traceName: name,
        operation: 'async_trace'
      });

      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Standardized trace for Firestore queries
 */
export const measureFirebaseQuery = <T,>(collection: string, operation: string, fn: () => Promise<T>) => {
  return traceAsync(`fs_${collection}_${operation}`, fn);
};

/**
 * Measure API Latency with custom attributes & OTel Span
 */
export const trackApiCall = async <T,>(method: string, url: string, fn: () => Promise<T>): Promise<T> => {
  if (!perf) return fn();
  
  const normalizedUrl = url.split('?')[0].replace(/\/[0-9a-fA-F-]{36}/g, '/:id');
  const traceName = `api_${method.toLowerCase()}_${normalizedUrl.slice(0, 20)}`;
  
  const customTrace = trace(perf, traceName);
  customTrace.start();
  
  return tracer.startActiveSpan(traceName, async (span: Span) => {
    try {
      customTrace.putAttribute('method', method);
      customTrace.putAttribute('endpoint', normalizedUrl);
      
      span.setAttributes({
        'http.method': method,
        'http.url': url,
        'http.target': normalizedUrl
      });
      
      const result = await fn();
      
      // FinOps Tracking
      import('./infraTelemetry').then(({ infraTelemetry }) => {
        infraTelemetry.recordApiCall();
        // Rough estimation of egress (headers + body)
        const size = JSON.stringify(result)?.length || 0;
        infraTelemetry.recordEgress(size + 500); 
      }).catch(err => console.warn('[Perf] Infra load error:', err));

      safePerf('customTrace.stop', () => customTrace.stop());
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      safePerf('customTrace.putAttribute+stop', () => {
        customTrace.putAttribute('error', 'true');
        customTrace.stop();
      });
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });

      exportService.reportError(error, {
        type: 'api_failure',
        method,
        url,
        severity: 'medium'
      });

      throw error;
    } finally {
      span.end();
    }
  });
};

/**
 * Page Load & Hydration Monitoring
 */
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  const onLoaded = () => {
    if (window.performance && window.performance.getEntriesByType) {
      const nav = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (nav) {
        logger.info(`Navigation Metrics:`, {
          dns: (nav.domainLookupEnd - nav.domainLookupStart).toFixed(2),
          tcp: (nav.connectEnd - nav.connectStart).toFixed(2),
          ttfb: (nav.responseStart - nav.requestStart).toFixed(2),
          load: nav.loadEventEnd.toFixed(2)
        });
      }
    }
  };

  if (document.readyState === 'complete') {
    onLoaded();
  } else {
    window.addEventListener('load', onLoaded, { once: true });
  }
};

/**
 * Hook for tracking page transitions and route performance
 */
export const usePerformanceNavigation = () => {
  const location = useLocation();
  const currentTrace = useRef<{ trace: Trace; name: string } | null>(null);

  useEffect(() => {
    if (!perf) return;

    if (currentTrace.current) {
      safePerf('trace.stop', () => currentTrace.current!.trace.stop());
      currentTrace.current = null;
    }

    const pathPart = location.pathname.replace(/\//g, '_').slice(1) || 'home';
    const traceName = `view_${pathPart}`.slice(0, 32);
    const t = trace(perf, traceName);
    
    try {
      t.start();
      t.putAttribute('path', location.pathname);
      currentTrace.current = { trace: t, name: traceName };

      const timer = setTimeout(() => {
        if (currentTrace.current && currentTrace.current.trace === t) {
          safePerf('t.stop', () => t.stop());
          currentTrace.current = null;
        }
      }, 3000);

        return () => {
          clearTimeout(timer);
          if (currentTrace.current && currentTrace.current.trace === t) {
            safePerf('t.stop', () => t.stop());
            currentTrace.current = null;
          }
        };
    } catch (err) {
      logger.error(`Failed to manage navigation trace ${traceName}`, err);
    }
  }, [location.pathname]);
};

/**
 * Manual Trace Controller
 */
export function createTrace(name: string) {
  if (!perf) return { start: () => {}, stop: () => {}, putAttribute: () => {} };
  return trace(perf, name);
}

/**
 * Custom Event Tracking
 */
export const trackAction = (name: string, attributes?: Record<string, string>) => {
  if (!perf) return;
  const t = trace(perf, name);
  try {
    t.start();
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => {
        safePerf('t.putAttribute', () => t.putAttribute(k, v));
      });
    }
    safePerf('t.stop', () => t.stop());
    
    // Export to BigQuery & OTel
    const span = tracer.startSpan(name);
    if (attributes) span.setAttributes(attributes);
    span.end();

    exportService.enqueue({
      type: 'event',
      name,
      metadata: attributes
    });
  } catch (err) {
    logger.error(`Track action failed: ${name}`, err);
  }
};
