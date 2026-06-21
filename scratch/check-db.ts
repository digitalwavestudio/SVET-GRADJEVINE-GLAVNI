import { ensureInitialized, db } from "./server/config/firebase.ts";
import { env } from "./server/config/env.ts";

async function check() {
  ensureInitialized();
  console.log("Database initialized. Project:", env.GOOGLE_CLOUD_PROJECT);
  
  const snap = await db.collection("listings")
    .where("status", "==", "active")
    .limit(10)
    .get();
    
  console.log("Total active listings:", snap.size);
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Title: ${data.title || data.name} | isPremium: ${data.isPremium} | isUrgent: ${data.isUrgent} | description: ${data.description || data.body}`);
  });
}

check().catch(console.error);
