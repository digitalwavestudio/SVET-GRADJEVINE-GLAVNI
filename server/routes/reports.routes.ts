import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { reportSchema } from "@svet-gradjevine/shared";

export const reportsRouter = Router();

// Create report
reportsRouter.post(
  "/",
  requireAuth,
  validateRequest(reportSchema),
  async (req, res, next) => {
    try {
      const uid = getReqUser(req).uid;
      const {
        targetId,
        targetType,
        targetName,
        reason,
        details,
        reporterName,
      } = req.body;

      // Values validated by schema

      const report = {
        targetId,
        targetType,
        targetName,
        reason,
        details,
        reporterId: uid,
        reporterName,
        status: "PENDING",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("reports").add(report);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);
