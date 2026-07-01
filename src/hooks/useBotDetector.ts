import { useEffect, useState } from 'react';
import { isBotUserAgent } from '@svet-gradjevine/shared';

export function useBotDetector(): boolean {
  const [isBot, setIsBot] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.__IS_BOT__) {
      setIsBot(true);
      return;
    }

    setIsBot(isBotUserAgent(navigator.userAgent));
  }, []);

  return isBot;
}
