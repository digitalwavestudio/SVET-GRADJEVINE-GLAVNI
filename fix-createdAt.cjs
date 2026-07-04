const a = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

if (fs.existsSync('./firebase-service-account.json')) {
  a.initializeApp({ credential: a.credential.cert(require('./firebase-service-account.json')) });
  const db = getFirestore(a.app());
  
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
