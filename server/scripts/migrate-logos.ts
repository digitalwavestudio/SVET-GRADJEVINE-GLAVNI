import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "firebase-service-account.json"), "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "svet-gradjevine-eu.firebasestorage.app",
});
const db = getFirestore();
const bucket = admin.storage().bucket();

async function migrateLogos() {
  console.log("Krecem migraciju logoa iz base64 u Firebase Storage...\n");

  const snap = await db.collection("listings")
    .select("logo")
    .get();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const doc of snap.docs) {
    const logo = doc.data().logo;
    if (!logo || typeof logo !== "string" || !logo.startsWith("data:")) {
      skipped++;
      continue;
    }

    const id = doc.id;
    const match = logo.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      console.log(`  [SKIP] ${id} - nepoznat format logoa`);
      skipped++;
      continue;
    }

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.split("/")[1] || "png";
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `logos/${id}.${ext}`;
    const file = bucket.file(fileName);

    try {
      await file.save(buffer, {
        metadata: { contentType: mimeType },
      });

      await file.makePublic();

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

      await db.collection("listings").doc(id).update({ logo: publicUrl });

      migrated++;
      if (migrated % 10 === 0) {
        console.log(`  ... ${migrated} logova migrirano`);
      }
    } catch (err: any) {
      console.error(`  [ERR] ${id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nGotovo!`);
  console.log(`  Migrirano: ${migrated}`);
  console.log(`  Preskoceno (vec URL ili nema): ${skipped}`);
  console.log(`  Greske: ${errors}`);
}

migrateLogos().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
