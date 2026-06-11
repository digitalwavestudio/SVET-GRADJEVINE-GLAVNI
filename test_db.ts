import { db } from './server/config/firebase.ts';

(async () => {
  try {
    const snap = await db.collection('listings').where('type', '==', 'job').get();
    console.log(`Found ${snap.size} jobs`);
    snap.forEach(doc => {
      console.log(`- ID: ${doc.id}, title: ${doc.data().title}, status: ${doc.data().status}`);
    });
  } catch (e) {
    console.error('Error', e);
  }
})();
