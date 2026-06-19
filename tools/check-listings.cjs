const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'gcloud', 'legacy_credentials',
  'firebase-adminsdk-fbsvc@gen-lang-client-0548525213.iam.gserviceaccount.com', 'adc.json');
const sa = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
sa.project_id = 'gen-lang-client-0548525213';

admin.initializeApp({
  credential: admin.credential.cert(sa),
  projectId: 'gen-lang-client-0548525213'
});

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  // 1) Premium query: status IN ["active","approved"] AND isPremium==true, ordered by createdAt desc
  console.log('=== Premium Listings Query ===');
  const snapshot = await db.collectionGroup('listings')
    .where('status', 'in', ['active', 'approved'])
    .where('isPremium', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  console.log(`Total matching premium documents: ${snapshot.size}`);
  console.log('');

  if (snapshot.size > 0) {
    snapshot.forEach(doc => {
      const d = doc.data();
      const ts = d.createdAt;
      const createdStr = ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : (ts || '(none)');
      console.log(`ID: ${doc.id}`);
      console.log(`  Title:       ${d.title || '(no title)'}`);
      console.log(`  Status:      ${d.status}`);
      console.log(`  isPremium:   ${d.isPremium}`);
      console.log(`  CreatedAt:   ${createdStr}`);
      console.log(`  Type:        ${d.type || '(no type)'}`);
      console.log(`  Location:    ${d.locationSlug || d.grad || '(none)'}`);
      console.log(`  Category:    ${d.mainCategories ? (Array.isArray(d.mainCategories) ? d.mainCategories.join(', ') : d.mainCategories) : '(none)'}`);
      console.log('');
    });
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.code === 9 || (err.message && err.message.includes('index'))) {
    console.log('\nRequired composite index is missing. Deploy indexes from firestore.indexes.json first.');
  }
  process.exit(1);
});
