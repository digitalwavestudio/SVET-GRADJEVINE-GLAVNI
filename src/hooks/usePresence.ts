import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { presenceService } from '@/src/services/presenceService';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Presence Hook
 * Manages the heartbeat for the current user and provides a way to check others.
 */
export function usePresence() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    // Samo jedna provera pri mount-u
    presenceService.updatePresence();

    // NEMA unutrašnjeg intervala. Oslanjamo se na visibilitychange ili manualni refresh.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        presenceService.updatePresence();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.uid]);
}

/**
 * Hook to track another user's online status
 * Migrated to TanStack Query for optimal caching and lifecycle management
 */
export function useUserStatus(userId?: string | null) {
  const { data: status } = useQuery({
    queryKey: ['user', userId || 'anonymous', 'presence'],
    queryFn: async () => {
      if (!userId) return { isOnline: false };
      return presenceService.getUserStatus(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, 
    refetchOnWindowFocus: false,
  });

  return status || { isOnline: false };
}
