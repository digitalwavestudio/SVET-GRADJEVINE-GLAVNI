import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, dashboardKeys } from '../lib/queryKeysFactory';
import { auth } from '../firebase';
import { onIdTokenChanged } from 'firebase/auth';

export function useRealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // ENTERPRISE GUARD: HTTP/1.1 Connection Exhaustion Prevention
    const isDev = import.meta.env.DEV;

    if (isDev) {
      console.log('🛡️ [QoS Adaptive Mode] Sandboxed Dev environment detected. Using lightweight transient polling instead of persistent SSE connection to prevent HTTP/1.1 connection exhaustion.');
      
      const pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          console.log('[QoS Polling] Performing transient cache synchronization...');
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        }
      }, 600000); // 10 minuta transient pulse is optimal for sandbox environment

      // Perform a quick initial pulse
      queryClient.invalidateQueries({ queryKey: ['activities'] });

      return () => {
        clearInterval(pollInterval);
      };
    }

    let active = true;
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    let isFallbackActive = false;

    const unsubscribeAuth = onIdTokenChanged(auth, async (fbUser) => {
      if (!active) return;

      // Close previous EventSource connection if it exists
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (!fbUser) {
        return;
      }

      try {
        const token = await fbUser.getIdToken();
        if (!active) return;

        let url = '/api/stream';
        if (token) {
          url += `?token=${encodeURIComponent(token)}`;
        }

        eventSource = new EventSource(url, {
          withCredentials: true
        });

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[SSE] Received event:', data);
            if (data.type === 'NEW_MESSAGE' || data.type === 'MESSAGE_READ' || data.type === 'ping') {
              queryClient.invalidateQueries({ queryKey: ['activities'] });
            }
          } catch (err) {
            console.error('[SSE] Event parsing error:', err);
          }
        };

        eventSource.onerror = (err) => {
          console.warn('[SSE] EventSource error', err);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          
          if (!isFallbackActive && active) {
            console.warn('[QoS Adaptive Mode] SSE connection failed. Falling back to transient polling mechanism.');
            isFallbackActive = true;
            
            fallbackInterval = setInterval(() => {
              if (document.visibilityState === 'visible') {
                console.log('[QoS Polling Fallback] Syncing...');
                queryClient.invalidateQueries({ queryKey: ['activities'] });
              }
            }, 600000);
          }
        };
      } catch (err) {
        console.error('[SSE] Failed to connect:', err);
      }
    });

    return () => {
      active = false;
      unsubscribeAuth();
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [user, queryClient]);
}
