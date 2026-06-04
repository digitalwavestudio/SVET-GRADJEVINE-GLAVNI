import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { registerMigration } from "../services/migration.service.ts";

// 001_standardize_user_roles.ts
registerMigration({
  id: "001_standardize_user_status",
  up: async () => {
    // Example migration: ensure all users have a status field
    // Added limit to prevent quota exhaustion on massive user bases
    const usersSnap = await db
      .collection("users")
      .where("status", "==", null)
      .limit(200)
      .get();

    if (usersSnap.empty) return;

    let batch = db.batch();
    let countInBatch = 0;
    let totalUpdated = 0;

    for (const doc of usersSnap.docs) {
      batch.update(doc.ref, { status: "active" });
      countInBatch++;
      totalUpdated++;

      if (countInBatch === 400) {
        await batch.commit();
        batch = db.batch();
        countInBatch = 0;
      }
    }

    if (countInBatch > 0) {
      await batch.commit();
    }
    console.log(`[Migration] Updated status for ${totalUpdated} users.`);
  },
});

// Optionally export an initialization function so it gets imported and registered
export const initMigrations = () => {
  console.log("[Migrations] Registered migration scripts.");
};
