import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { DomainEvents } from "../../events/event-bus.ts";
import { CacheService } from "../cache.service.ts";
import { AdminStatsService } from "./admin-stats.service.ts";
import { Logger } from "../../utils/logger.ts";
import { AppError } from "../../utils/appError.ts";

export class AdminCleanupService {
  private static logger = new Logger({ service: "AdminCleanupService" });

  static async shutdownUserAccount(targetUserId: string, adminId: string) {
    this.logger.info(`Starting cascading cleanup/shutdown for user: ${targetUserId} initiated by admin: ${adminId}`);

    // Validate parameters
    if (!targetUserId) {
      throw new AppError("Korisnički ID je obavezan.", 400);
    }
    if (!adminId) {
      throw new AppError("Admin ID je obavezan.", 400);
    }

    // 1. Fetch user document to check current status and existence
    const userRef = db.collection("users").doc(targetUserId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      throw new AppError("Korisnik nije pronađen.", 404);
    }

    const userData = userSnap.data()!;
    if (userData.status === "deleted") {
      return { success: true, message: "Korisnik je već obrisan/ugašen." };
    }

    // 2. Fetch all user's listings outside the transaction so we can iterate and lock them inside
    this.logger.info(`Fetching listings authored by user: ${targetUserId}`);
    const listingsSnap = await db
      .collection("listings")
      .where("authorId", "==", targetUserId)
      .limit(500)
      .get();

    const listingsData = listingsSnap.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      data: doc.data(),
    }));

    this.logger.info(`Found ${listingsData.length} listings to Cascading-Delete/Deactivate.`);

    // 3. Execute Transaction
    await db.runTransaction(async (transaction) => {
      // Lock target user document
      const txUserSnap = await transaction.get(userRef);
      if (!txUserSnap.exists) {
        throw new AppError("Korisnik nije pronađen tokom transakcije.", 404);
      }

      // Deactivate user profile
      transaction.update(userRef, {
        status: "deleted",
        deletedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user's private info if it exists
      const privateRef = userRef.collection("private").doc("data");
      const txPrivateSnap = await transaction.get(privateRef);
      if (txPrivateSnap.exists) {
        transaction.update(privateRef, {
          deletedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Lock and de-activate each listing
      for (const listing of listingsData) {
        // Read listing within transaction to ensure latest data and locking
        const txListingSnap = await transaction.get(listing.ref);
        if (!txListingSnap.exists) continue;

        const currentListingData = txListingSnap.data()!;
        const oldStatus = currentListingData.status;

        // Mark listing as deleted
        transaction.update(listing.ref, {
          status: "deleted",
          deletedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });

        // Resolve ad category for statistics update
        let category = "listings";
        switch (currentListingData.type) {
          case "job": category = "jobs"; break;
          case "company": category = "companies"; break;
          case "realEstate": category = "realEstate"; break;
        }

        // Stats updates
        await AdminStatsService.updateGlobalStats(
          category as "jobs" | "companies" | "realEstate",
          -1,
          currentListingData.isPremium || false,
          oldStatus,
          transaction,
        ).catch(e => {
          this.logger.error(`Error updating global stats for ${category} in cleanup:`, e);
        });

        if (oldStatus === "active") {
          await AdminStatsService.updateUserStats(targetUserId, { activeAds: -1 }, transaction).catch(err => console.error("[AdminCleanup] updateUserStats failed:", err));
        }

        // Outbox event for Algolia and Search syncing (deletes ad from Algolia)
        const outboxAdRef = db.collection("outbox").doc();
        transaction.set(outboxAdRef, {
          type: DomainEvents.AD_DELETED,
          payload: { category, id: listing.id, uid: targetUserId },
          status: "pending",
          attempts: 0,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          correlationId: adminId,
          version: 1,
        });
      }

      // Outbox event to sync user profile state
      const outboxUserRef = db.collection("outbox").doc();
      transaction.set(outboxUserRef, {
        type: DomainEvents.USER_UPDATED,
        payload: { userId: targetUserId },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: adminId,
        version: 1,
      });
    });

    // 4. Log audit action
    await AuditService.logAction(
      adminId,
      AuditAction.USER_DELETED,
      "user",
      targetUserId,
      {
        listingsDeletedCount: listingsData.length,
        listingsDeleted: listingsData.map(l => l.id),
      },
    );

    // 5. Fire immediate background BullMQ outbox jobs if Redis connection exists
    try {
      const { QueueService, JobType, JobPriority } = await import("../queue.service.ts");
      const outboxSnap = await db
        .collection("outbox")
        .where("correlationId", "==", adminId)
        .where("status", "==", "pending")
        .get();

      for (const doc of outboxSnap.docs) {
        await QueueService.addJob(
          JobType.OUTBOX_PROCESS,
          { id: doc.id, ...doc.data() },
          { jobId: `outbox-${doc.id}`, priority: JobPriority.HIGH },
        ).catch(err => console.error("[AdminCleanup] QueueService.addJob failed:", err));
      }
    } catch (e: unknown) {
      this.logger.error("Failed to add immediate outbox jobs after user cleanup", e instanceof Error ? e.message : String(e));
    }

    // 6. Evict caches to prevent stale data
    await CacheService.delete(`user_me_${targetUserId}:pub`).catch(err => console.error("[AdminCleanup] cache operation failed:", err));
    await CacheService.delete(`user_me_${targetUserId}:priv`).catch(err => console.error("[AdminCleanup] cache operation failed:", err));
    await CacheService.delete(`auth_session:${targetUserId}`).catch(err => console.error("[AdminCleanup] cache operation failed:", err));
    await CacheService.invalidateByPrefix(`myAds_${targetUserId}`).catch(err => console.error("[AdminCleanup] cache operation failed:", err));
    await CacheService.invalidateByPrefix(`publicProfileAds_${targetUserId}`).catch(err => console.error("[AdminCleanup] cache operation failed:", err));

    // 7. Revoke session refresh tokens in Firebase Auth so they are logged out instantly
    await firebaseAdmin.auth().revokeRefreshTokens(targetUserId).catch((err) => {
      this.logger.error(`Failed to revoke refresh tokens for user ${targetUserId}:`, err);
    });

    // 8. Update custom claims in Firebase Auth to block further writes
    await firebaseAdmin.auth().setCustomUserClaims(targetUserId, {
      suspended: true,
      role: "deleted",
      permissions: [],
    }).catch((err) => {
      this.logger.error(`Failed to update custom claims for deleted user ${targetUserId}:`, err);
    });

    this.logger.info(`Cascading account cleanup/shutdown for user: ${targetUserId} finished successfully.`);

    return {
      success: true,
      listingsDeletedCount: listingsData.length,
      message: "Korisnički nalog je uspešno ugašen i kaskadno očišćen.",
    };
  }
}
