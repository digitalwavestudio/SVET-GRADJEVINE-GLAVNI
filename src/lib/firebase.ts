import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

function readConfig() {
  return {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) ?? '',
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ?? '',
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ?? '',
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ?? undefined,
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ?? undefined,
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) ?? undefined,
  };
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

try {
  const cfg = readConfig();
  if (cfg.apiKey && cfg.projectId) {
    _app = getApps().length === 0 ? initializeApp(cfg) : getApp();
    _auth = getAuth(_app);
    _db = getFirestore(_app);
    _googleProvider = new GoogleAuthProvider();
  }
} catch (err) {
  console.warn('[FIREBASE] init failed:', err);
}

export const app = _app!;
export const auth = _auth!;
export const db = _db!;
export const googleProvider = _googleProvider!;

export function getAuthSafe(): Auth | null { return _auth; }
export function getFirestoreSafe(): Firestore | null { return _db; }
export function getGoogleProviderSafe(): GoogleAuthProvider | null { return _googleProvider; }
export function isFirebaseAvailable(): boolean { return !!_app; }
export function getAppSafe(): FirebaseApp | null { return _app; }
export function ensureFirebase() {
  return { app: _app, auth: _auth, db: _db, googleProvider: _googleProvider };
}

export default {
  getAuthSafe,
  getFirestoreSafe,
  getGoogleProviderSafe,
  isFirebaseAvailable,
  getAppSafe,
  ensureFirebase,
  auth,
  db,
  googleProvider,
  app,
};
