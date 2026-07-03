import { Router } from "express";
import { UnifiedAdsService } from "../services/unified-ads.service.ts";
import { authMiddleware, requireAuth, requireVerifiedEmail } from "../middleware/auth.middleware.ts";
import { validateAdOwnership } from "../middleware/ownership.middleware.ts";
import { AuditService } from "../services/audit.service.ts";
import { adCreationLimiter } from "../middleware/rate-limit.middleware.ts";
import {
  getPublicAds,
  searchAds,
  getAdById,
  updateAd,
  getAdsBatch,
  getMyAds,
} from "../controllers/ads.controller.ts";
import { db, admin } from "../config/firebase.ts";
import { validateRequest, validateBody } from "../middleware/validate.ts";
import {
  createAdSchema,
  updateAdSchema,
  moderateAdSchema,
} from "@svet-gradjevine/shared";
import { cacheMiddleware } from "../middleware/cache.middleware.ts";

export const adsRouter = Router();

import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Helper exports/init for multer with size and type checks
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('FILE_TYPE_REJECTED') as unknown as Error);
    }
  },
});

adsRouter.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "Fajl prelazi maksimalnu dozvljenu veličinu od 5MB.",
            });
          }
          return res.status(400).json({ error: `Greška pri uploadu: ${err.message}` });
        }
        if (err.message === "FILE_TYPE_REJECTED") {
          return res.status(400).json({
            error: "Nedozvoljen tip fajla. Dozvoljeni su samo PNG, JPEG i WEBP formati.",
          });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res, next) => {
    try {
      const file = req.file;
      const user = req.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (!file) return res.status(400).json({ error: "No image provided" });

      // Optimize image via Sharp to WebP format
      const optimizedBuffer = await sharp(file.buffer)
        .rotate() // keeps original orientation based on EXIF tag
        .resize({ width: 1200, withoutEnlargement: true }) // aspect ratio preserved, max 1200px width
        .webp({ quality: 80 })
        .toBuffer();

      const fileId = `${Date.now()}_${uuidv4()}.webp`;
      const fileName = `ads/gallery/${user.uid}/${fileId}`;
      let url = "";

      try {
        const bucket = admin.storage().bucket();
        const blob = bucket.file(fileName);
        const token = uuidv4();

        await blob.save(optimizedBuffer, {
          metadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000",
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });

        url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      } catch (storageError: any) {
        console.error("[GCS_UPLOAD_FAIL]", storageError?.message || storageError);
        if (process.env.NODE_ENV === "production" || process.env.K_SERVICE) {
          throw storageError;
        }
        console.info(`[ADS STORAGE INFO] Direct local media stream active.`);
        const uploadsDir = path.join(process.cwd(), "uploads", "ads", "gallery", user.uid);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, fileId), optimizedBuffer);
        url = `/uploads/ads/gallery/${user.uid}/${fileId}`;
      }

      res.json({ url });
    } catch (err) {
      next(err);
    }
  }
);

// Get public default feeds caching 100 items for 30 seconds
adsRouter.get(
  "/public/:category",
  cacheMiddleware(30000, "ads_public"),
  getPublicAds,
);

// Get my ads
adsRouter.get("/my-ads", requireAuth, getMyAds as unknown as import("express").RequestHandler);

// Get favorite IDs
adsRouter.get("/favorites/ids", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `user_favorites_ids:${uid}`;
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const userDoc = await db.collection("users").doc(uid).get();
    const favorites = userDoc.data()?.favorites || [];
    await CacheService.set(cacheKey, favorites, 60 * 60 * 1000); // 1 sat
    res.json(favorites);
  } catch (error) {
    next(error);
  }
});

// Toggle favorite (POST to add, DELETE to remove)
adsRouter.post("/favorites/:id", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const adId = req.params.id;
    await db
      .collection("users")
      .doc(uid)
      .update({
        favorites: admin.firestore.FieldValue.arrayUnion(adId),
      });

    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `user_favorites_ids:${uid}`;
    let favorites = await CacheService.get<string[]>(cacheKey);
    if (!favorites) {
      const userDoc = await db.collection("users").doc(uid).get();
      favorites = userDoc.data()?.favorites || [];
    } else if (!favorites.includes(adId)) {
      favorites = [...favorites, adId];
    }
    await CacheService.set(cacheKey, favorites, 60 * 60 * 1000);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

adsRouter.delete("/favorites/:id", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const adId = req.params.id;
    await db
      .collection("users")
      .doc(uid)
      .update({
        favorites: admin.firestore.FieldValue.arrayRemove(adId),
      });
    
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `user_favorites_ids:${uid}`;
    let favorites = await CacheService.get<string[]>(cacheKey);
    if (!favorites) {
      const userDoc = await db.collection("users").doc(uid).get();
      favorites = userDoc.data()?.favorites || [];
    } else {
      favorites = favorites.filter(id => id !== adId);
    }
    await CacheService.set(cacheKey, favorites, 60 * 60 * 1000);
    
    // Log favorite-removal as an asynchronous audit trace
    AuditService.logDestructive(req, adId, "FAVORITE_REMOVAL", { type: "user_favorites" });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Search ads
adsRouter.post("/search", searchAds);

// Get premium partners for trust section (limited, cached)
adsRouter.get(
  "/premium-partners",
  cacheMiddleware(300000, "premium_partners"),
  async (req, res, next) => {
    try {
      const partners = await UnifiedAdsService.getPremiumPartners();
      res.json(partners);
    } catch (error) {
      next(error);
    }
  },
);

// Batch ads
adsRouter.post("/batch", getAdsBatch);
// Get single ad
adsRouter.get("/:id", getAdById);

// Update single ad
adsRouter.patch(
  "/:id",
  authMiddleware,
  validateAdOwnership,
  // ZOD strict middleware validation added for integrity
  validateBody(updateAdSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const parsedPayload = updateAdSchema.parse(req.body);
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Backend outbox pattern enforce via UnifiedAdsService
      await UnifiedAdsService.updateAd(
        parsedPayload.category,
        id,
        parsedPayload.data,
        user.uid
      );

      const { CacheService } = await import("../services/cache.service.ts");
      const { CacheKeys } = await import("../constants/cache-keys.ts");
      await CacheService.delete(CacheKeys.adDetail(id));

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

// Create new ad (any category)
adsRouter.post(
  "/create",
  authMiddleware,
  requireVerifiedEmail,
  adCreationLimiter,
  validateBody(createAdSchema),
  async (req, res, next) => {
    try {
      const parsedPayload = createAdSchema.parse(req.body);
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Niste prijavljeni" });
      }

      const uid = user.uid;

      const result = await UnifiedAdsService.createAd(
        parsedPayload.category,
        parsedPayload.data,
        uid
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },
);

// Delete ad
adsRouter.delete("/:category/:id", authMiddleware, validateAdOwnership, async (req, res, next) => {
  try {
    const { category, id } = req.params;
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });
    const result = await UnifiedAdsService.deleteAd(category, id, uid);

    // Log ad-deletion as an asynchronous audit trace
    AuditService.logDestructive(req, id, "AD_DELETION", { category });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Moderate ad
adsRouter.post(
  "/moderate",
  authMiddleware,
  validateRequest(moderateAdSchema),
  async (req, res, next) => {
    try {
      if (!req.user?.isAdmin)
        return res.status(403).json({ error: "Forbidden" });

      const { category, id, action, reason } = req.body;

      const result = await UnifiedAdsService.moderateAd(
        category,
        id,
        action,
        req.user.uid,
        reason,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);
