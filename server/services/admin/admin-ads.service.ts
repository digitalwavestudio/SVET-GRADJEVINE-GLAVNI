import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { SyncManager } from "../sync.service.ts";
import { CacheService } from "../cache.service.ts";
import { AdminUsersService } from "./admin-users.service.ts";

import { moderationQueueResponseSchema } from "../../dto/admin.dto.ts";

export class AdminAdsService {
  static async editListing(
    collection: string,
    id: string,
    updates: Record<string, unknown>,
    adminId: string,
  ) {
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new Error("Document not found");
    const oldData = docSnap.data() as Record<string, unknown>;

    await docRef.update({
      ...updates,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      lastEditedByAdmin: adminId,
    });

    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data() as Record<string, unknown>;

    await SyncManager.syncAd(collection, id, updatedData, oldData);

    await AuditService.logAction(
      adminId,
      AuditAction.AD_EDITED,
      collection,
      id,
      { updates, prevData: oldData },
    );

    return { success: true, message: "Listing updated successfully" };
  }

  static async moderateListing(
    collection: string,
    id: string,
    status: "approved" | "rejected",
    adminId: string,
    feedback?: string,
  ) {
    const docRef = db.collection(collection).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) throw new Error("Document not found");
    const data = docSnap.data() as Record<string, unknown>;

    const updates: Record<string, unknown> = {
      status: status === "approved" ? "active" : "rejected",
      moderationStatus: status,
      moderatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      moderatedBy: adminId,
    };

    if (feedback) updates.moderationFeedback = feedback;

    await docRef.update(updates);

    // If we are moderating a USER (e.g. majstor registration)
    if (collection === "users") {
      await AdminUsersService.syncClaims(id);
    }

    // Sync to Algolia if approved
    if (status === "approved") {
      const category =
        (data.type as string) || (collection === "listings" ? "jobs" : collection);
      await SyncManager.syncAd(category, id, { ...data, ...updates }, data);
    } else {
      const category =
        (data.type as string) || (collection === "listings" ? "jobs" : collection);
      await SyncManager.deleteAd(category, id);
    }

    await AuditService.logAction(
      adminId,
      status === "approved" ? AuditAction.AD_APPROVED : AuditAction.AD_REJECTED,
      collection,
      id,
      { feedback },
    );

    return { success: true };
  }

  static async getModerationQueue(limitCount: number = 25, cursorStr?: string, searchQ?: string) {
    const cacheKey = `admin_moderation_queue_${limitCount}_${cursorStr || "initial"}_${searchQ || "none"}`;
    const cached = await CacheService.get<{ items: any[]; nextCursor: string | null; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

    let listingsQuery: FirebaseFirestore.Query = db
      .collection("listings")
      .where("status", "in", ["pending", "pending_payment"])
      .orderBy("createdAt", "desc")
      .limit(searchQ ? 100 : limitCount);

    let mastersQuery: FirebaseFirestore.Query = db
      .collection("users")
      .where("role", "==", "majstor")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(searchQ ? 100 : limitCount);

    if (cursorStr) {
      const cursorMillis = parseInt(cursorStr, 10);
      if (!isNaN(cursorMillis)) {
        const firestoreCursor =
          firebaseAdmin.firestore.Timestamp.fromMillis(cursorMillis);
        listingsQuery = listingsQuery.startAfter(firestoreCursor);
        mastersQuery = mastersQuery.startAfter(firestoreCursor);
      }
    }

    // 1. Listings
    const listingsSnap = await listingsQuery.get();

    const items = listingsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _collection: "listings", 
      _typeLabel: (doc.data().type as string | undefined)?.toUpperCase() || "OGLAS",
      title: (doc.data().title as string | undefined) || "Bez naslova",
    }));

    // 2. Majstori (role: majstor, status: pending)
    const mastersSnap = await mastersQuery.get();

    const mastersData = mastersSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        _collection: "users",
        _typeLabel: "MAJSTOR",
        title:
          d.name ||
          `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
          "Bez naslova",
      };
    });

    type QueueItem = {
      id: string;
      _collection: string;
      _typeLabel: string;
      title: string;
      createdAt?: { _seconds?: number; seconds?: number; _nanoseconds?: number; nanoseconds?: number };
      [key: string]: unknown;
    };

    let combined: QueueItem[] = [...(items as unknown as QueueItem[]), ...(mastersData as unknown as QueueItem[])];

    if (searchQ) {
      const lowQ = searchQ.toLowerCase();
      combined = combined.filter((i) =>
        i.title.toLowerCase().includes(lowQ),
      );
    }

    combined.sort((a, b) => {
      const dateA = (a.createdAt?._seconds || a.createdAt?.seconds || 0) as number;
      const dateB = (b.createdAt?._seconds || b.createdAt?.seconds || 0) as number;
      return dateB - dateA;
    });

    const finalItems = combined.slice(0, limitCount);

    let nextCursor = null;
    if (finalItems.length > 0) {
      const lastItem = finalItems[finalItems.length - 1];
      const lastSecs =
        lastItem.createdAt?._seconds || lastItem.createdAt?.seconds || 0;
      const lastNanos =
        lastItem.createdAt?._nanoseconds ||
        lastItem.createdAt?.nanoseconds ||
        0;
      if (lastSecs > 0) {
        nextCursor = (
          lastSecs * 1000 +
          Math.floor(lastNanos / 1000000)
        ).toString();
      }
    }

    const result = moderationQueueResponseSchema.parse({
      items: finalItems,
      nextCursor,
      hasMore: combined.length > limitCount,
    });

    await CacheService.set(cacheKey, result, 60000); // 1 min cache
    return result;
  }
}
