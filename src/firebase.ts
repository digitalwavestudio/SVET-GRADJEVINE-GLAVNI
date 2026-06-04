import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { app } from './firebase-app';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { app };

// Test connection removed to prevent quota-blocking on startup
/*
async function testConnection() {
...
}
testConnection();
*/
