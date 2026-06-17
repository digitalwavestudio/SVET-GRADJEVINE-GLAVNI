/// <reference types="vite/client" />
interface Window {
  __PRELOADED_JOB_DATA__?: any;
}

declare module 'firebase/firestore' {
  export * from '@firebase/firestore';
}
