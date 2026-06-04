import { initializeFirestore } from 'firebase/firestore';
import { app } from './firebase-app';
import firebaseConfig from '../firebase-applet-config.json';
const config = firebaseConfig;

let dbInstance: any = null;

try {
  dbInstance = initializeFirestore(app, {}, config.firestoreDatabaseId);
} catch (err: any) {
  console.error('[FIREBASE_DB] Critical fallback Firestore initialization failed.', err);
  // Do not throw. Falling back to null, handle softly later or retry in components.
}

export const db = dbInstance;

