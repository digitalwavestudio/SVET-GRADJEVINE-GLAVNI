import { ApiClient } from '@svet-gradjevine/api';
import { getLazyAuth } from './firebase';
import { circuitBreaker } from './circuitBreaker';
import { trackApiCall } from './performance';
import { safeLocalStorage } from './safeStorage';

const getDeviceId = () => {
    let deviceId = safeLocalStorage.getItem('sg_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        safeLocalStorage.setItem('sg_device_id', deviceId);
    }
    return deviceId;
};

const baseClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  getToken: async () => {
    const authInst = await getLazyAuth();
    if (authInst?.currentUser) {
      return await authInst.currentUser.getIdToken();
    }
    return null;
  },
  getHeaders: async () => {
    return {
      'x-device-id': getDeviceId()
    };
  }
});

// Registry of active AbortControllers to handle browser-tab visibility hard kills
export const activeRequests = new Set<AbortController>();

// Proxy wrapper over base apiClient to inject the Enterprise Circuit Breaker & Performance Tracing
export const apiClient = new Proxy(baseClient, {
  get(target, prop: string | symbol) {
    const orig = (target as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof orig === 'function') {
      const method = prop as string;
      if (['get', 'post', 'patch', 'put', 'delete', 'del'].includes(method)) {
        return async (url: string, ...args: any[]) => {
          const isRead = method === 'get';
          
          const controller = new AbortController();
          activeRequests.add(controller);

          // Add signal dynamically into RequestInit options based on method signature
          const optionsIdx = ['get', 'delete', 'del'].includes(method) ? 0 : 1;
          const originalOptions = args[optionsIdx] || {};
          args[optionsIdx] = { ...originalOptions, signal: controller.signal };
          
          // Performance Tracking Wrapper
          const apiRequestTask = async () => {
            // 1. If read endpoint and circuit breaker is open (tripped), attempt serving local fallback
            if (isRead && circuitBreaker.isTripped(url)) {
              const fallback = circuitBreaker.getCachedFallback(url);
              if (fallback !== null) {
                return fallback;
              }
            }
            
            try {
              const result = await (orig as (...args: unknown[]) => Promise<unknown>).apply(target, [url, ...args]);
              // Record successful API call & save data payload (if any)
              circuitBreaker.recordResult(url, true, result);
              return result;
            } catch (error: unknown) {
              // Ignore aborted request errors from logging or tripping the breaker (since they are client triggered)
              if (error instanceof Error && error.name === 'AbortError') {
                throw error;
              }
              
              // Determine if error is a candidate for tripping circuit (>=500 or full network dropout/timeout)
              const err = error as { status?: number; statusCode?: number; response?: { status?: number }; message?: string };
              const status = err?.status || err?.statusCode || err?.response?.status || 500;
              const isNetworkOrServerErr = status >= 500 || !navigator.onLine || err?.message?.toLowerCase().includes('fetch') || err?.message?.toLowerCase().includes('network');
              
              if (isNetworkOrServerErr) {
                circuitBreaker.recordResult(url, false);
                
                // 2. Fallback to localStorage on request failure to avoid white screens
                if (isRead) {
                  const fallback = circuitBreaker.getCachedFallback(url);
                  if (fallback !== null) {
                    return fallback;
                  }
                }
              }
              throw error;
            } finally {
              // Remove AbortController once done
              activeRequests.delete(controller);
            }
          };

          return trackApiCall(method, url, apiRequestTask);
        };
      }
      return orig.bind(target);
    }
    return orig;
  }
});
