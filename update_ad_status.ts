import { db } from './server/config/firebase.ts';

(async () => {
  try {
    const adId = 'DBFHF7cweRL6voTRfbzx';
    const adRef = db.collection('listings').doc(adId);
    const doc = await adRef.get();
    if (!doc.exists) {
      console.log('Ad not found');
      return;
    }
    await adRef.update({
      status: 'active',
      moderationStatus: 'approved',
    });
    console.log(`✅ Ad ${adId} updated to active/approved`);
  } catch (e) {
    console.error('Error updating ad', e);
  }
})();
