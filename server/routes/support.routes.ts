import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { supportSchema } from "@svet-gradjevine/shared";
import { apiLimiter } from "../middleware/rate-limit.middleware.ts";

export const supportRouter = Router();

// Create ticket (public or auth)
supportRouter.post(
  "/tickets",
  apiLimiter,
  validateRequest(supportSchema),
  async (req, res, next) => {
    try {
      const { name, email, subject, message } = req.body;

      // Validated via schema

      const ticket = {
        name,
        email,
        subject: subject || "Opšti upit",
        message,
        status: "new",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection("supportTickets").add(ticket);
      res.status(201).json({ id: docRef.id, success: true });
    } catch (error) {
      next(error);
    }
  },
);
