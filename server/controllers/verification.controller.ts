import { Request, Response } from "express";
import { VerificationService } from "../services/verification.service.ts";
import { Logger } from "../utils/logger.ts";
import { BadRequestError } from "../utils/appError.ts";
import { admin } from "../config/firebase.ts";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import type { AuthenticatedRequest } from "../types/auth.ts";

const logger = new Logger({ service: "VerificationController" });

export const uploadVerificationDocuments = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const files = req.files as Express.Multer.File[];
    const uid = req.user.uid;

    if (!uid) throw new BadRequestError("Niste autentifikovani");
    if (!files || files.length === 0)
      throw new BadRequestError("Niste poslali dokumenta");

    const uploadPromises = files.map(async (file) => {
      const fileName = `verifications/${uid}/${Date.now()}_${file.originalname}`;
      
      try {
        const bucket = admin.storage().bucket();
        const [exists] = await bucket.exists();
        if (!exists) {
          throw new Error("Target Cloud Storage bucket does not exist.");
        }

        const blob = bucket.file(fileName);
        const token = uuidv4();

        await blob.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });

        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      } catch (storageError: unknown) {
        if (process.env.NODE_ENV === "production") {
          throw storageError;
        }
        
        const error = storageError as Error;
        console.info(`[VERIFICATION STORAGE INFO] Direct local media stream active: ${error.message}`);
        
        const uploadsDir = path.join(process.cwd(), "uploads", "verifications", uid);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const localFilePath = path.join(uploadsDir, path.basename(fileName));
        fs.writeFileSync(localFilePath, file.buffer);
        
        return `/uploads/verifications/${uid}/${path.basename(fileName)}`;
      }
    });

    const urls = await Promise.all(uploadPromises);
    res.json({ urls });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Greška pri uploadu dokumenata:", err);
    res.status(500).json({ error: "Greška pri uploadu dokumenata" });
  }
};

export const submitVerificationRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { documentUrls, pib } = req.body;
    const uid = req.user.uid;

    if (!uid) throw new BadRequestError("Niste autentifikovani");

    const result = await VerificationService.submitRequest(uid, documentUrls, pib);
    res.status(201).json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    logger.error("Greška pri slanju zahteva za verifikaciju:", err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const getVerificationRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin" && !req.user.isAdmin) {
      return res.status(403).json({ error: "Niste admin" });
    }

    const { status } = req.query;
    const requests = await VerificationService.getRequests(status as string);
    res.json(requests);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

export const processVerificationRequest = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const adminId = req.user.uid;

    if (!adminId) throw new BadRequestError("Niste autentifikovani");
    if (req.user.role !== "admin" && req.user.role !== "superadmin" && !req.user.isAdmin) {
      return res.status(403).json({ error: "Niste admin" });
    }

    const result = await VerificationService.processRequest(
      id,
      adminId,
      action as "approve" | "reject",
      comment,
    );
    res.json(result);
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};
