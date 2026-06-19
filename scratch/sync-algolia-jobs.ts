import { db } from "../server/config/firebase.ts";
import { syncAdsToIndex, setupAlgoliaIndexSettings } from "../server/services/algolia.service.ts";
import { env } from "../server/config/env.ts";

async function run() {
  try {
    console.log("Configuring indices...");
    await setupAlgoliaIndexSettings();
    console.log("Indices configured.");

    const snap = await db.collection("listings").where("type", "==", "job").get();
    console.log(`Found ${snap.docs.length} job listings. Syncing to Algolia...`);
    const objects = snap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    
    // Batch in 100s
    for (let i = 0; i < objects.length; i += 100) {
      const batch = objects.slice(i, i + 100);
      await syncAdsToIndex(env.ALGOLIA_INDEX_NAME || "listings", batch);
      console.log(`Synced batch ${i/100 + 1}`);
    }
    console.log("Done.");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
