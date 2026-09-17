import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      execute: (widgetId?: string) => void;
      reset: (widgetId?: string) => void;
      getResponse?: (widgetId?: string) => string;
    };
  }
}

const SITE_KEY = (import.meta as any)?.env?.VITE_TURNSTILE_SITE_KEY || '';

let scriptPromise: Promise<void> | null = null;
let widgetId: string | null = null;
let widgetContainer: HTMLDivElement | null = null;
let pendingResolver: ((token: string | null) => void) | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Turnstile script failed to load'));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

async function ensureWidget(): Promise<string | null> {
  if (!SITE_KEY || typeof window === 'undefined') return null;
  if (widgetId && window.turnstile) return widgetId;
  try {
    await loadTurnstileScript();
  } catch {
    return null;
  }
  if (!window.turnstile) return null;
  if (!widgetContainer) {
    widgetContainer = document.createElement('div');
    widgetContainer.setAttribute('aria-hidden', 'true');
    widgetContainer.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    document.body.appendChild(widgetContainer);
  }
  try {
    widgetId = window.turnstile.render(widgetContainer, {
      sitekey: SITE_KEY,
      size: 'invisible',
      callback: (token: string) => {
        pendingResolver?.(token);
        pendingResolver = null;
      },
      'expired-callback': () => {
        pendingResolver?.(null);
        pendingResolver = null;
      },
      'error-callback': () => {
        pendingResolver?.(null);
        pendingResolver = null;
      },
    });
    return widgetId;
  } catch {
    pendingResolver?.(null);
    pendingResolver = null;
    return null;
  }
}

/**
 * Uzmi svež Turnstile token. Vraća null ako site ključ nije podešen
 * ili widget ne uspe — pozivalac tada šalje zahtev bez tokena.
 */
export async function getTurnstileToken(): Promise<string | null> {
  const id = await ensureWidget();
  if (!id || !window.turnstile) return null;
  return new Promise((resolve) => {
    const turnstile = window.turnstile;
    pendingResolver = (token) => {
      try {
        turnstile?.reset(id);
      } catch {
        // ignore reset errors, token je već vraćen
      }
      resolve(token);
    };
    try {
      turnstile?.execute(id);
    } catch {
      pendingResolver = null;
      resolve(null);
    }
    setTimeout(() => {
      if (pendingResolver) {
        pendingResolver = null;
        resolve(null);
      }
    }, 15000);
  });
}

export function turnstileHeaders(token?: string | null): Record<string, string> {
  return token ? { 'x-turnstile-response': token } : {};
}

interface TurnstileContextValue {
  enabled: boolean;
  execute: () => Promise<string | null>;
  reset: () => void;
}

const TurnstileContext = createContext<TurnstileContextValue>({
  enabled: false,
  execute: async () => null,
  reset: () => {},
});

export function TurnstileProvider({ children }: { children: React.ReactNode }) {
  const warmedUp = useRef(false);

  useEffect(() => {
    if (warmedUp.current || !SITE_KEY) return;
    warmedUp.current = true;
    // Zagrej widget unapred da execute na submit bude brz
    ensureWidget().catch(() => {});
  }, []);

  const execute = useCallback(() => getTurnstileToken(), []);
  const reset = useCallback(() => {
    try {
      if (widgetId) window.turnstile?.reset(widgetId);
    } catch {
      // ignore
    }
  }, []);

  return (
    <TurnstileContext.Provider value={{ enabled: !!SITE_KEY, execute, reset }}>
      {children}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  return useContext(TurnstileContext);
}
