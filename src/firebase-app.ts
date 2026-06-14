import firebaseLib from './lib/firebase';
import * as legacyFirebase from './firebase';

export const ensureFirebase = firebaseLib.ensureFirebase;
export const getFirebaseApp = firebaseLib.getAppSafe;
export const isFirebaseAvailable = firebaseLib.isFirebaseAvailable;

export const app = (legacyFirebase as any).app ?? getFirebaseApp();

export default {
	ensureFirebase,
	getFirebaseApp,
	isFirebaseAvailable,
	app,
};

