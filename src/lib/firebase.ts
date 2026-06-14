// src/lib/firebase.ts
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

let _app: FirebaseApp | null | undefined;
let _auth: Auth | null | undefined;
let _db: Firestore | null | undefined;
let _googleProvider: GoogleAuthProvider | null | undefined;

function initAppOnce(): FirebaseApp | null {
  if (typeof _app !== 'undefined') return _app;
  try {
    const cfg = readConfig();
    if (!cfg.apiKey || !cfg.projectId) {
      console.warn('Firebase config incomplete — skipping client init.');
      _app = null;
      return _app;
    }

    if (getApps().length === 0) {
      _app = initializeApp(cfg);
    } else {
      _app = getApp();
    }
    return _app;
  } catch (err) {
    console.warn('Firebase initialization failed:', err);
    _app = null;
    return _app;
  }
}

export function ensureFirebase() {
  const app = initAppOnce();
  if (!app) {
    if (typeof _auth === 'undefined') _auth = null;
    if (typeof _db === 'undefined') _db = null;
    if (typeof _googleProvider === 'undefined') _googleProvider = null;
    return { app: null, auth: null, db: null, googleProvider: null } as const;
  }

  if (typeof _auth === 'undefined') {
    try {
      _auth = getAuth(app);
    } catch (e) {
      console.warn('getAuth failed:', e);
      _auth = null;
    }
  }

  if (typeof _db === 'undefined') {
    try {
      _db = getFirestore(app);
    } catch (e) {
      console.warn('getFirestore failed:', e);
      _db = null;
    }
  }

  if (typeof _googleProvider === 'undefined') {
    try {
      _googleProvider = new GoogleAuthProvider();
    } catch (e) {
      console.warn('GoogleAuthProvider init failed:', e);
      _googleProvider = null;
    }
  }

  return { app: _app, auth: _auth, db: _db, googleProvider: _googleProvider } as const;
}

export function getAppSafe(): FirebaseApp | null {
  return initAppOnce();
}

export function getAuthSafe(): Auth | null {
  if (typeof _auth === 'undefined') ensureFirebase();
  return _auth ?? null;
}

export function getFirestoreSafe(): Firestore | null {
  if (typeof _db === 'undefined') ensureFirebase();
  return _db ?? null;
}

export function getGoogleProviderSafe(): GoogleAuthProvider | null {
  if (typeof _googleProvider === 'undefined') ensureFirebase();
  return _googleProvider ?? null;
}

export function isFirebaseAvailable(): boolean {
  return Boolean(getAppSafe());
}

export default {
  ensureFirebase,
  getAppSafe,
  getAuthSafe,
  getFirestoreSafe,
  getGoogleProviderSafe,
  isFirebaseAvailable,
};
