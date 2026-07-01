const a = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

if (fs.existsSync('./firebase-service-account.json')) {
  a.initializeApp({ credential: a.credential.cert(require('./firebase-service-account.json')) });
} else {
  console.log("No service account json found!");
  process.exit(1);
}

const db = getFirestore(a.app(), 'ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8'); // iz AGENTS.md

(async () => {
  const snap = await db.collection('listings')
    .where('type', '==', 'company')
    .get();
  
  console.log("Companies found in listings:", snap.size);
  snap.forEach(doc => {
    console.log(doc.id, "=>", doc.data().companyName || doc.data().name, "status:", doc.data().status);
  });
})();
