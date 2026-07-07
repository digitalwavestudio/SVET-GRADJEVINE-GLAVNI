import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { DomainEvents } from "../../events/event-bus.ts";
import { CacheService } from "../cache.service.ts";

export class AdminUsersService {
  static async updateUser(targetUserId: string, updates: Record<string, unknown>, adminId: string) {
    if (Object.keys(updates).length === 0) return { success: true };
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(targetUserId), {
        ...updates,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      // Outbox for User update
      const outboxRef = db.collection("outbox").doc();
      transaction.set(outboxRef, {
        type: DomainEvents.USER_UPDATED,
        payload: { userId: targetUserId },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: adminId,
        version: 1,
      });
    });

    await AuditService.logAction(
      adminId,
      AuditAction.USER_UPDATED,
      "user",
      targetUserId,
      { updates },
    );

    return { success: true };
  }

  static async verifyUser(
    targetUserId: string,
    isVerified: boolean,
    adminId: string,
  ) {
    await db.runTransaction(async (transaction) => {
      transaction.update(db.collection("users").doc(targetUserId), {
        isVerified: !!isVerified,
        verifiedAt: isVerified
          ? firebaseAdmin.firestore.FieldValue.serverTimestamp()
          : null,
        status: isVerified ? "active" : "pending",
      });

      // Outbox for User Verified/Updated
      const outboxRef = db.collection("outbox").doc();
      transaction.set(outboxRef, {
        type: DomainEvents.USER_UPDATED,
        payload: { userId: targetUserId },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: adminId,
        version: 1,
      });

      if (isVerified) {
        const outboxVerifiedRef = db.collection("outbox").doc();
        transaction.set(outboxVerifiedRef, {
          type: DomainEvents.USER_VERIFIED,
          payload: { userId: targetUserId, isVerified },
          status: "pending",
          attempts: 0,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          correlationId: adminId,
          version: 1,
        });
      }
    });

    await AuditService.logAction(
      adminId,
      AuditAction.USER_VERIFIED,
      "user",
      targetUserId,
      { isVerified },
    );

    await this.syncClaims(targetUserId);

    return { success: true };
  }

  static async suspendUser(
    userId: string,
    status: "active" | "suspended",
    adminId: string,
    reason: string,
  ) {
    await db
      .collection("users")
      .doc(userId)
      .update({
        status,
        suspensionReason: status === "suspended" ? reason : null,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

    await this.syncClaims(userId);

    await AuditService.logAction(
      adminId,
      status === "suspended"
        ? AuditAction.USER_SUSPENDED
        : AuditAction.USER_VERIFIED,
      "user",
      userId,
      { reason, status },
    );

    return { success: true };
  }

  static async syncClaims(uid: string, userAuthOriginalEmail?: string) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return { success: false, error: "User not found" };

    const userData = userDoc.data()!;
    let isAdmin = userData.role === "admin" || userData.admin === true;
    if (!isAdmin) {
      const adminDoc = await db.collection("admins").doc(uid).get();
      if (adminDoc.exists) {
        isAdmin = true;
      }
    }
    const isSuspended = userData.status === "suspended";

    // Build desired claims
    const claims = {
      admin: isAdmin,
      role: userData.role || "user",
      isVerified: !!userData.isVerified,
      suspended: isSuspended,
      permissions: userData.permissions || [],
    };

    await firebaseAdmin.auth().setCustomUserClaims(uid, claims);
    
    // KILL dead auth cache
    await CacheService.delete(`auth:claims:${uid}`);
    await CacheService.delete(`user:profile:cache:${uid}`);
    
    return { success: true, message: "Claims synced", claims };
  }

  static async getUsers(limit = 15, lastDocId?: string, searchQ?: string) {
    let q: FirebaseFirestore.Query = db.collection("users");

    let total = 0;
    if (!searchQ && !lastDocId) {
      try {
        const countSnap = await db.collection("users").count().get();
        total = countSnap.data().count;
      } catch (e) {
        console.error("Error fetching user count", e);
      }
    }

    if (searchQ) {
      if (searchQ.includes("@")) {
        q = q.where("email", "==", searchQ.toLowerCase()).limit(5);
      } else {
        const qStr = searchQ.trim();
        q = q
          .where("company", ">=", qStr)
          .where("company", "<=", qStr + "\uf8ff")
          .limit(15);
      }
    } else {
      q = q.orderBy("createdAt", "desc").limit(limit);
      if (lastDocId) {
        const lastSn = await db.collection("users").doc(lastDocId).get();
        if (lastSn.exists) q = q.startAfter(lastSn);
      }
    }

    const snap = await q.get();
    const result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    let lastVisibleId: string | null = null;
    if (result.length === limit && result.length > 0) {
      lastVisibleId = result[result.length - 1].id;
    }

    const { adminUserListResponseSchema } = await import("../../dto/admin.dto.ts");

    const payload = adminUserListResponseSchema.parse({
      users: result,
      lastVisibleId,
      nextPageToken: lastVisibleId,
      hasMore: result.length === limit,
      ...(total ? { total } : {})
    });

    return payload;
  }
}
