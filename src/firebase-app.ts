import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config.json';

const config = { ...firebaseConfig };

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    config.authDomain = hostname;
  }
}

export let app: any;
export let perf: any;

try {
  app = initializeApp(config);
  console.log('[FIREBASE] Initialized with authDomain:', config.authDomain);
} catch (e) {
  // If app was already initialized, we can just ignore or handle accordingly
}

// Only initialize performance in browser environment
if (typeof window !== 'undefined' && app) {
  try {
    // perf = getPerformance(app);
    console.log('[FIREBASE] Performance SDK disabled to prevent fetch clash');
  } catch (e) {
    console.warn('[FIREBASE] Performance SDK failed to initialize', e);
  }
}

