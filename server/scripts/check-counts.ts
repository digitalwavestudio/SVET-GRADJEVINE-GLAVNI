import { db } from "../config/firebase.ts";

async function main() {
  const statuses = ["active", "approved", "draft", "pending", "deleted", "rejected"];
  
  const totalSnap = await db.collection("listings").where("type", "==", "job").count().get();
  console.log("Total jobs (all statuses):", totalSnap.data().count);
  
  for (const s of statuses) {
    const c = await db.collection("listings").where("type", "==", "job").where("status", "==", s).count().get();
    console.log(`  ${s}: ${c.data().count}`);
  }
  
  const allTypes = await db.collection("listings").count().get();
  console.log("\nTotal all listings:", allTypes.data().count);
}

main().catch(e => console.error(e)).finally(() => process.exit(0));
