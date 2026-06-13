import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUsers() {
  console.log('--- KORISNICI U BAZI ---');
  const snapshot = await db.collection('users').get();
  if (snapshot.empty) {
    console.log('Nema korisnika u users kolekciji.');
    return;
  }
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`Ime: ${data.firstName || ''} ${data.lastName || ''}`);
    console.log(`Email: ${data.email || ''}`);
    console.log(`Uloga: ${data.role || 'nema'}`);
    console.log(`Datum kreiranja: ${data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt) : 'nema'}`);
    console.log('------------------------');
  });
}

checkUsers().catch(console.error);
