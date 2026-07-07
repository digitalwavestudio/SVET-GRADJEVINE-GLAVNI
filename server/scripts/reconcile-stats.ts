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

async function main() {
  const categories = ["job", "machine", "accommodation", "catering", "plot", "marketplace"];
  const counts: Record<string, number> = {};

  for (const cat of categories) {
    const snap = await db.collection("listings")
      .where("type", "==", cat)
      .count()
      .get();
    counts[`total_${cat}s`] = snap.data().count;
  }

  const activeJobsSnap = await db.collection("listings")
    .where("type", "==", "job")
    .where("status", "==", "active")
    .count()
    .get();
  const activeJobs = activeJobsSnap.data().count;

  const usersSnap = await db.collection("users").count().get();

  const companiesSnap = await db.collection("listings")
    .where("type", "==", "company")
    .where("status", "==", "active")
    .count()
    .get();

  const reconciledStats = {
    totalJobs: counts.total_jobs || 0,
    activeJobs,
    companiesCount: companiesSnap.data().count,
    machinesCount: counts.total_machines || 0,
    accommodationsCount: counts.total_accommodations || 0,
    cateringCount: counts.total_caterings || 0,
    realEstateCount: counts.total_plots || 0,
    marketplaceCount: counts.total_marketplaces || 0,
    totalUsers: usersSnap.data().count,
    lastReconciled: new Date().toISOString(),
    safetySwitch: "active",
  };

  await db.collection("metadata").doc("admin_stats").set(reconciledStats, { merge: true });

  console.log("Reconciled stats:");
  console.log(JSON.stringify(reconciledStats, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Reconciliation failed:", err);
  process.exit(1);
});
