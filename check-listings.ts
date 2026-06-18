import { db } from "./server/config/firebase.ts";

async function run() {
  const snap = await db.collection("listings").where("type", "==", "job").limit(5).get();
  console.log(`Found ${snap.docs.length} jobs in Firestore:`);
  for (const doc of snap.docs) {
    const data = doc.data();
    console.log(`- ID: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Location: ${data.location} | Loc: ${data.loc}`);
    console.log(`  Salary: ${data.salary} | Sal: ${data.sal}`);
    console.log(`  Benefits:`, data.benefits);
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
