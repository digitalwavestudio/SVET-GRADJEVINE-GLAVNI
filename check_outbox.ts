import { db } from "./server/config/firebase.ts";
(async () => {
  try {
    const snapshot = await db.collection('outbox').where('status', '==', 'pending').get();
    console.log(`Pending outbox messages: ${snapshot.size}`);
    snapshot.docs.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (e) {
    console.error('Error fetching outbox:', e);
  }
})();
