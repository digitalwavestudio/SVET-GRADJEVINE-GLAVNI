import firebaseLib from './lib/firebase';
import * as legacyFirebase from './firebase';

export const getFirestoreSafe = firebaseLib.getFirestoreSafe;
export const ensureFirebase = firebaseLib.ensureFirebase;

// Prefer legacy `db` if available (keeps existing behavior), otherwise fallback
export const db = (legacyFirebase as any).db ?? getFirestoreSafe();

export default {
	getFirestoreSafe,
	ensureFirebase,
	db,
};

