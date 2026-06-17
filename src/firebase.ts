import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const config = { ...firebaseConfig };

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    config.authDomain = hostname;
  }
}

export const app = getApps().length === 0 ? initializeApp(config) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let dbInstance: any = null;
try {
  dbInstance = initializeFirestore(app, {}, (firebaseConfig as any).firestoreDatabaseId);
} catch (err: any) {
  console.warn('[FIREBASE] Firestore init failed or already initialized.', err?.message || err);
}

export const db = dbInstance;

if (typeof window !== 'undefined') {
  (window as any).__firebase_auth = auth;
  import('firebase/auth').then(({ signInWithCustomToken }) => {
    (window as any).__signInWithCustomToken = signInWithCustomToken;
  }).catch((err) => console.warn("[Firebase] Failed to load signInWithCustomToken", err));
}

