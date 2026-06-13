import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function listAuthUsers() {
  console.log('--- KORISNICI U FIREBASE AUTH ---');
  const result = await auth.listUsers(10);
  if (result.users.length === 0) {
    console.log('Nema registrovanih korisnika u Firebase Auth.');
    return;
  }
  
  result.users.forEach(user => {
    console.log(`UID: ${user.uid}`);
    console.log(`Email: ${user.email}`);
    console.log(`Ime: ${user.displayName || 'N/A'}`);
    console.log(`Kreiran: ${user.metadata.creationTime}`);
    console.log('------------------------');
  });
}

listAuthUsers().catch(console.error);
