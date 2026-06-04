import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { admin } from "../config/firebase.ts";
import { MagazineStatsService } from "../services/magazine/magazine-stats.service.ts";
import { MagazineCrudService } from "../services/magazine/magazine-crud.service.ts";
import { MagazineCategoryService } from "../services/magazine-category.service.ts";
import { MagazineAIService } from "../services/magazine-ai.service.ts";
import { MagazineAiWriterService } from "../services/magazine-ai-writer.service.ts";
import { requireAdmin } from "../middleware/auth.middleware.ts";
import { adminTriggerLimiter, statsAggregationLimiter } from "../middleware/rate-limit.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { 
  createArticleSchema, 
  updateArticleSchema, 
  createCategorySchema, 
  updateCategorySchema 
} from "./magazine.schema.ts";

export const magazineAdminRouter = Router();

// Secure all endpoints beneath this route with requireAdmin and rate limiting
magazineAdminRouter.use(requireAdmin);
magazineAdminRouter.use(adminTriggerLimiter);

/**
 * =========================================================================
 * MAGAZINE ARTICLES CRUD
 * =========================================================================
 */

/**
 * GET /api/admin/magazine/articles
 * Get all articles (for admin list display, draft tracking, pagination)
 */
magazineAdminRouter.get("/articles", async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const articles = await MagazineCrudService.getAllArticlesAdmin(limit);
    res.json({ success: true, articles });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/articles
 * Create new magazine article with validation
 */
magazineAdminRouter.post(
  "/articles",
  validateRequest(createArticleSchema),
  async (req, res, next) => {
    try {
      const articleId = await MagazineCrudService.createArticle(req.body);
      res.status(201).json({ success: true, id: articleId, message: "Članak uspešno kreiran" });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/magazine/articles/:id
 * Update article content/meta
 */
magazineAdminRouter.patch(
  "/articles/:id",
  validateRequest(updateArticleSchema),
  async (req, res, next) => {
    try {
      await MagazineCrudService.updateArticle(req.params.id, req.body);
      res.json({ success: true, message: "Članak uspešno ažuriran" });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/magazine/articles/:id
 * Delete article
 */
magazineAdminRouter.delete("/articles/:id", async (req, res, next) => {
  try {
    await MagazineCrudService.deleteArticle(req.params.id);
    res.json({ success: true, message: "Članak uspešno obrisan" });
  } catch (err) {
    next(err);
  }
});

// Configure multer specifically for magazine uploads (images only, max 10MB)
const magazineUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("FILE_TYPE_REJECTED"));
    }
  },
});

/**
 * POST /api/admin/magazine/upload-media
 * Upload an article image (featured image or gallery image) to GCS and compress to optimized WebP.
 */
magazineAdminRouter.post(
  "/upload-media",
  (req, res, next) => {
    magazineUpload.single("image")(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              error: "Fajl prelazi maksimalnu dozvoljenu veličinu od 10MB.",
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
      const uploadType = req.body.type || "featured"; // "featured" or "gallery"

      if (!file) {
        return res.status(400).json({ error: "Nije prosleđena slika za upload." });
      }

      // Configure resize thresholds
      // Featured images: 1400px width. Gallery/inline body: 1000px width.
      const targetWidth = uploadType === "featured" ? 1400 : 1000;
      const quality = uploadType === "featured" ? 82 : 75;

      // Optimize image via Sharp to WebP format
      const optimizedBuffer = await sharp(file.buffer)
        .rotate()
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality, effort: 6 })
        .toBuffer();

      let publicUrl = "";
      const fileId = `${Date.now()}_${uuidv4()}.webp`;
      const fileName = `magazine/${uploadType}/${fileId}`;

      try {
        const bucket = admin.storage().bucket();
        const [exists] = await bucket.exists();
        if (!exists) {
          throw new Error("Target Cloud Storage bucket does not exist.");
        }

        const blob = bucket.file(fileName);
        const token = uuidv4();

        await blob.save(optimizedBuffer, {
          metadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000",
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });

        publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      } catch (storageError: any) {
        console.log(`[MAGAZINE STORAGE INFO] Direct local media stream active.`);
        
        const uploadsDir = path.join(process.cwd(), "uploads", "magazine", uploadType);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const localFilePath = path.join(uploadsDir, fileId);
        fs.writeFileSync(localFilePath, optimizedBuffer);
        
        publicUrl = `/uploads/magazine/${uploadType}/${fileId}`;
      }

      res.json({
        success: true,
        url: publicUrl,
        fileName,
        type: uploadType,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * =========================================================================
 * MAGAZINE CATEGORIES CRUD
 * =========================================================================
 */

/**
 * GET /api/admin/magazine/categories
 * Get all active and inactive categories for the admin panel
 */
magazineAdminRouter.get("/categories", async (req, res, next) => {
  try {
    const categories = await MagazineCategoryService.getAllCategoriesAdmin();
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/categories
 * Create or upsert category
 */
magazineAdminRouter.post(
  "/categories",
  validateRequest(createCategorySchema),
  async (req, res, next) => {
    try {
      const { slug } = req.body;
      await MagazineCategoryService.upsertCategory(slug, req.body);
      res.status(201).json({ success: true, message: "Kategorija uspešno kreirana" });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/admin/magazine/categories/:id
 * Update category parameters
 */
magazineAdminRouter.patch(
  "/categories/:id",
  validateRequest(updateCategorySchema),
  async (req, res, next) => {
    try {
      await MagazineCategoryService.upsertCategory(req.params.id, req.body);
      res.json({ success: true, message: "Kategorija uspešno ažurirana" });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/admin/magazine/categories/:id
 * Delete category
 */
magazineAdminRouter.delete("/categories/:id", async (req, res, next) => {
  try {
    await MagazineCategoryService.deleteCategory(req.params.id);
    res.json({ success: true, message: "Kategorija uspešno obrisana" });
  } catch (err) {
    next(err);
  }
});

/**
 * =========================================================================
 * MAGAZINE METADATA & AGGREGATED STATISTICS
 * =========================================================================
 */

/**
 * GET /api/admin/magazine/stats
 * Retrieve global magazine statistics (articles, views, category counts, top tags)
 */
magazineAdminRouter.get("/stats", statsAggregationLimiter, async (req, res, next) => {
  try {
    const stats = await MagazineStatsService.getMetadata();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/stats/recalculate
 * Triggers highly optimized database-wide stats recalculation using projections
 */
magazineAdminRouter.post("/stats/recalculate", async (req, res, next) => {
  try {
    const freshStats = await MagazineStatsService.recalculateMetadata();
    res.json({ success: true, message: "Statistika uspešno preračunata i ažurirana.", stats: freshStats });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/ai-suggest
 * Generates 3 SEO title (H1) and meta description variants for an article
 */
magazineAdminRouter.post("/ai-suggest", async (req, res, next) => {
  try {
    const variants = await MagazineAIService.generateSEOVariants(req.body);
    if (!variants) {
      return res.status(400).json({ success: false, error: "AI integracija trenutno nije aktivna ili nema podešenog GEMINI_API_KEY ključa." });
    }
    res.json({ success: true, variants });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/ai-generate
 * Generates a complete expert article using Gemini 3.5 Flash
 */
magazineAdminRouter.post("/ai-generate", async (req, res, next) => {
  try {
    const { topic, category, tone, approximateLength } = req.body;
    if (!topic || !category) {
      return res.status(400).json({
        success: false,
        error: "Molimo unesite temu i odaberite kategoriju za pisanje članka."
      });
    }

    const result = await MagazineAiWriterService.generateAutonomousArticle({
      category,
      specificTopic: topic,
      tone: tone || "strucan",
      approximateLength: approximateLength ? parseInt(approximateLength, 10) : 1000
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        error: "Greška pri radu Gemini modela ili redakcijskog pipeline-a. Proverite sistemski ključ u Settings > Secrets."
      });
    }

    res.json({ 
      success: true, 
      article: {
        ...result.article,
        audit: result.audit
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/autopilot-trigger
 * Manually executes the background autonomous writer task asynchronously
 */
magazineAdminRouter.post("/autopilot-trigger", async (req, res, next) => {
  try {
    const { AutonomousEditorialWorker } = await import("../workers/autonomous-editorial.worker.ts");
    
    // Trigger asynchronously so API stays extremely high performance (non-blocking)
    AutonomousEditorialWorker.runTask().catch((err) => {
      console.error("[AutopilotManualTrigger] Asynchronous run error:", err);
    });

    res.json({
      success: true,
      message: "Pozadinski Autopilot Scheduler uspešno pokrenut u pozadini. Članak se generiše i biće dodat u draftove."
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/magazine/ctr-report
 * Exposes full CTR Conversion Analytics reports based on views and clickstreams
 */
magazineAdminRouter.get("/ctr-report", statsAggregationLimiter, async (req, res, next) => {
  try {
    const { MagazineCtrService } = await import("../services/magazine-ctr.service.ts");
    const report = await MagazineCtrService.getConversionReport();
    res.json({
      success: true,
      report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/magazine/ctr-flush-trigger
 * Manually flushes in-memory/Redis click events directly to Firestore
 */
magazineAdminRouter.post("/ctr-flush-trigger", async (req, res, next) => {
  try {
    const { MagazineCtrService } = await import("../services/magazine-ctr.service.ts");
    await MagazineCtrService.flush();
    res.json({
      success: true,
      message: "Baferi klikova uspešno upisani u Firestore!"
    });
  } catch (err) {
    next(err);
  }
});


