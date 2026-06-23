import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Match old src/firebase.ts behavior exactly
const app = getApps().length === 0 ? initializeApp({ ...firebaseConfig }) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let dbInstance: any = null;
try {
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
} catch (err: any) {
  console.warn('[FIREBASE] Firestore init failed:', err?.message || err);
}
export const db = dbInstance;
