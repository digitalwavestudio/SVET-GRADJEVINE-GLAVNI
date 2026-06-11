// process_pending.ts
import { db } from './server/config/firebase.ts';
import { OutboxWorker } from './server/services/outbox.worker.ts';
import { Logger } from './server/utils/logger.ts';

(async () => {
  const snap = await db.collection('outbox').where('status', '==', 'pending').get();
  if (snap.empty) {
    console.log('✅ No pending outbox messages.');
    return;
  }
  console.log(`Found ${snap.size} pending messages. Processing...`);
  for (const doc of snap.docs) {
    const data = doc.data();
    const msg = { id: doc.id, ...data };
    try {
      await OutboxWorker.processSingleMessage(msg);
    } catch (e) {
      console.error('Error processing', doc.id, e);
    }
  }
  console.log('✅ Processing complete.');
})();
