import { db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { AuditService, AuditAction } from "./audit.service.ts";
import { LockManager } from "./lock.service.ts";
import { getRedis } from "../utils/redis.ts";

const FieldValue = admin.firestore.FieldValue;

export const TransactionType = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
  PAYMENT: "payment",
  REFUND: "refund",
  ADJUSTMENT: "adjustment",
} as const;
export type TransactionType = keyof typeof TransactionType;

export class FinancialLedgerService {
  private static logger = new Logger({ service: "FinancialLedgerService" });

  static async getBalance(uid: string): Promise<number> {
    const redis = getRedis();
    const redisBalanceKey = `wallet:balance:${uid}`;
    if (redis) {
      const cached = await redis.get(redisBalanceKey).catch(() => null);
      if (cached !== null) {
        return parseFloat(cached);
      }
    }
    const walletSnap = await db.collection("wallets").doc(uid).get();
    const balance = walletSnap.exists ? (walletSnap.data()?.balance || 0) : 0;
    if (redis) {
      await redis.set(redisBalanceKey, balance.toString(), "EX", 86400).catch((e: any) => FinancialLedgerService.logger.warn("[LedgerService] Cache set balance:", e));
    }
    return balance;
  }

  /**
   * Applies balance update within an existing transaction.
   */
  static async applyBalanceInTransaction(
    transaction: FirebaseFirestore.Transaction,
    uid: string,
    amount: number,
    type: TransactionType,
    description: string,
    idempotencyKey: string,
    metadata: any = {}
  ) {
    const walletRef = db.collection("wallets").doc(uid);
    const transRef = db.collection("transactions").doc(idempotencyKey);

    const [transDoc, walletDoc] = await Promise.all([
      transaction.get(transRef),
      transaction.get(walletRef)
    ]);

    if (transDoc.exists) {
      const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0;
      return { success: true, transactionId: idempotencyKey, status: "ALREADY_APPLIED", newBalance: currentBalance };
    }

    let currentBalance = 0;
    if (walletDoc.exists) {
      const data = walletDoc.data();
      if (!data) throw new Error("Wallet data not found");
      if (data.status === "suspended") {
        throw new Error("Wallet is suspended due to security audit failure.");
      }
      currentBalance = data.balance || 0;
    }

    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new Error("Insufficient funds for this transaction.");
    }

    // 1. Update Wallet
    transaction.set(walletRef, {
      balance: newBalance,
      lastUpdatedAt: FieldValue.serverTimestamp(),
      status: walletDoc.exists ? (walletDoc.data()?.status || "active") : "active",
      lastAuditPassed: walletDoc.exists ? (walletDoc.data()?.lastAuditPassed ?? true) : true
    }, { merge: true });

    // 1b. Sync redundant user-level balance (atomic with wallet update)
    transaction.update(db.collection("users").doc(uid), {
      walletBalance: FieldValue.increment(amount),
    });

    // 2. Create Transaction Record (Immutable)
    transaction.set(transRef, {
      uid,
      amount,
      previousBalance: currentBalance,
      newBalance,
      type,
      description,
      referenceId: idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
      metadata: {
        ...metadata,
        auditVersion: "3.0" // Mark as V3 (ACID Integrated)
      }
    });

