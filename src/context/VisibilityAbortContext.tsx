import React, { createContext, useContext, useEffect } from 'react';
import { activeRequests } from '../lib/apiClient';

const VisibilityAbortContext = createContext<null>(null);

export const VisibilityAbortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If document is invisible (tab inactive), force abort all pending network requests in browser
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        console.warn(`[VisibilityAbortProvider] Tab hidden. Force-aborting ${activeRequests.size} active browser-level fetch requests...`);
        for (const controller of activeRequests) {
          try {
            controller.abort();
          } catch (e) {
            console.error('[VisibilityAbortProvider] Abort error:', e);
          }
        }
        activeRequests.clear();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  return (
    <VisibilityAbortContext.Provider value={null}>
      {children}
    </VisibilityAbortContext.Provider>
  );
};

export const useVisibilityAbort = () => useContext(VisibilityAbortContext);
