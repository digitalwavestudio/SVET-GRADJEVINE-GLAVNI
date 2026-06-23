import { getApps, getApp, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Match old src/firebase.ts behavior exactly
const app = getApps().length === 0 ? initializeApp({ ...firebaseConfig }) : getApp();

let authInstance: any = null;
let googleProviderInstance: any = null;
let authInitPromise: Promise<void> | null = null;
export async function getLazyAuth() {
  if (!authInitPromise) {
    authInitPromise = (async () => {
      const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
      authInstance = getAuth(app);
      googleProviderInstance = new GoogleAuthProvider();
    })();
  }
  await authInitPromise;
  return authInstance;
}
export function getLazyGoogleProvider() {
  return googleProviderInstance;
}

let dbInstance: any = null;
try {
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('[FIREBASE] Firestore init failed:', err?.message || err);
}
export const db = dbInstance;