    return { success: true, transactionId: idempotencyKey, status: "APPLIED", newBalance };
  }

  /**
   * Updates user balance atomically within a transaction
   * and creates an immutable transaction record.
   */
  static async updateBalance(
    uid: string,
    amount: number,
    type: TransactionType,
    description: string,
    idempotencyKey?: string,
    metadata: any = {}
  ) {
    const finalIdempotencyKey = idempotencyKey || db.collection("transactions").doc().id;
    const redis = getRedis();
    const lockKey = `wallet:${uid}`;
    let lockId: string | null = null;

    // 1. Acquire Distributed Lock with backoff to prevent Firestore OCC Abort Storm under 50k RPS
    let acquired = false;
    const maxRetries = 30;
    const baseDelay = 50;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      lockId = await LockManager.acquire(lockKey, 15000); // 15s lock duration
      if (lockId) {
        acquired = true;
        break;
      }
      // Exponential retry backoff with jitter
      const delay = Math.min(1000, baseDelay * Math.pow(1.5, attempt)) + Math.random() * 50;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (!acquired || !lockId) {
      this.logger.error(`[Ledger Lock] Failed to acquire lock for wallet ${uid} after ${maxRetries} attempts.`);
      throw new Error("COULD_NOT_ACQUIRE_LOCK_CONF_LEAD_LEDGER");
    }

    try {
      // 2. Fast-Fail balance check using reserved Redis state to block double spending before hitting Firestore DB
      const redisBalanceKey = `wallet:balance:${uid}`;
      if (redis) {
        try {
          const cachedBalStr = await redis.get(redisBalanceKey);
          if (cachedBalStr !== null) {
            const cachedBal = parseFloat(cachedBalStr);
            if (cachedBal + amount < 0) {
              this.logger.warn(`[Ledger Redis Fast-Fail] User ${uid} has insufficient funds reserved in Redis (Cached: ${cachedBal}, Attempted change: ${amount})`);
              throw new Error("Insufficient funds for this transaction (Redis pre-validated).");
            }
          }
        } catch (err: any) {
          if (err instanceof Error && err.message.includes("Insufficient funds")) {
            throw err;
          }
          this.logger.error("[Ledger] Redis pre-validation read error:", err);
        }
      }

      // 3. Perform atomic database transaction
      let newBalance = 0;
      await db.runTransaction(async (transaction) => {
        const res = await this.applyBalanceInTransaction(
          transaction, uid, amount, type, description, finalIdempotencyKey, metadata
        );
        newBalance = res.newBalance;
      });

      // 4. Update the reserved balance key in Redis
      if (redis && newBalance !== undefined) {
        try {
          await redis.set(redisBalanceKey, newBalance.toString(), "EX", 86400); // Cache for 24h
          await redis.del(`wallet_dashboard:${uid}`); // Write-Around invalidate
        } catch (err) {
          this.logger.error("[Ledger] Redis reservation set error:", err);
        }
      }

      this.logger.info(`[Ledger] Successfully processed ${type} of ${amount} for ${uid}`);

      // Internal Audit Log (Admin Visibility)
      await AuditService.logAction(
        "system",
        AuditAction.WALLET_ADJUSTED,
        "wallets",
        uid,
        { amount, type, description, idempotencyKey: finalIdempotencyKey }
      );

      return { success: true, transactionId: finalIdempotencyKey };
    } catch (error: any) {
      if (error instanceof Error) {
        this.logger.error(`[Ledger] Transaction failed for ${uid}: ${error.message}`);
      } else {
        this.logger.error(`[Ledger] Transaction failed for ${uid}:`, error);
      }
      throw error;
    } finally {
      if (lockId) {
        await LockManager.release(lockKey, lockId).catch((err) => {
          this.logger.error(`[Ledger] Lock release failed for ${uid}:`, err);
        });
      }
    }
  }

  /**
   * Performs deep verification of a wallet against its transaction history
   */
  static async verifyWalletIntegrity(uid: string, walletData?: any) {
    let finalWalletData = walletData;
    if (!finalWalletData) {
      const walletSnap = await db.collection("wallets").doc(uid).get();
      if (!walletSnap.exists) return { isValid: true, message: "No wallet found" };
      finalWalletData = walletSnap.data();
    }

    const transactionsSnap = await db.collection("transactions")
      .where("uid", "==", uid)
      .orderBy("createdAt", "asc")
      .get();

    let calculatedBalance = 0;
    transactionsSnap.docs.forEach((doc) => {
      calculatedBalance += (doc.data().amount || 0);
    });

    const diff = Math.abs(calculatedBalance - (finalWalletData.balance || 0));
    const isIntegrityMaintained = diff < 0.01; // Allow for floating point precision

    if (!isIntegrityMaintained) {
      await this.lockWallet(uid, `Integrity Mismatch: FS Balance ${finalWalletData.balance}, Calculated ${calculatedBalance}`);
      return { isValid: false, expected: calculatedBalance, actual: finalWalletData.balance };
    }

    // Mark as verified
    await db.collection("wallets").doc(uid).update({
      lastAuditPassed: true,
      lastAuditAt: FieldValue.serverTimestamp()
    });

    return { isValid: true };
  }

  private static async lockWallet(uid: string, reason: string) {
    this.logger.error(`[CRITICAL] Locking wallet ${uid} - ${reason}`);
    
    await db.collection("wallets").doc(uid).update({
      status: "suspended",
      lastAuditPassed: false,
      suspensionReason: reason,
      suspendedAt: FieldValue.serverTimestamp()
    });

    await db.collection("dlq").add({
      type: "FINANCIAL_ANOMALY",
      uid,
      reason,
      timestamp: FieldValue.serverTimestamp(),
      severity: "CRITICAL"
    });
  }
}
