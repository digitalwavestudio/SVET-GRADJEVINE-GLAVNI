import { useState, useEffect } from 'react';
import { getOfflineStatus, getQuotaExceeded, subscribeToOfflineStatus, subscribeToQuotaStatus } from '@/src/lib/errorUtils';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(getOfflineStatus());
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(getQuotaExceeded());

  useEffect(() => {
    const unsubOffline = subscribeToOfflineStatus(setIsOffline);
    const unsubQuota = subscribeToQuotaStatus(setIsQuotaExceeded);
    
    return () => {
      unsubOffline();
      unsubQuota();
    };
  }, []);

  return { isOffline, isQuotaExceeded };
}
