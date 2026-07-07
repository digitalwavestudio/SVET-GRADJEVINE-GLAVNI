import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "firebase-service-account.json"), "utf-8")
);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

(async () => {
  const fpDoc = await db.doc("metadata/homepage_fastpath").get();
  if (!fpDoc.exists) {
    console.log("Fast-Path ne postoji.");
    process.exit(0);
  }
  const data = fpDoc.data()!;
  const hp = data.homepage || {};
  const allJobs = hp.latestJobs || [];
  
  // Filtriramo premium, uzimamo prvih 5
  const nonPremium = allJobs.filter((j: any) => !j.isPremium).slice(0, 5);
  
  console.log(`Bilo: ${allJobs.length} poslova (${allJobs.filter((j:any) => j.isPremium).length} premium)`);
  console.log(`Sad: ${nonPremium.length} ne-premium poslova`);
  
  hp.latestJobs = nonPremium;
  await db.doc("metadata/homepage_fastpath").set({ homepage: hp, updatedAt: new Date().toISOString() }, { merge: true });
  
  console.log("Fast-Path ispravljen!");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
