// @ts-nocheck
import { Router } from "express";
import { MagazineStatsService } from "../services/magazine/magazine-stats.service.ts";
import { MagazineCrudService } from "../services/magazine/magazine-crud.service.ts";
import { MagazineCategoryService } from "../services/magazine-category.service.ts";
import { cacheMiddleware } from "../middleware/cache.middleware.ts";
import { ArticleStatus } from "../../src/types/magazine.ts";

export const magazineRouter = Router();

// Cache-Control middleware for all static GET routes in magazine
magazineRouter.use((req, res, next) => {
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "public, max-age=600, s-maxage=3600");
  }
  next();
});

/**
 * GET /api/magazine/categories
 * List all active categories
 */
magazineRouter.get("/categories", cacheMiddleware(3600000), async (req, res, next) => {
  try {
    const categories = await MagazineCategoryService.getCategories();
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/magazine/articles
 * List all published articles
 */
magazineRouter.get("/articles", cacheMiddleware(300000), async (req, res, next) => {
  try {
    const { category, limit, startAfter } = req.query;
    const articles = await MagazineCrudService.getArticles({
      category: category as string,
      limit: limit ? parseInt(limit as string) : 12,
      startAfter: startAfter as string
    });
    res.json(articles);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/magazine/articles/:slug
 * Get full article content
 */
magazineRouter.get("/articles/:slug", cacheMiddleware(3600000), async (req, res, next) => {
  try {
    const article = await MagazineCrudService.getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ error: "Članak nije pronađen" });
    }
    
    // Background task: record view
    MagazineStatsService.recordView(article.id).catch(() => {});
    
    res.json(article);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/magazine/articles/:slug/related
 * Get related articles for a given article slug
 */
magazineRouter.get("/articles/:slug/related", cacheMiddleware(3600000), async (req, res, next) => {
  try {
    const article = await MagazineCrudService.getArticleBySlug(req.params.slug);
    if (!article) {
      return res.status(404).json({ error: "Članak nije pronađen" });
    }
    const related = await MagazineCrudService.getRelatedArticles(article.id);
    res.json(related);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/magazine/clicks
 * Record an internal link click inside an article (Saves to fast-path memory buffer / Redis)
 */
magazineRouter.post("/clicks", async (req, res, next) => {
  try {
    const { articleId, targetType } = req.body;
    if (!articleId || !targetType) {
      return res.status(400).json({ error: "Missing articleId or targetType" });
    }

    const { MagazineCtrService } = await import("../services/magazine-ctr.service.ts");
    await MagazineCtrService.recordClick(articleId, targetType);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/magazine/migrate (Admin Only)
 * Start migration from legacy platform
 */
magazineRouter.post("/admin/migrate", async (req, res, next) => {
    // This will be implemented when we trigger the migration
    res.json({ message: "Migration engine initialized and ready for payload" });
});
