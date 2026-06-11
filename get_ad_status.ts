import { db } from './server/config/firebase.ts';

(async () => {
  try {
    const adId = 'DBFHF7cweRL6voTRfbzx';
    const doc = await db.collection('listings').doc(adId).get();
    if (!doc.exists) {
      console.log('Ad not found');
      return;
    }
    console.log('Ad data:', doc.data());
  } catch (e) {
    console.error('Error fetching ad', e);
  }
})();
