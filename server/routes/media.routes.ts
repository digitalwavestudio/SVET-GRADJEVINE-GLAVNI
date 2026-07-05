import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { admin } from "../config/firebase.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";

export const mediaRouter = Router();

// Zod validation schema for the direct presigned URL request
const presignedRequestSchema = z.object({
  contentType: z.string().min(1, "Mime-type je obavezan"),
  folder: z.string().min(1, "Putanja direktorijuma je obavezna"),
  customFileName: z.string().optional(),
});

// Presigned URL generation for Direct-to-GCS Client Uploads
mediaRouter.post(
  "/presigned",
  authMiddleware,
  validateRequest(presignedRequestSchema),
  async (req, res, next) => {
    try {
      const user = getReqUser(req);
      const { contentType = "image/webp", folder: folderParam = "media", customFileName } = req.body;
      let folder = folderParam;

      // DOMAIN 5: Security Hardening (Path Traversal/Spoofing protection)
      // Force users to ONLY upload within safe paths
      if (
        folder.includes("..") || 
        folder.startsWith("/") || 
        (customFileName && (customFileName.includes("..") || customFileName.startsWith("/")))
      ) {
          return res.status(403).json({ error: "Pokušaj kompromitacije putanje (path traversal)." });
      }

      // Ensure base folder is one of our registered standard layouts
      const allowedFolders = [
        "ads/gallery", 
        "profiles/avatars", 
        "media", 
        "portfolio",
        "branding",
        "magazine/featured",
        "magazine/gallery"
      ];
      if (!allowedFolders.some(allow => folder.startsWith(allow))) {
          folder = "media"; // Default fallback
      }

      // Check permissions: only admins can write to branding and magazine buckets
      if ((folder.startsWith("branding") || folder.startsWith("magazine")) && !user?.isAdmin) {
          return res.status(403).json({ error: "Samo administratori mogu otpremati medije u ovaj direktorijum." });
      }

      const bucket = admin.storage().bucket();
      // Always inject the User ID strictly enforcing namespace isolation: folder / UID / customName
      let safeCustomFileName = "";
      if (customFileName) {
        const baseName = customFileName.split('/').pop() || "";
        safeCustomFileName = baseName.replace(/[^a-zA-Z0-9_.-]/g, ''); 
        if (!safeCustomFileName) safeCustomFileName = uuidv4();
      } else {
        safeCustomFileName = `${Date.now()}_${uuidv4()}.webp`;
      }
      
      const fileName = `${folder}/${user.uid}/${safeCustomFileName}`;
      const token = uuidv4();
      const file = bucket.file(fileName);

      const expires = Date.now() + 15 * 60 * 1000; // 15 minutes

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires,
        contentType,
        extensionHeaders: {
          "x-goog-meta-firebasestoragedownloadtokens": token,
        },
      });

      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;

      res.json({
        uploadUrl: url,
        downloadUrl,
        fileName,
      });
    } catch (err) {
      next(err);
    }
  }
);


// Configure multer limits and file filter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/svg+xml",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("FILE_TYPE_REJECTED"));
    }
  },
});

mediaRouter.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    // Standardize to accept form key "image" or "file" or "media"
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "Fajl prelazi maksimalnu dozvoljenu veličinu od 5MB.",
            });
          }
          return res
            .status(400)
            .json({ error: `Greška pri uploadu: ${err.message}` });
        }
        if (err.message === "FILE_TYPE_REJECTED") {
          return res.status(400).json({
            error:
              "Nedozvoljen tip fajla. Dozvoljeni su samo PNG, JPEG, WEBP i SVG formati.",
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
      const user = getReqUser(req);
      const requestedFolder = req.body.folder || req.query.folder || "media";

      if (!file) {
        return res
          .status(400)
          .json({ error: "Nije prosleđena nijedna slika za uspeh." });
      }

      // Enforce clean directory names (against path traversals)
      let cleanFolder = String(requestedFolder)
        .replace(/\.\./g, "")
        .replace(/^\//g, "");
      
      if (!cleanFolder) {
        cleanFolder = "media";
      }

      // Determine if this is a logo/avatar or a pre-optimized small image
      const isLogoOrAvatar = 
        cleanFolder.startsWith("profiles/avatars") || 
        cleanFolder.startsWith("branding") ||
        (file.originalname && (
          file.originalname.toLowerCase().includes("logo") || 
          file.originalname.toLowerCase().includes("avatar")
        )) ||
        file.mimetype === "image/svg+xml" ||
        file.size < 1.5 * 1024 * 1024; // Preserves quality for images under 1.5MB

      let processedBuffer: Buffer;
      let extension = "webp";
      let contentType = "image/webp";

      if (isLogoOrAvatar) {
        // Bypass Sharp optimization entirely to prevent losing vector/raster pixel-perfect crispness
        processedBuffer = file.buffer;
        if (file.mimetype === "image/png") {
          extension = "png";
          contentType = "image/png";
        } else if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
          extension = "jpg";
          contentType = "image/jpeg";
        } else if (file.mimetype === "image/svg+xml") {
          extension = "svg";
          contentType = "image/svg+xml";
        } else if (file.mimetype === "image/gif") {
          extension = "gif";
          contentType = "image/gif";
        } else {
          extension = "webp";
          contentType = "image/webp";
        }
      } else {
        // Optimize listing/gallery images via Sharp to WebP format with extremely high quality config
        processedBuffer = await sharp(file.buffer)
          .rotate() // keeps original orientation based on EXIF tag
          .resize({ width: 2000, withoutEnlargement: true }) // aspect ratio preserved, max 2000px width
          .webp({ quality: 98 })
          .toBuffer();
        extension = "webp";
        contentType = "image/webp";
      }

      const fileId = `${Date.now()}_${uuidv4()}.${extension}`;
      const fileName = `${cleanFolder}/${user.uid}/${fileId}`;

      let publicUrl = "";

      try {
        const bucket = admin.storage().bucket();
        const blob = bucket.file(fileName);

        await blob.save(processedBuffer, {
          metadata: {
            contentType,
            cacheControl: "public, max-age=31536000",
          },
        });

        await blob.makePublic();

        publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(fileName)}`;
      } catch (storageError: any) {
        console.error("[GCS_UPLOAD_FAIL]", storageError?.message || storageError);
        if (process.env.NODE_ENV === "production" || process.env.K_SERVICE) {
          throw storageError;
        }
        console.info(`[MEDIA STORAGE INFO] Direct local media stream active.`);
        const uploadsDir = path.join(process.cwd(), "uploads", cleanFolder, user.uid);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const localFilePath = path.join(uploadsDir, fileId);
        fs.writeFileSync(localFilePath, processedBuffer);
        publicUrl = `/uploads/${cleanFolder}/${user.uid}/${fileId}`;
      }

      res.json({
        url: publicUrl,
        success: true,
        fileName,
      });
    } catch (err) {
      next(err);
    }
  },
);
