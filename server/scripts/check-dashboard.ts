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

const uid = "RT2zzaVfIpZ4H0go9C0XWXukCuC3";

(async () => {
  // 1. Provera user_stats dokumenta
  const statsDoc = await db.collection("user_stats").doc(uid).get();
  console.log("user_stats exists:", statsDoc.exists);
  if (statsDoc.exists) console.log("user_stats data:", JSON.stringify(statsDoc.data(), null, 2));

  // 2. Provera da li postoje oglasi sa authorId == uid
  const adsSnap = await db.collection("listings")
    .where("authorId", "==", uid)
    .limit(5)
    .get();
  console.log("\nAds with authorId:", adsSnap.docs.length);
  adsSnap.docs.forEach(d => console.log(" -", d.id, d.data().title, "| status:", d.data().status, "| authorId:", d.data().authorId));

  // 3. Provera user dokumenta za role
  const userDoc = await db.collection("users").doc(uid).get();
  if (userDoc.exists) {
    const ud = userDoc.data()!;
    console.log("\nUser role:", ud.role, "| admin:", ud.admin);
  }

  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
