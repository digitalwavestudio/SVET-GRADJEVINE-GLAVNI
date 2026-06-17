import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { db, admin } from "../config/firebase.ts";
import { DatabaseManager } from "../utils/db-manager.ts";
import { validateRequest } from "../middleware/validate.ts";
import { partnerSchema } from "@svet-gradjevine/shared";
import { z } from "zod";

import { eventBus, DomainEvents } from "../events/event-bus.ts";

export const partnersRouter = Router();

const partnerMetricsSchema = z.object({
  type: z.enum(["leads", "conversions"], {
    message: "Tip metrike mora biti 'leads' ili 'conversions'",
  }),
  amount: z.number().int().optional(),
});

const partnerInitSchema = z.object({
  code: z.string().min(1, "Kod partnera je obavezan"),
  slug: z.string().min(1, "Slug partnera je obavezan"),
});

// Track conversion
partnersRouter.post(
  "/conversion",
  requireAuth,
  validateRequest(partnerSchema),
  async (req, res, next) => {
    try {
      const { partnerId, amount, commissionAmount } = req.body;

      // Checked by schema

      const commission = commissionAmount || amount * 0.1;

      await db
        .collection("users")
        .doc(partnerId)
        .update({
          partnerConversions: admin.firestore.FieldValue.increment(1),
          partnerBalance: admin.firestore.FieldValue.increment(commission),
        });

      eventBus.emit(DomainEvents.USER_UPDATED, { userId: partnerId });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

// Update metrics
partnersRouter.post("/metrics/:id", requireAuth, validateRequest(partnerMetricsSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount = 1 } = req.body;

    if (type !== "leads" && type !== "conversions") {
      return res.status(400).json({ error: "Invalid metric type" });
    }
    const field = type === "leads" ? "partnerLeads" : "partnerConversions";

    await db
      .collection("users")
      .doc(id)
      .update({
        [field]: admin.firestore.FieldValue.increment(amount),
      });

    eventBus.emit(DomainEvents.USER_UPDATED, { userId: id });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Init partner
partnersRouter.post("/init/:id", requireAuth, validateRequest(partnerInitSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, slug } = req.body;

    // Optional: check if current user is admin, or if user is authorizing themselves.
    if (getReqUser(req).uid !== id && !getReqUser(req).isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const cleanSlug = slug.toLowerCase();
    const redis = DatabaseManager.getRegionalRedisConnection();
    if (redis) {
      const addedCount = await redis.sadd("unique_partner_slugs", cleanSlug);
      if (addedCount === 0) {
        return res.status(400).json({ error: "Slug partnera već postoji u sistemu." });
      }
    } else {
      const snap = await db
        .collection("users")
        .where("partnerSlug", "==", cleanSlug)
        .limit(1)
        .get();
      if (!snap.empty) {
        return res.status(400).json({ error: "Slug partnera već postoji u sistemu." });
      }
    }

    await db.collection("users").doc(id).update({
      role: "partner",
      partnerCode: code.toUpperCase(),
      partnerSlug: cleanSlug,
      partnerStatus: "active",
      partnerClicks: 0,
      partnerLeads: 0,
      partnerConversions: 0,
      partnerBalance: 0,
    });

    eventBus.emit(DomainEvents.USER_UPDATED, { userId: id });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get partner by code
partnersRouter.get("/by-code/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const snap = await db
      .collection("users")
      .where("role", "==", "partner")
      .where("partnerCode", "==", code.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: "Partner not found" });
    res.json({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    next(error);
  }
});

// Get partner by slug
partnersRouter.get("/by-slug/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const snap = await db
      .collection("users")
      .where("role", "==", "partner")
      .where("partnerSlug", "==", slug.toLowerCase())
      .limit(1)
      .get();

    if (snap.empty) return res.status(404).json({ error: "Partner not found" });
    res.json({ id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (error) {
    next(error);
  }
});
