import { db } from "./server/config/firebase.ts";

async function test() {
  try {
    console.log("Testing type + createdAt...");
    const snap1 = await db.collectionGroup("listings").where("type", "==", "job").orderBy("createdAt", "desc").limit(2).get();
    console.log("Success! size:", snap1.size);
  } catch (e: any) {
    console.error("Error type+createdAt:", e.message);
  }

  try {
    console.log("\nTesting type + status + createdAt...");
    const snap2 = await db.collectionGroup("listings").where("type", "==", "job").where("status", "in", ["active", "approved"]).orderBy("createdAt", "desc").limit(2).get();
    console.log("Success! size:", snap2.size);
  } catch (e: any) {
    console.error("Error type+status+createdAt:", e.message);
  }
}
test();
