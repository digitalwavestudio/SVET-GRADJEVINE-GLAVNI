import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { SyncManager } from "../sync.service.ts";
import { CacheService } from "../cache.service.ts";
import { AdminUsersService } from "./admin-users.service.ts";
import { logger } from "../../utils/logger.ts";

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

    await SyncManager.syncAd(collection, id, updates, oldData);

    // Invalidate cache for ad detail and related listings
    try {
      const category = (oldData.type as string) || (collection === "listings" ? "jobs" : collection);
      await Promise.all([
        CacheService.delete(`ads:detail:${id}`),
        CacheService.delete(`swr:ads:detail:${id}`),
        CacheService.delete(`job_${id}_web`),
        CacheService.delete(`job_${id}_mobile`),
        CacheService.delete(`swr:job_${id}_web`),
        CacheService.delete(`swr:job_${id}_mobile`),
        CacheService.invalidateByPrefix("public_jobs_"),
        CacheService.invalidateByPrefix("swr:public_jobs_"),
        CacheService.invalidateByPrefix("homepage_premium_jobs_"),
        CacheService.invalidateByPrefix("swr:homepage_premium_jobs_"),
        CacheService.invalidateByPrefix("homepage_urgent_jobs_"),
        CacheService.invalidateByPrefix("swr:homepage_urgent_jobs_"),
        CacheService.invalidateByPrefix(`public_ads_${category}_`),
        CacheService.invalidateByPrefix(`swr:public_ads_${category}_`),
        CacheService.invalidateByPrefix("unified_search_"),
        CacheService.invalidateByPrefix("fallback_search_"),
      ]);
    } catch (cacheErr) {
      console.error("[Cache Invalidation Error]:", cacheErr);
    }
    // Ensure moderation queue cache is refreshed
    await CacheService.invalidateByPrefix("admin_moderation_queue_").catch((e: any) => logger.warn("[AdminAds] cache invalidation error:", e?.message));

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

    const category =
      (data.type as string) || (collection === "listings" ? "jobs" : collection);

    // Sync to Algolia if approved
    if (status === "approved") {
      await SyncManager.syncAd(category, id, { ...data, ...updates }, data);
    } else {
      await SyncManager.deleteAd(category, id);
    }

    // Invalidate cache
    try {
      await Promise.all([
        CacheService.delete(`ads:detail:${id}`),
        CacheService.delete(`swr:ads:detail:${id}`),
        CacheService.delete(`job_${id}_web`),
        CacheService.delete(`job_${id}_mobile`),
        CacheService.delete(`swr:job_${id}_web`),
        CacheService.delete(`swr:job_${id}_mobile`),
        CacheService.invalidateByPrefix("public_jobs_"),
        CacheService.invalidateByPrefix("swr:public_jobs_"),
        CacheService.invalidateByPrefix("homepage_premium_jobs_"),
        CacheService.invalidateByPrefix("swr:homepage_premium_jobs_"),
        CacheService.invalidateByPrefix("homepage_urgent_jobs_"),
        CacheService.invalidateByPrefix("swr:homepage_urgent_jobs_"),
        CacheService.invalidateByPrefix(`public_ads_${category}_`),
        CacheService.invalidateByPrefix(`swr:public_ads_${category}_`),
        CacheService.invalidateByPrefix("unified_search_"),
        CacheService.invalidateByPrefix("fallback_search_"),
      ]);
    } catch (cacheErr) {
      console.error("[Cache Invalidation Error]:", cacheErr);
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

    const queryLimit = searchQ ? 100 : limitCount;
    let listingsQuery = db.collection("listings")
  .where("status", "in", ["pending", "pending_payment"])
  .where("moderationStatus", "==", "pending")
  .orderBy("createdAt", "desc")
  .limit(queryLimit);

    const mastersQuery = db.collection("users")
      .where("role", "==", "majstor")
      .where("status", "==", "pending")
      .limit(queryLimit);

    if (cursorStr) {
      const cursorMillis = parseInt(cursorStr, 10);
      if (!isNaN(cursorMillis)) {
        const firestoreCursor = firebaseAdmin.firestore.Timestamp.fromMillis(cursorMillis);
        listingsQuery = listingsQuery.startAfter(firestoreCursor);
      }
    }

    const [listingsSnap, mastersSnap] = await Promise.all([
      listingsQuery.get(),
      mastersQuery.get()
    ]);

    const getTimestamp = (val: any) => val?.toMillis ? val.toMillis() : (val?._seconds ? val._seconds * 1000 : 0);

    const items = listingsSnap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, ...d, _collection: "listings", _typeLabel: (d.type as string)?.toUpperCase() || "OGLAS", title: d.title || "Bez naslova", sortTime: getTimestamp(d.createdAt) };
    });

    const masters = mastersSnap.docs.map(doc => {
      const d = doc.data();
      return { id: doc.id, ...d, _collection: "users", _typeLabel: "MAJSTOR", title: d.name || `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Bez naslova", sortTime: getTimestamp(d.createdAt) };
    });

    let combined = [...items, ...masters];

    if (cursorStr) {
      const cursorMillis = parseInt(cursorStr, 10);
      if (!isNaN(cursorMillis)) {
        combined = combined.filter(i => i.sortTime < cursorMillis);
      }
    }

    if (searchQ) {
      const lowQ = searchQ.toLowerCase();
      combined = combined.filter(i => i.title.toLowerCase().includes(lowQ));
    }

    combined.sort((a, b) => b.sortTime - a.sortTime);

    const finalItems = combined.slice(0, limitCount);
    const nextCursor = finalItems.length > 0 ? finalItems[finalItems.length - 1].sortTime.toString() : null;

    const result = {
      items: finalItems,
      nextCursor,
      hasMore: combined.length > limitCount
    };

    await CacheService.set(cacheKey, result, 60000);
    return result;
  }
}
