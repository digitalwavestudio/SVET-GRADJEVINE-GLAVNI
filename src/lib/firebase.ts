import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const config = { ...firebaseConfig };
if (
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  // Use custom domain as authDomain so redirect stays on same origin
  // (firebaseapp.com often has a Hosting redirect -> svetgradjevine.com, breaking the auth flow)
  config.authDomain = window.location.host;
}

const app = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let dbInstance: any = null;
try {
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('[FIREBASE] Firestore init failed:', err?.message || err);
}
export const db = dbInstance;
