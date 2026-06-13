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
  console.log('--- PRETRAGA KORISNIKA ---');
  // Firebase Authentication ne cuva podatke u Firestore automatski ukoliko to klijentska aplikacija ne uradi.
  // Provericemo "users" kolekciju i "metadata" ako postoji
  const collections = await db.listCollections();
  console.log('Postojeće kolekcije u bazi:', collections.map(c => c.id).join(', '));
  
  for (const col of collections) {
    if (col.id.toLowerCase().includes('user') || col.id.toLowerCase().includes('member') || col.id.toLowerCase().includes('profil')) {
      const snapshot = await db.collection(col.id).get();
      console.log(`\nSadržaj kolekcije "${col.id}" (${snapshot.size} dokumenata):`);
      snapshot.forEach(doc => {
        console.log(`- ID: ${doc.id} =>`, JSON.stringify(doc.data()));
      });
    }
  }
}

checkUsers().catch(console.error);
