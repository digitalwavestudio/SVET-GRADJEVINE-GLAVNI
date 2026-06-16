import { useEffect, useRef } from 'react';

export function useVisibilityAwareSubscription(
  subscribe: () => (() => void) | undefined | void,
  dependencies: any[]
) {
  useEffect(() => {
    let unsubscribe: (() => void) | undefined | void = subscribe();
    let timeoutId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        timeoutId = setTimeout(() => {
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = undefined;
          }
        }, 60000); // 1 minut
      } else {
        clearTimeout(timeoutId);
        if (!unsubscribe) {
          unsubscribe = subscribe();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
      if (unsubscribe) unsubscribe();
    };
  }, dependencies);
}
