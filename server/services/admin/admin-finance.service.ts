import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { CacheService } from "../cache.service.ts";
import { FinancialLedgerService, TransactionType } from "../ledger.service.ts";

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
      delta = amount - (userSnap.data()?.walletBalance || 0);
    }

    await FinancialLedgerService.updateBalance(
      userId,
      delta,
      "ADJUSTMENT",
      reason || "Administratorska korekcija balansa",
      undefined,
      { adminId }
    );

    // Sync redundant field for faster frontend access
    await db.collection("users").doc(userId).update({
      walletBalance: firebaseAdmin.firestore.FieldValue.increment(delta),
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }

  static async getCheckouts(limit = 20, lastDocId?: string, searchQ?: string) {
    const cacheKey = `admin_checkouts_${limit}_${lastDocId || "initial"}_${searchQ || "none"}`;
    const cached = await CacheService.get<{ items: Record<string, unknown>[]; lastVisibleId: string | null; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

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

    await CacheService.set(cacheKey, payload, 5 * 60000); // 5 min cache
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
    });

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
