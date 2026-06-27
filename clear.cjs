const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "gen-lang-client-0548525213"
  });
}

const db = admin.firestore();

async function deleteFastPath() {
  console.log("Deleting fast path document...");
  await db.collection("metadata").doc("homepage_fastpath_v17").delete();
  console.log("Deleted fast path!");
}

deleteFastPath().catch(console.error).then(() => process.exit(0));
