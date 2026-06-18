/// <reference types="vite/client" />
interface Window {
  __PRELOADED_JOB_DATA__?: any;
  __IS_BOT__?: boolean;
  __APP_ENV__?: Record<string, string>;
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}

declare module 'firebase/firestore' {
  export * from '@firebase/firestore';
}
