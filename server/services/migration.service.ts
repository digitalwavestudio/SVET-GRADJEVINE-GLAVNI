import { db, admin } from "../config/firebase.ts";
import { logger, Logger } from "../utils/logger.ts";

export interface Migration {
  id: string; // e.g. '001_initial_setup'
  up: () => Promise<void>;
  // down: () => Promise<void>; // Not requested but could be added
}

const MIGRATIONS_COLLECTION = "_migrations";

// Registry of all migrations in order
const availableMigrations: Migration[] = [];

export const registerMigration = (migration: Migration) => {
  if (!availableMigrations.find((m) => m.id === migration.id)) {
    availableMigrations.push(migration);
  }
};

export const runPendingMigrations = async (): Promise<{
  executed: string[];
  errors: string[];
}> => {
  const executed: string[] = [];
  const errors: string[] = [];

  if (availableMigrations.length === 0) {
    logger.debug("[Migrations] No pending migrations registered. Skipping Firestore check.");
    return { executed, errors };
  }

  try {
    const executedDoc = await db
      .collection(MIGRATIONS_COLLECTION)
      .doc("status")
      .get();
    const executedIds: string[] = executedDoc.exists
      ? executedDoc.data()?.executed || []
      : [];

    // Process in order
    availableMigrations.sort((a, b) => a.id.localeCompare(b.id));

    for (const migration of availableMigrations) {
      if (!executedIds.includes(migration.id)) {
        logger.debug(`[Migrations] Running migration: ${migration.id}`);
        try {
          await migration.up();
          executedIds.push(migration.id);
          executed.push(migration.id);

          await db.collection(MIGRATIONS_COLLECTION).doc("status").set({
            executed: executedIds,
            lastRun: admin.firestore.FieldValue.serverTimestamp(),
          });
          logger.debug(`[Migrations] Completed migration: ${migration.id}`);
        } catch (mErr: any) {
          if (mErr?.message?.includes("RESOURCE_EXHAUSTED") || mErr?.code === 8) {
            logger.warn(`[Migrations] Migration ${migration.id} paused due to Firestore Quota Exceeded.`);
          } else {
            console.error(`[Migrations] Failed migration: ${migration.id}`, mErr);
          }
          errors.push(
            `${migration.id}: ${mErr instanceof Error ? mErr.message : String(mErr)}`,
          );
          break; // Stop execution on first failure to prevent cascading issues
        }
      }
    }

    return { executed, errors };
  } catch (error: any) {
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.code === 8) {
      logger.warn("[Migrations] Skipped migrations check: Firestore Quota Exceeded (RESOURCE_EXHAUSTED).");
    } else {
      console.error("[Migrations] Runner error:", error);
    }
    errors.push(
      `Runner failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return { executed, errors };
  }
};
