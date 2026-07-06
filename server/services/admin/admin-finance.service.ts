import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { CacheService } from "../cache.service.ts";
import { CacheKeys } from "../../constants/cache-keys.ts";
import { employerStatsMemoryCache } from "../dashboard/dashboard-lru.ts";

export class AdminFinanceService {
  static async updateUserWallet(
    userId: string,
    amount: number,
    type: "add" | "set",
    adminId: string,
    reason: string,
  ) {
    let delta = amount;
    if (type === "set") {
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) throw new Error(`User ${userId} not found`);
      delta = amount - (userSnap.data()?.walletBalance || 0);
    }

    await db.runTransaction(async (transaction) => {
      const walletRef = db.collection("wallets").doc(userId);
      const userRef = db.collection("users").doc(userId);

      transaction.set(walletRef, {
        balance: firebaseAdmin.firestore.FieldValue.increment(delta),
        lastUpdatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      transaction.update(userRef, {
        walletBalance: firebaseAdmin.firestore.FieldValue.increment(delta),
      });
    });

    // Invalidate BFF cache so dashboard shows updated balance immediately
    await Promise.allSettled([
      CacheService.delete(`dashboard_metrics:${userId}`),
      CacheService.delete(`wallet_dashboard:${userId}`),
      CacheService.delete(`bff_wallet_user:${userId}`),
    ]);

    return { success: true };
  }

  static async getCheckouts(limit = 20, lastDocId?: string, searchQ?: string) {
    // Cache only first page (no cursor in key) to maximize hit rate
    const cacheKey = lastDocId ? null : `admin_checkouts_${limit}_${searchQ || "none"}`;
    
    if (cacheKey) {
      const cached = await CacheService.get<{ items: Record<string, unknown>[]; lastVisibleId: string | null; hasMore: boolean }>(cacheKey);
      if (cached) return cached;
    }

    let q: FirebaseFirestore.Query = db.collection("checkouts");

    if (searchQ) {
      const qStr = searchQ.trim();
      q = q.where("invoiceId", "==", qStr).limit(10);
    } else {
      q = q.orderBy("createdAt", "desc").limit(limit);

      if (lastDocId) {
        const lastSn = await db.collection("checkouts").doc(lastDocId).get();
        if (lastSn.exists) q = q.startAfter(lastSn);
      }
    }

    const snap = await q.get();
    const result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const lastVisibleId = result.length === limit ? result[result.length - 1].id : null;
    const payload = {
      items: result,
      lastVisibleId,
      hasMore: result.length === limit
    };

    if (cacheKey) {
      await CacheService.set(cacheKey, payload, 5 * 60000); // 5 min cache
    }
    return payload;
  }

  static async confirmInvoicePayment(checkoutId: string, adminId: string) {
    const checkoutRef = db.collection("checkouts").doc(checkoutId);
    const checkoutDoc = await checkoutRef.get();

    if (!checkoutDoc.exists) throw new Error("Checkout ne postoji");
    const data = checkoutDoc.data()!;
    if (data.status === "confirmed") throw new Error("Uplata je već potvrđena");

    const userId = data.userId;
    const packageId = data.packageId;

    await db.runTransaction(async (transaction) => {
      // 1. Update checkout status
      transaction.update(checkoutRef, {
        status: "confirmed",
        confirmedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        confirmedBy: adminId,
      });

      // 2. Update user package
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error("Korisnik ne postoji");

      // Calculate expiry (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const packageExpiry =
        firebaseAdmin.firestore.Timestamp.fromDate(expiryDate);

      transaction.update(userRef, {
        activePackage: packageId,
        packageExpiry: packageExpiry,
        lastPaymentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Update pre-aggregated user_stats so dashboard sees it
      const userStatsRef = db.collection("user_stats").doc(userId);
      transaction.set(userStatsRef, {
        activePackage: packageId,
        packageExpiry: packageExpiry,
        lastPaymentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        lastPaymentAmount: data.amount || 0,
        lastPaymentType: "package_purchase",
        lastPaymentStatus: "completed",
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    // Evict dashboard + user_stats cache
    await CacheService.delete(CacheKeys.employerStats(userId)).catch(() => {});
    await CacheService.delete(`user_stats_${userId}`).catch(() => {});
    employerStatsMemoryCache.delete(userId);

    await AuditService.logAction(
      adminId,
      AuditAction.PAYMENT_CONFIRMED,
      "checkout",
      checkoutId,
      { userId, packageId, amount: data.amount },
    );

    return { success: true };
  }
}
