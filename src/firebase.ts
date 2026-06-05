import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { app } from './firebase-app';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  (window as any).__firebase_auth = auth;
  import('firebase/auth').then(({ signInWithCustomToken }) => {
    (window as any).__signInWithCustomToken = signInWithCustomToken;
  }).catch(console.error);
}

export { app };

// Test connection removed to prevent quota-blocking on startup
/*
async function testConnection() {
...
}
testConnection();
*/
