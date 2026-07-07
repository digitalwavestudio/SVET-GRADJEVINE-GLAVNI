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
  await db.doc("metadata/homepage_fastpath").delete();
  await db.doc("metadata/promoted_ads_fastpath").delete();
  console.log("Fast-Path dokumenti obrisani.");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
