import { db } from "./config/firebase.ts";

async function check() {
  const allDocs = await db.collection("listings").count().get();
  console.log("Total documents in listings collection:", allDocs.data().count);
  
  const activeDocs = await db.collection("listings").where("status", "==", "active").count().get();
  console.log("Total ACTIVE documents in listings collection:", activeDocs.data().count);
}

check().catch(console.error).finally(() => process.exit(0));
