import { Router } from "express";
import multer from "multer";
import {
  submitVerificationRequest,
  getVerificationRequests,
  processVerificationRequest,
  uploadVerificationDocuments,
} from "../controllers/verification.controller.ts";
import { authMiddleware, requireAuth } from "../middleware/auth.middleware.ts";
import { BadRequestError } from "../utils/appError.ts";
import { validateRequest, submitVerificationSchema, processVerificationSchema } from "../middleware/validate.ts";

import { RequestHandler } from "express";

const verificationRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req: import("express").Request, file: Express.Multer.File, cb: import("multer").FileFilterCallback) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const originalName = file.originalname || "";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];

    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      return cb(new BadRequestError("Odbijen fajl: Dozvoljene su isključivo slike (jpg, jpeg, png, webp) i PDF dokumenti."));
    }
    cb(null, true);
  }
}); // 10MB limit

// Publicly authenticated routes
verificationRouter.post(
  "/upload",
  authMiddleware,
  requireAuth,
  upload.array("documents", 5),
  uploadVerificationDocuments as unknown as RequestHandler,
);
verificationRouter.post(
  "/submit",
  authMiddleware,
  requireAuth,
  validateRequest(submitVerificationSchema),
  submitVerificationRequest as unknown as RequestHandler,
);

// Admin-only routes (middleware within controller handles role check for now,
// but we could also add an isAdmin middleware here for cleaner code)
verificationRouter.get(
  "/requests",
  authMiddleware,
  requireAuth,
  getVerificationRequests as unknown as RequestHandler,
);
verificationRouter.post(
  "/requests/:id/process",
  authMiddleware,
  requireAuth,
  validateRequest(processVerificationSchema),
  processVerificationRequest as unknown as RequestHandler,
);

export { verificationRouter };
