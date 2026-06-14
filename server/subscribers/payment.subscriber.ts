import { eventBus, DomainEvents } from "../events/event-bus.ts";
import type { PaymentSagaContext } from "../events/payment.types.ts";
import { Logger } from "../utils/logger.ts";
import { emailService } from "../services/emailService.ts";
import { db, admin } from "../config/firebase.ts";

export const initPaymentSubscriber = () => {
  const logger = new Logger({ service: "PaymentSubscriber" });

  eventBus.on(DomainEvents.PAYMENT_COMPLETED, async (payload: PaymentSagaContext) => {
    logger.info(
      `[PaymentSubscriber] Received PAYMENT_COMPLETED for ${payload.referenceId}. Starting Saga...`,
    );

    try {
      logger.warn(
        `[PaymentSubscriber] PAYMENT_COMPLETED event received for ${payload.referenceId}, but payment saga processing is disabled in this branch.`,
      );

      // In the current repo state, Stripe-specific checkout saga handling has been removed.
      // Keep this listener present only for event compatibility and future payment flow replacement.
      try {
        const statsRef = db.collection("user_stats").doc(payload.userId);
        const statsUpdates: Record<string, unknown> = {
          lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          lastPaymentAmount: payload.amount || 0,
          lastPaymentType: payload.type || "unknown",
          lastPaymentStatus: "completed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (payload.amount) {
          statsUpdates.totalSpend = admin.firestore.FieldValue.increment(payload.amount);
          statsUpdates.totalPaymentsCount = admin.firestore.FieldValue.increment(1);
        }

        if (payload.type === "package_purchase" && payload.packageId) {
          statsUpdates.activePackage = payload.packageId;
          statsUpdates.packageExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        if (
          (payload.type === "ad_payment" && (payload.packageId === "premium" || payload.packageId === "pro" || payload.packageId === "premium_partner")) ||
          (payload.type === "package_purchase" && (payload.packageId === "premium" || payload.packageId === "pro" || payload.packageId === "premium_partner"))
        ) {
          statsUpdates.premiumAdsCount = admin.firestore.FieldValue.increment(1);
          statsUpdates.totalPremiumPurchases = admin.firestore.FieldValue.increment(1);
        }

        await statsRef.set(statsUpdates, { merge: true });
        logger.info(`[PaymentSubscriber] Successfully updated pre-aggregated user_stats document for ${payload.userId}`);

        // Evict L1 (Memory) and L2 (Redis) cache for the user across all cluster instances
        const { DashboardService } = await import("../services/dashboard.service.ts");
        await DashboardService.clearEmployerStatsCache(payload.userId).catch((err: unknown) => {
          const error = err as Error;
          logger.error(`[PaymentSubscriber] Failed to evict dashboard cache for user: ${payload.userId}`, { error: error.message });
        });

        // Pre-warm the cache immediately after payment to ensure <50ms response on next login
        try {
          const { DashboardPrewarmService } = await import("../services/dashboard-prewarm.service.ts");
          // Determine role if possible, fallback to standard employer for most payments
          const role = payload.role || "poslodavac";
          await DashboardPrewarmService.prewarmUser(payload.userId, role);
        } catch (prewarmErr: unknown) {
          const error = prewarmErr as Error;
          logger.error(`[PaymentSubscriber] Prewarm failed for user: ${payload.userId}`, { error: error.message });
        }
      } catch (statsErr: unknown) {
        const error = statsErr as Error;
        logger.error(`[PaymentSubscriber] Failed to update pre-aggregated user_stats document`, {
          error: error.message,
        });
      }

      // Send confirmation email
      try {
        const userDoc = await db.collection("users").doc(payload.userId).get();
        const email = userDoc.data()?.email;
        if (email) {
          await emailService.sendEmail({
            to: email,
            subject: "Uplata uspešna - Svet Građevine",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #FEBF0D;">Uplata Primljena!</h2>
                <p>Vaša transakcija je uspešno obrađena.</p>
                <p>Tip: <strong>${payload.type}</strong></p>
                <p>Iznos: <strong>${payload.amount} ${payload.currency}</strong></p>
                <p>Hvala Vam na poverenju!</p>
              </div>
            `,
          });
        }
      } catch (emailErr) {
        logger.error("Failed to send payment confirmation email", {
          error: emailErr,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(
        `[PaymentSubscriber] Saga failed for ${payload.referenceId}`,
        { error: error.message },
      );
      // Re-throw so OutboxWorker knows it failed if it's called directly or via event bus
      // In our case, OutboxWorker handles retries if we throw.
      throw err;
    }
  });
};
