import firebaseLib from './lib/firebase';
import * as legacyFirebase from './firebase';

export const getAuthSafe = firebaseLib.getAuthSafe;
export const getGoogleProviderSafe = firebaseLib.getGoogleProviderSafe;
export const ensureFirebase = firebaseLib.ensureFirebase;

// Prefer legacy runtime `auth` if present, otherwise fall back to safe getter.
export const auth = (legacyFirebase as any).auth ?? getAuthSafe();
export const googleProvider = (legacyFirebase as any).googleProvider ?? getGoogleProviderSafe();

export default {
	getAuthSafe,
	getGoogleProviderSafe,
	ensureFirebase,
	auth,
	googleProvider,
};

