import { db } from './server/config/firebase.ts';
(async () => {
  try {
    const snap = await db.collection('listings')
      .where('status', 'in', ['pending', 'pending_payment'])
      .get();
    console.log(`🔎 Found ${snap.size} listings with pending status`);
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`- ID: ${doc.id}, title: ${data.title || 'N/A'}, status: ${data.status}`);
    });
  } catch (e) {
    console.error('❌ Error querying listings', e);
  }
})();
