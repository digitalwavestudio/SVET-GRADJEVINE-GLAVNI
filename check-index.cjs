const fs = require('fs');
const { execSync } = require('child_process');

try {
  console.log("Fetching deployed indexes...");
  const output = execSync("gcloud firestore indexes composite list --project=gen-lang-client-0548525213 --database=ai-studio-13fdc921-7aeb-4652-b1fc-d679d9e4d0d8 --format=json", { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
  const data = JSON.parse(output);
  const found = data.filter(idx => 
    idx.queryScope === 'COLLECTION_GROUP' && 
    idx.fields.length === 3 && 
    idx.fields.some(f => f.fieldPath === 'type') && 
    idx.fields.some(f => f.fieldPath === 'status') && 
    idx.fields.some(f => f.fieldPath === 'createdAt')
  );
  console.log('Deployed indexes matching type+status+createdAt:', found.length);
  if (found.length > 0) {
    console.log(JSON.stringify(found, null, 2));
  }
} catch (e) {
  console.error(e);
}
