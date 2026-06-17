/**
 * Script za brisanje svih transakcija za datog korisnika.
 *
 * Pokretanje:
 *   npx tsx scripts/cleanup-transactions.ts <USER_UID>
 *
 *
 * Zahteva:
 *   - firebase-service-account.json u korenu projekta
 *   - firebase-applet-config.json u korenu projekta
 */

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Usage: npx tsx scripts/cleanup-transactions.ts <USER_UID>");
    console.error("Example: npx tsx scripts/cleanup-transactions.ts kC97lodzPHdmsUGv4FQP0yj1rkw2");
    process.exit(1);
  }

  // Load Firebase config
  let configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    configPath = path.join(rootDir, "firebase-applet-config.json");
  }

  if (!fs.existsSync(configPath)) {
    console.error("firebase-applet-config.json not found");
    process.exit(1);
  }

  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const dbId = firebaseConfig.firestoreDatabaseId;

  // Load service account
  const keyPath = path.resolve(process.cwd(), "firebase-service-account.json");
  if (!fs.existsSync(keyPath)) {
    console.error("firebase-service-account.json not found");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

  // Initialize Firebase
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
    });
  }

  const db = getFirestore(admin.app(), dbId);
  console.log(`Using Firestore database: ${dbId || "(default)"}`);
  console.log(`Target user: ${uid}`);

  // Count transactions first
  const countSnap = await db
    .collection("transactions")
    .where("userId", "==", uid)
    .get();

  const total = countSnap.size;
  if (total === 0) {
    console.log("No transactions found for this user.");
    process.exit(0);
  }

  console.log(`Found ${total} transaction(s) to delete.`);

  // Delete in batches of 500
  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batchSnap = await db
      .collection("transactions")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(BATCH_SIZE)
      .get();

    const batch = db.batch();
    batchSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deleted += batchSnap.size;
    console.log(`Progress: ${deleted}/${total} deleted`);
  }

  console.log(`Successfully deleted ${deleted} transactions for user ${uid}.`);

  // Also bust wallet cache by updating user doc timestamp
  try {
    await db.collection("users").doc(uid).update({
      walletUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Wallet cache busted.");
  } catch {
    console.log("Could not bust wallet cache (non-fatal).");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
