import { useEffect, useRef, useState } from 'react';
import { viewStatsService } from '@/src/services/viewStatsService';

/**
 * Custom hook for tracking views with basic bot protection and status return
 */
export const useTrackView = (id: string | undefined, collectionName: string, authorId?: string) => {
  const hasTracked = useRef(false);
  const [isTrackedInSession, setIsTrackedInSession] = useState(false);

  useEffect(() => {
    if (!id || hasTracked.current) return;

    const trackView = async () => {
      // Koristimo centralni servis koji brine o sessionStorage, API pozivu i throttling-u
      await viewStatsService.incrementThrottled(collectionName, id, 'viewsCount', authorId);
      hasTracked.current = true;
      setIsTrackedInSession(true);
    };

    // Delay to avoid counting bounces (3 sekunde)
    const timer = setTimeout(trackView, 3000);

    return () => clearTimeout(timer);
  }, [id, collectionName, authorId]);

  return { isTrackedInSession };
};
