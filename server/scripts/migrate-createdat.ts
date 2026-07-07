import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "firebase-service-account.json"), "utf-8")
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore(admin.app());
db.settings({ ignoreUndefinedProperties: true });

async function main() {
  const entities = ["job", "machine", "realEstate", "accommodation", "catering", "article"];

  for (const entity of entities) {
    const snap = await db.collection("listings")
      .where("type", "==", entity)
      .get();

    let converted = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const ca = data.createdAt;

      if (ca && typeof ca.toDate === "function") {
        const iso = ca.toDate().toISOString();
        await doc.ref.update({ createdAt: iso });
        console.log(`[${entity}] ${doc.id}: Timestamp -> ${iso}`);
        converted++;
      }
    }
    console.log(`[${entity}] ${converted} converted out of ${snap.docs.length} total`);
  }

  console.log("Migration complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
