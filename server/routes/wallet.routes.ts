import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { CacheService } from "../services/cache.service.ts";
import { z } from "zod";

export const walletRouter = Router();

/**
 * Centrally log any failed, rejected, or suspicious wallet operations to DLQ
 */
async function logToDLQ(error: string, actionType: string, payload: any) {
  try {
    await db.collection("dlq").add({
      jobType: "wallet_failure",
      status: "pending_review",
      createdAt: new Date().toISOString(),
      error,
      payload: {
        walletActionType: actionType,
        timestamp: new Date().toISOString(),
        ...payload
      }
    });
  } catch (err) {
    console.error(`[DLQ] Failed to write wallet failure to DLQ. Error: ${error}, payload:`, payload, err);
  }
}

const promoteSchema = z.object({
  entityId: z.string().min(1, "Entity ID is required"),
  collection: z.enum([
    "jobs",
    "companies",
    "machines",
    "accommodations",
    "marketplace",
    "plots",
    "real_estate",
    "caterings",
  ]),
  durationDays: z.number().int().min(1).max(365),
  packageId: z.string().optional(),
  promoteType: z
    .enum(["premium", "urgent", "premium_partner"])
    .default("premium"),
});

walletRouter.post("/promote", requireAuth, async (req, res, next) => {
  try {
    const parsed = promoteSchema.parse(req.body);
    const userId = (req as any)?.user.uid;

    const { entityId, collection, durationDays, promoteType } = parsed;

    // Import dynamically so it works in tsx context without issues
    const { getPackageById } =
      await import("../../src/constants/adPackages.ts");
    const matchedPackage = getPackageById(collection, promoteType);

    if (!matchedPackage) {
      return res.status(400).json({ error: "Nevažeći tip promocije" });
    }
    const cost = matchedPackage.priceNum;

    await db.runTransaction(async (transaction) => {
      // 1. Fetch User (wallet check)
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data()!;
      const currentBalance = userData.walletBalance || userData.partnerBalance || 0; // fallback to partnerBalance if walletBalance doesn't exist yet

      if (currentBalance < cost) {
        throw new Error("Nedovoljno sredstava u novčaniku");
      }

      // 2. Fetch Entity (ad to be promoted)
      const collName = collection === "companies" ? "users" : "listings";
      const entityRef = db.collection(collName).doc(entityId);
      const entityDoc = await transaction.get(entityRef);

      if (!entityDoc.exists) {
        throw new Error("Oglas nije pronađen");
      }

      const entityData = entityDoc.data()!;

      let isOwner = false;
      if (entityData.authorId === userId) isOwner = true;
      else if (entityData.userId === userId) isOwner = true;
      else if (collection === "companies" && entityId === userId)
        isOwner = true;
      else if (collection === "jobs" && entityData.companyId === userId)
        isOwner = true;

      if (!isOwner) {
        throw new Error("Niste vlasnik ovog oglasa (nedozvoljen pristup)");
      }

      // 3. Compute new expiration
      const now = new Date();
      let newPremiumUntil = new Date();

      if (
        promoteType === "premium" &&
        entityData.isPremium &&
        entityData.premiumUntil
      ) {
        const currentExp = new Date(entityData.premiumUntil);
        if (currentExp > now) newPremiumUntil = currentExp;
      } else if (
        promoteType === "urgent" &&
        entityData.isUrgent &&
        entityData.urgentUntil
      ) {
        const currentExp = new Date(entityData.urgentUntil);
        if (currentExp > now) newPremiumUntil = currentExp;
      }

      newPremiumUntil.setDate(newPremiumUntil.getDate() + durationDays);

      // --- WRITES ---

      // A. Subtract balance
      transaction.update(userRef, {
        walletBalance: currentBalance - cost,
      });

      // B. Create ledger entry
      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId,
        amount: -cost,
        currency: "RSD",
        type: "payment",
        status: "completed",
        referenceId: entityId,
        description: `Promocija oglasa u sekciji ${collection} na ${durationDays} dana`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // C. Update Entity
      const entityUpdates: Record<string, boolean | import("firebase-admin/firestore").Timestamp> = {};

      const firestoreTimestamp =
        admin.firestore.Timestamp.fromDate(newPremiumUntil);

      if (promoteType === "premium" || promoteType === "premium_partner") {
        entityUpdates.isPremium = true;
        entityUpdates.premiumUntil = firestoreTimestamp;
        if (collection === "companies" && promoteType === "premium_partner") {
          entityUpdates.isPremiumPartner = true;
        }
      } else {
        entityUpdates.isUrgent = true;
        entityUpdates.urgentUntil = firestoreTimestamp;
      }

      transaction.update(entityRef, entityUpdates);
    });

    const { CacheService } = await import("../services/cache.service.ts");
    const { CacheKeys } = await import("../constants/cache-keys.ts");
    await CacheService.delete(CacheKeys.adDetail(entityId));

    res.json({ success: true, message: "Oglas je uspešno promovisan" });
  } catch (err: any) {
    const userId = (req as any)?.user?.uid || "unknown";
    const payload = {
      userId,
      entityId: req.body?.entityId,
      collection: req.body?.collection,
      promoteType: req.body?.promoteType,
      durationDays: req.body?.durationDays,
    };

    if (err instanceof z.ZodError) {
      await logToDLQ("Validation Error in Promote", "promote_validation", { ...payload, details: err.format() });
      return res
        .status(400)
        .json({ error: "Nevažeći parametri", details: err.format() });
    }
    if (
      err.message === "Nedovoljno sredstava u novčaniku" ||
      err.message.includes("vlasnik")
    ) {
      const isSuspicious = err.message.includes("vlasnik");
      await logToDLQ(err.message, isSuspicious ? "promote_unauthorized" : "promote_low_balance", payload);
      return res.status(400).json({ error: err.message });
    }
    // Forward unknown errors
    await logToDLQ(err.message || "Unknown error", "promote_error", { ...payload, stack: err.stack });
    console.error("Wallet Promote Transaction Error:", err);
    res
      .status(500)
      .json({ error: "Došlo je do greške prilikom procesiranja transakcije" });
  }
});

const adminFundSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
  amount: z.number().int().min(1, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
});

walletRouter.post("/admin/add-funds", requireAuth, async (req, res, next) => {
  try {
    const user = (req as any)?.user;
    if (!user.isAdmin) {
      await logToDLQ("Access Denied for Non-Admin on Add Funds", "add_funds_unauthorized", { userId: user?.uid, body: req.body });
      return res.status(403).json({ error: "Nedozvoljen pristup" });
    }

    const adminId = user.uid;
    const { targetUserId, amount, description } = adminFundSchema.parse(
      req.body,
    );

    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(targetUserId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("Korisnik nije pronađen");
      }

      const currentBalance = userDoc.data()?.walletBalance || 0;

      // Update User
      transaction.update(userRef, {
        walletBalance: currentBalance + amount,
      });

      // Create Ledger Entry "Wire Transfer"
      const transactionRef = db.collection("transactions").doc();
      transaction.set(transactionRef, {
        userId: targetUserId,
        adminId: adminId,
        amount: amount,
        currency: "RSD",
        type: "wire_transfer",
        status: "completed",
        description: `Backend depozit (Admin): ${description}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.json({
      success: true,
      message: `Uspešno dodato ${amount} RSD korisniku.`,
    });
  } catch (err: any) {
    const user = (req as any)?.user;
    const payload = {
      adminId: user?.uid,
      targetUserId: req.body?.targetUserId,
      amount: req.body?.amount,
      description: req.body?.description,
    };

    if (err instanceof z.ZodError) {
      await logToDLQ("Validation Error in Add Funds", "add_funds_validation", { ...payload, details: err.format() });
      return res
        .status(400)
        .json({ error: "Nevažeći parametri", details: err.format() });
    }
    await logToDLQ(err.message || "Unknown error", "add_funds_error", { ...payload, stack: err.stack });
    console.error("Admin Add Funds Error:", err);
    res.status(500).json({ error: err.message || "Došlo je do greške" });
  }
});

const manualDepositSchema = z.object({
  amount: z.number().int().min(1, "Amount must be greater than 0"),
});

walletRouter.post("/deposit/manual", requireAuth, async (req, res, next) => {
  try {
    const parsed = manualDepositSchema.parse(req.body);
    const userId = (req as any)?.user.uid;
    const { amount } = parsed;

    // Kreiramo pending transakciju
    const transactionRef = db.collection("transactions").doc();
    const referenceNumber = `SG-${transactionRef.id.slice(0, 8).toUpperCase()}`;

    await transactionRef.set({
      userId,
      amount,
      currency: "RSD",
      type: "deposit",
      status: "pending_approval",
      paymentMethod: "faktura",
      referenceNumber,
      description: "Dopuna Walleta",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      transactionId: transactionRef.id,
      referenceNumber,
      amount,
    });
  } catch (err: any) {
    const userId = (req as any)?.user?.uid || "unknown";
    const payload = {
      userId,
      amount: req.body?.amount,
    };

    if (err instanceof z.ZodError) {
      await logToDLQ("Validation Error in Manual Deposit", "manual_deposit_validation", { ...payload, details: err.format() });
      return res.status(400).json({ error: "Nevažeći parametri", details: err.format() });
    }
    await logToDLQ(err.message || "Unknown error", "manual_deposit_error", { ...payload, stack: err.stack });
    console.error("Manual Deposit Request Error:", err);
    res.status(500).json({ error: "Greška prilikom kreiranja zahteva" });
  }
});

walletRouter.get("/admin/pending-deposits", requireAuth, async (req, res, next) => {
  try {
    const user = (req as any)?.user;
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Nedozvoljen pristup" });
    }

    const snap = await db
      .collection("transactions")
      .where("type", "==", "deposit")
      .where("status", "==", "pending_approval")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    // Vežemo i User info (email, displayName) da Admin zna čije je koristeći DataLoader (In-Memory Batching)
    const { internalUserLoader } = await import("../utils/dataloader.ts");
    const userIds = Array.from(new Set(snap.docs.map(doc => doc.data().userId).filter(Boolean))) as string[];
    const users = await internalUserLoader.loadMany(userIds);
    const userMap = new Map<string, { email?: string; displayName?: string; company?: string }>();
    userIds.forEach((id, index) => {
      const u = users[index];
      if (u && !(u instanceof Error)) {
        userMap.set(id, u);
      }
    });

    const transactions = snap.docs.map((doc) => {
      const data = doc.data();
      let userEmail = "";
      let userName = "";
      if (data.userId) {
        const u = userMap.get(data.userId);
        if (u) {
          userEmail = u.email || "";
          userName = u.displayName || u.company || "";
        }
      }
      return {
        id: doc.id,
        ...data,
        userEmail,
        userName,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
      };
    });

    res.json(transactions);
  } catch (error) {
    console.error("Fetch Pending Deposits Error:", error);
    res.status(500).json({ error: "Greška prilikom dohvatanja zahteva na čekanju" });
  }
});

const approveDepositSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

walletRouter.post("/admin/approve-deposit/:id", requireAuth, async (req, res, next) => {
  let txDataForDLQ: { userId?: string; amount?: number; referenceNumber?: string; description?: string } | null = null;
  try {
    const user = (req as any)?.user;
    if (!user.isAdmin) {
      await logToDLQ("Access Denied for Non-Admin on Approve Deposit", "approve_deposit_unauthorized", { userId: user?.uid, transactionId: req.params.id });
      return res.status(403).json({ error: "Nedozvoljen pristup" });
    }

    const adminId = user.uid;
    const transactionId = req.params.id;
    const { action } = approveDepositSchema.parse(req.body);

    await db.runTransaction(async (transaction) => {
      const txRef = db.collection("transactions").doc(transactionId);
      const txDoc = await transaction.get(txRef);

      if (!txDoc.exists) {
        throw new Error("Transakcija nije pronađena");
      }

      const txData = txDoc.data()!;
      txDataForDLQ = txData as { userId?: string; amount?: number; referenceNumber?: string; description?: string }; // Save for DLQ tracking
      if (txData.status !== "pending_approval") {
        throw new Error("Transakcija više nije na čekanju");
      }

      if (action === "approve") {
        // Ažuriramo stanje Walleta
        const userRef = db.collection("users").doc(txData.userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
           throw new Error("Korisnik nije pronađen");
        }
        const uData = userDoc.data()!;
        const currentBalance = uData.walletBalance || uData.partnerBalance || 0; // Fallback to partnerBalance if wallet doesn't exist yet

        transaction.update(userRef, {
          walletBalance: currentBalance + txData.amount,
        });

        // Ažuriramo transakciju
        transaction.update(txRef, {
          status: "completed",
          approvedBy: adminId,
          approvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Reject
        transaction.update(txRef, {
          status: "failed", // il cancelled
          approvedBy: adminId,
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          description: txData.description + " (Odbijeno od strane Admina)"
        });
      }
    });

    if (action === "reject" && txDataForDLQ) {
      await logToDLQ("Uplata je odbijena od strane admina", "deposit_rejected", {
        adminId,
        transactionId,
        userId: (txDataForDLQ as { userId?: string, amount?: number, referenceNumber?: string, description?: string } | null)?.userId,
        amount: (txDataForDLQ as { userId?: string, amount?: number, referenceNumber?: string, description?: string } | null)?.amount,
        referenceNumber: (txDataForDLQ as { userId?: string, amount?: number, referenceNumber?: string, description?: string } | null)?.referenceNumber,
        description: (txDataForDLQ as { userId?: string, amount?: number, referenceNumber?: string, description?: string } | null)?.description,
      });
    }

    res.json({ success: true, message: action === "approve" ? "Uplata je uspešno odobrena" : "Uplata je odbijena" });
  } catch (err: any) {
    const user = (req as any)?.user;
    const transactionId = req.params.id;
    const payload = {
      adminId: user?.uid,
      transactionId,
      body: req.body,
      txData: txDataForDLQ,
    };

    if (err instanceof z.ZodError) {
      await logToDLQ("Validation Error in Approve Deposit", "approve_deposit_validation", { ...payload, details: err.format() });
      return res.status(400).json({ error: "Nevažeći parametri", details: err.format() });
    }
    await logToDLQ(err.message || "Unknown error", "approve_deposit_error", { ...payload, stack: err.stack });
    console.error("Approve Deposit Error:", err);
    res.status(500).json({ error: err.message || "Greška prilikom obrade uplate" });
  }
});

walletRouter.get("/transactions", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any)?.user.uid;
    const limit = parseInt(req.query.limit as string) || 50;

    const cacheKey = "wallet_tx_" + userId;
    const transactions = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const snap = await db
          .collection("transactions")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(limit)
          .get();

        return snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate()
              : data.createdAt,
          };
        });
      },
      30000 // 30 sekundi TTL
    );

    res.json(transactions);
  } catch (error) {
    console.error("Fetch Transactions Error:", error);
    res.status(500).json({ error: "Greška prilikom dohvatanja transakcija" });
  }
});
