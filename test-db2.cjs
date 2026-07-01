const a = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

if (fs.existsSync('./firebase-service-account.json')) {
  a.initializeApp({ credential: a.credential.cert(require('./firebase-service-account.json')) });
  const db = getFirestore(a.app(), "ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8");
  
  db.collection('listings').where('type', '==', 'company').get().then(snap => {
    console.log(`Found ${snap.size} companies`);
    snap.docs.forEach(doc => {
      const d = doc.data();
      console.log(`${doc.id} => ${d.title || d.name || d.companyName} status: ${d.status} type: ${d.type}`);
    });
  }).catch(console.error);
} else {
  console.log("No service account.");
}
