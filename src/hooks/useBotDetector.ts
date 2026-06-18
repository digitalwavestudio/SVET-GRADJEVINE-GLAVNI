import { useEffect, useState } from 'react';

/**
 * Hook koji detektuje da li je trenutni klijent bot/crawler.
 * Koristi se za O-O (Oauth-Obfuscation) & Skeleton Indexing,
 * kako bi se izbacile interaktivne komponente i socketi iz render tree-a.
 */
export function useBotDetector(): boolean {
  const [isBot, setIsBot] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Proveravamo globalni flag od strane servera ili interpretiramo User-Agent na klijentu
    if (window.__IS_BOT__) {
      setIsBot(true);
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot',
      'googlebot',
      'crawler',
      'spider',
      'robot',
      'crawling',
      'chatgpt',
      'claude',
      'perplexity'
    ];

    const detected = botPatterns.some(pattern => ua.includes(pattern));
    setIsBot(detected);
  }, []);

  return isBot;
}
