// @ts-nocheck
import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { DomainEvents } from "../../events/event-bus.ts";
import { AdminStatsService } from "../admin-stats.service.ts";
import { Logger } from "../../utils/logger.ts";
import { FinancialLedgerService, TransactionType } from "../ledger.service.ts";

export interface PaymentSagaContext {
  userId: string;
  amount: number;
  type: "wallet_deposit" | "package_purchase" | "ad_payment";
  adId?: string;
  packageId?: string;
  currency: string;
  referenceId: string;
  role?: string;
}

export class PaymentSaga {
  private logger = new Logger({ service: "PaymentSaga" });
  private context: PaymentSagaContext;

  constructor(context: PaymentSagaContext) {
    this.context = context;
  }

  async run() {
    try {
      // Optimistic check in Redis to see if referenceId is already provisioned
      const { getRedis } = await import("../../utils/redis.ts");
      const redis = getRedis();
      if (redis) {
        const cacheStatus = await redis.get(`payment:status:${this.context.referenceId}`);
        if (cacheStatus === "PROVISIONED") {
          this.logger.info(`Idempotency hit (Redis)! Transaction ${this.context.referenceId} already provisioned.`);
          return { status: "ALREADY_PROVISIONED" };
        }
      }

      // Optimistic check in Firestore outside transaction
      const transRef = db.collection("transactions").doc(this.context.referenceId);
      const transSnap = await transRef.get();
      if (transSnap.exists) {
        this.logger.info(`Idempotency hit (Firestore GET)! Transaction ${this.context.referenceId} already exists.`);
        if (redis) {
          await redis.set(`payment:status:${this.context.referenceId}`, "PROVISIONED", "EX", 86400); // 24h
        }
        return { status: "ALREADY_PROVISIONED" };
      }

      await db.runTransaction(async (transaction) => {
        const innerTransRef = db.collection("transactions").doc(this.context.referenceId);
        const checkoutSessionRef = db.collection("checkout_sessions").doc(this.context.referenceId);
        const userRef = db.collection("users").doc(this.context.userId);
        const adRef = this.context.adId ? db.collection("listings").doc(this.context.adId) : null;

        const [innerTransSnap, checkoutSessionDoc, adSnap] = await Promise.all([
          transaction.get(innerTransRef),
          transaction.get(checkoutSessionRef),
          adRef ? transaction.get(adRef) : Promise.resolve(null)
        ]);
        
        // Absolute Idempotency
        if (innerTransSnap.exists) {
          this.logger.info(`Idempotency hit! Transaction ${this.context.referenceId} already exists. Returning success.`);
          return { status: "ALREADY_PROVISIONED" };
        }

        // 1. Ažuriraj transakciju i wallet kroz FinancialLedgerService metodu unutar OVE transakcije
        const transactionType = this.context.type === "wallet_deposit" ? TransactionType.DEPOSIT : TransactionType.PAYMENT;
        await FinancialLedgerService.applyBalanceInTransaction(
            transaction,
            this.context.userId,
            this.context.amount,
            transactionType,
            `Plaćanje putem Stripe-a (${this.context.type})`,
            this.context.referenceId,
            {
              adId: this.context.adId || null,
              packageId: this.context.packageId || null,
              currency: this.context.currency
            }
        );

        // 2. Process Fulfillment
        if (this.context.type === "wallet_deposit") {
            transaction.update(userRef, {
                lastPaymentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
        } else if (this.context.type === "package_purchase") {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            
            transaction.update(userRef, {
                activePackage: this.context.packageId,
                packageExpiry: firebaseAdmin.firestore.Timestamp.fromDate(expiryDate),
                lastPaymentAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
        } else if (this.context.type === "ad_payment") {
            if (!this.context.adId) throw new Error("adId missing for ad_payment fulfillment");
            if (!adSnap || !adSnap.exists) throw new Error(`Ad ${this.context.adId} not found for activation`);
            const adData = adSnap.data()!;

            if (adData.status !== "active") {
                const updateData: any = {
                    status: "active",
                    paymentConfirmedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                };

                if (
                    this.context.packageId === "premium" ||
                    this.context.packageId === "premium_partner" ||
                    this.context.packageId === "pro"
                ) {
                    updateData.isPremium = true;
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + 30);
                    updateData.premiumUntil = firebaseAdmin.firestore.Timestamp.fromDate(expiry);
                }

                transaction.update(adRef, updateData);

                // Statistička agregacija unutar transakcije
                await AdminStatsService.updateGlobalStats(
                    adData.type || "ads",
                    1,
                    updateData.isPremium || false,
                    "active",
                    transaction as import("firebase-admin/firestore").Transaction,
                );

                await AdminStatsService.updateUserStats(
                    this.context.userId,
                    { activeAds: 1 },
                    transaction as import("firebase-admin/firestore").Transaction,
                );
            }
        }

        // 3. Checkout session update
        if (checkoutSessionDoc.exists) {
            transaction.update(checkoutSessionRef, {
                status: "PROVISIONED",
                updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                provisionalAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // 4. Emit Sync Events (Outbox) - unutar ISTE transakcije
        const outboxRef = db.collection("outbox").doc();
        transaction.set(outboxRef, {
            type: DomainEvents.USER_UPDATED,
            payload: { userId: this.context.userId },
            status: "pending",
            attempts: 0,
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            version: 1,
        });

        if (this.context.adId) {
            const outboxAdRef = db.collection("outbox").doc();
            transaction.set(outboxAdRef, {
            type: DomainEvents.AD_UPDATED,
            payload: { id: this.context.adId },
            status: "pending",
            attempts: 0,
            createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            version: 1,
            });
        }
      });

      // Cache referenceId in Redis to prevent future database queries
      if (redis) {
        await redis.set(`payment:status:${this.context.referenceId}`, "PROVISIONED", "EX", 86400).catch(() => {});
      }

      // Clear cache after commit if package purchase
      if (this.context.type === "package_purchase") {
        try {
          const { CacheService } = await import("../cache.service.ts");
          await CacheService.delete(`auth:claims:${this.context.userId}`);
          const { AdminService } = await import("../admin.service.ts");
          await AdminService.syncClaims(this.context.userId);
        } catch (err) {
          this.logger.error(`Failed to invalidate cache after package purchase for ${this.context.userId}`, err);
        }
      }

    } catch (err: any) {
      this.logger.error("Payment transaction failed: " + err.message);
      
      // Send to DLQ (Dead Letter Queue) on fallback
      try {
        await db.collection("dlq").add({
            type: "PAYMENT_SAGA_FAILED",
            context: this.context,
            error: err.message,
            timestamp: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            severity: "CRITICAL"
        });
      } catch (dlqErr) {
        this.logger.error("Failed to write to DLQ: " + (dlqErr as { message?: string })?.message);
      }
      
      throw err;
    }
  }
}
