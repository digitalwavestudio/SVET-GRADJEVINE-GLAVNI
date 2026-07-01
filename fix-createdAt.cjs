const a = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

if (fs.existsSync('./firebase-service-account.json')) {
  a.initializeApp({ credential: a.credential.cert(require('./firebase-service-account.json')) });
  const db = getFirestore(a.app(), "ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8");
  
  (async () => {
    try {
      const snap = await db.collection('listings').where('type', '==', 'company').get();
      let fixedCount = 0;
      
      for (const doc of snap.docs) {
        const d = doc.data();
        if (!d.createdAt) {
          console.log(`Fixing doc: ${doc.id}`);
          await doc.ref.update({
            createdAt: FieldValue.serverTimestamp()
          });
          fixedCount++;
        }
      }
      
      console.log(`Fixed ${fixedCount} documents.`);
    } catch (e) {
      console.error(e);
    }
  })();
} else {
  console.log("No service account.");
}
