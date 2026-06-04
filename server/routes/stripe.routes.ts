import { Router } from "express";
import Stripe from "stripe";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { z } from "zod";

import { emailService } from "../services/emailService.ts";
import { getErrorMessage } from "../utils/error-handler.ts";

export const stripeRouter = Router();

// Retrieve Stripe secret key from env
const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_mock"; // Use dummy for dev if not present
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

const webhookEventSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    data: z
      .object({
        object: z
          .object({
            id: z.string(),
            payment_status: z.string().optional(),
            amount_total: z.number().nullable().optional(),
            metadata: z.record(z.string(), z.unknown()).nullable().optional(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

// Lazy initializing Stripe client to speed up Cold Start (PROMPT ZADATAK 12)
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecret, {
      apiVersion: "2024-04-10" as any,
    });
  }
  return stripeClient;
}

stripeRouter.post(
  "/create-checkout-session",
  requireAuth,
  async (req, res, next) => {
    try {
      const userId = (req as any)?.user.uid;
      const {
        amount: clientAmount,
        packageId,
        packageName,
        adId,
        type = "wallet_deposit",
      } = req.body;

      let finalAmount = clientAmount;
      let finalPackageName = packageName;

      if (type === "ad_payment" || type === "package_purchase") {
        if (!packageId) {
          return res.status(400).json({
            error: "Package ID is required for ad or package payments",
          });
        }

        // Backend Pricing Authority: do not trust clientAmount!
        const { getPackageById } =
          await import("../../src/constants/adPackages.ts");
        let category = "job"; // Default, will attempt to resolve

        if (adId) {
          const adSnap = await db.collection("listings").doc(adId).get();
          if (adSnap.exists) {
            const adData = adSnap.data();
            category = adData?.category || adData?.type || "job";
          }
        } else if (packageId === "premium_partner") {
          category = "company";
        }

        const trustedPackage = getPackageById(category, packageId);
        if (!trustedPackage) {
          return res.status(400).json({ error: "Invalid package selected" });
        }

        finalAmount = trustedPackage.priceNum;
        finalPackageName = trustedPackage.name;
      } else if (type === "wallet_deposit") {
        // For wallet deposits, protect against negative or absurdly small amounts
        if (!finalAmount || finalAmount < 1) {
          return res.status(400).json({ error: "Minimum deposit amount is 1" });
        }
      }

      if (!finalAmount || finalAmount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      const currency =
        type === "package_purchase" || type === "ad_payment" ? "eur" : "rsd";

      // Create a checkout session
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name:
                  finalPackageName ||
                  (type === "wallet_deposit"
                    ? "Dopuna Novčanika (Credits)"
                    : type === "ad_payment"
                      ? "Aktivacija Oglasa"
                      : "Oglasni Paket"),
              },
              unit_amount: Math.round(finalAmount * 100), // Stripe expects amounts in cents/paras
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          userId,
          type,
          adId: adId || "",
          packageId: packageId || "",
        },
        success_url: `${process.env.APP_URL || process.env.PUBLIC_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || process.env.PUBLIC_URL || "http://localhost:3000"}/checkout?paket=${packageId || ""}&payment_error=cancel`,
      });

      await db.runTransaction(async (transaction) => {
        const checkoutSessionRef = db
          .collection("checkout_sessions")
          .doc(session.id);
        transaction.set(checkoutSessionRef, {
          status: "PENDING",
          userId,
          type,
          amount: finalAmount,
          stripeSessionId: session.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      res.json({ url: session.url });
    } catch (err: unknown) {
      console.error("Stripe create checkout error:", getErrorMessage(err));
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

// Verify Stripe Checkout Session Status (Step 3: Polling Endpoint)
stripeRouter.get("/verify-session", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any)?.user.uid;
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Session ID is required" });
    }

    const sessionDoc = await db
      .collection("checkout_sessions")
      .doc(sessionId)
      .get();

    if (!sessionDoc.exists) {
      return res.json({
        success: false,
        error: "session_not_found",
        status: null,
      });
    }

    const sessionData = sessionDoc.data()!;

    if (sessionData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (sessionData.status === "PROVISIONED") {
      return res.json({ success: true, status: "PROVISIONED" });
    }

    return res.json({ success: false, status: sessionData.status }); // This covers PENDING and PROCESSING
  } catch (err: unknown) {
    console.error("Verify session error:", getErrorMessage(err));
    return res.status(500).json({ error: "Failed to verify session" });
  }
});

// Webhook for standard Stripe integration
stripeRouter.post("/webhook", async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    // If we use real Stripe logic, we check signature
    if (stripeSecret !== "sk_test_mock") {
      event = getStripe().webhooks.constructEvent(
        (req as import('express').Request & { rawBody: Buffer }).rawBody,
        sig!,
        stripeWebhookSecret,
      );
    } else {
      event = req.body; // Mock logic fallback
    }

    event = webhookEventSchema.parse(event);
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    console.error("Webhook verification failed:", errorMsg);
    return res.status(400).send(`Webhook Error: ${errorMsg}`);
  }

  // Handle the event
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as unknown as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const userId = session.metadata?.userId;
        if (!userId) throw new Error("No userId in metadata");

        const amount = (session.amount_total || 0) / 100;
        const type = session.metadata?.type;
        const adId = session.metadata?.adId;
        const packageId = session.metadata?.packageId;

        // NEW: Instead of processing directly, we use Outbox for Saga Orchestration
        const eventId = event.id; // Unique Stripe event ID

        await db.runTransaction(async (transaction) => {
          // Idempotency check: Ensure the event hasn't been processed already
          if (eventId) {
            const idempotencyRef = db.collection("webhook_events").doc(eventId);
            const idempotencyDoc = await transaction.get(idempotencyRef);

            if (idempotencyDoc.exists) {
              console.log(
                `[StripeWebhook] Event ${eventId} already processed. Skipping duplicate.`,
              );
              return; // Early exit, transaction commits without changes
            }

            transaction.set(idempotencyRef, {
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              stripeSessionId: session.id,
              type: event.type,
            });
          }

          const checkoutSessionRef = db
            .collection("checkout_sessions")
            .doc(session.id);
          const checkoutSessionDoc = await transaction.get(checkoutSessionRef);

          if (checkoutSessionDoc.exists) {
            transaction.update(checkoutSessionRef, {
              status: "PROCESSING",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }

          const outboxRef = db.collection("outbox").doc();
          transaction.set(outboxRef, {
            type: "PAYMENT_COMPLETED",
            payload: {
              userId,
              amount,
              type,
              adId,
              packageId,
              currency: session.currency?.toUpperCase() || "RSD",
              referenceId: session.id,
              stripeSessionId: session.id,
            },
            status: "pending",
            attempts: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            correlationId: userId,
            version: 1,
          });
        });

        console.log(
          `[StripeWebhook] Payment event queued for Saga: ${session.id}`,
        );
      }
    }

    res.json({ received: true });
  } catch (err: unknown) {
    console.error("Webhook processing error:", getErrorMessage(err));
    res.status(500).send(`Webhook Process Error: ${getErrorMessage(err)}`);
  }
});
