import { Router } from "express";
import { db } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { ApplicationsService } from "../services/applications.service.ts";
import { validateRequest } from "../middleware/validate.ts";
import { validateApplicationOwnership } from "../middleware/ownership.middleware.ts";
import { idempotency } from "../middlewares/idempotency.ts";
import { z } from "zod";
import { applicationActionSchema } from "@svet-gradjevine/shared";

export const applicationsRouter = Router();

const submitSchema = z.object({
  adId: z.string(),
  coverLetter: z.string().optional(),
  adTitle: z.string(),
  employerId: z.string(),
  candidateName: z.string(),
  candidateEmail: z.string().email().optional(),
  phone: z.string().optional(),
});

// Get my applications (as candidate)
applicationsRouter.get("/my", requireAuth, async (req, res, next) => {
  try {
    const uid = (req as any)?.user.uid;
    const snap = await db
      .collection("applications")
      .where("candidateId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    res.json(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    next(error);
  }
});

// Get applications for my job (as employer)
applicationsRouter.get("/job/:adId", requireAuth, async (req, res, next) => {
  try {
    const { adId } = req.params;
    const uid = (req as any)?.user.uid;
    const isAdmin = (req as any)?.user?.isAdmin || false;

    // Load ad from database and authorize
    const adDoc = await db.collection("listings").doc(adId).get();
    if (!adDoc.exists) {
      return res.status(404).json({ error: "Oglas nije pronađen" });
    }

    const adData = adDoc.data()!;
    if (adData.authorId !== uid && !isAdmin) {
      return res.status(403).json({ error: "Nemate ovlašćenje da vidite ove prijave" });
    }

    const snap = await db
      .collection("applications")
      .where("adId", "==", adId)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    res.json(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    next(error);
  }
});

// Create application (Saga Pattern via ApplicationsService)
applicationsRouter.post(
  "/",
  requireAuth,
  idempotency({ ttl: 10 }),
  validateRequest(submitSchema),
  async (req, res, next) => {
    try {
      const uid = (req as any)?.user.uid;
      const parsedBody = submitSchema.parse(req.body);
      const result = await ApplicationsService.submitApplication({
        ...parsedBody,
        candidateId: uid,
      });

      res.json({ id: result.id, success: true });
    } catch (error) {
      next(error);
    }
  },
);

// Update application status
applicationsRouter.patch(
  "/:id/status",
  requireAuth,
  idempotency({ ttl: 5 }),
  validateApplicationOwnership,
  validateRequest(applicationActionSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = applicationActionSchema.parse(req.body);
    const uid = (req as any)?.user.uid;
    const isAdmin = (req as any)?.user?.isAdmin || false;

    const result = await ApplicationsService.updateApplicationStatus(
      id,
      status,
      uid,
      isAdmin,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});
