import { Request, Response, NextFunction } from "express";
import { HousekeepingService } from "../services/housekeeping.service.ts";
import { sitemapWorkerService } from "../services/sitemap.worker.ts";
import { env } from "../config/env.ts";
import { AppScope, AuthorizationService } from "../services/authorization.service.ts";

export const runCleanup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Allow if valid CRON_KEY (Cloud Scheduler) OR if authenticated admin
    const hasCronKey = env.CRON_KEY && req.headers['x-cron-key'] === env.CRON_KEY;
    const isAdmin = AuthorizationService.hasScope(req.user, AppScope.SYSTEM_ADMIN);
    if (!hasCronKey && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const archiveResult = await HousekeepingService.archiveDeletedAds();
    await HousekeepingService.cleanupAuditLogs();
    const reconcileResult = await HousekeepingService.reconcileGlobalStats();
    // const algoliaResult = await HousekeepingService.cleanupAlgoliaOrphans(); // SKUP ZA FREE TIER bazu!

    res.json({
      success: true,
      message: "Housekeeping task completed",
      archive: archiveResult,
      reconcile: reconcileResult,
      algolia: { disabled: true },
    });
  } catch (error) {
    next(error);
  }
};

export const runSitemapRebuild = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Ovo može biti okinuto preko Cloud Scheduler-a svaka 4 sata.
    // Okidamo redom sve globalne sitemape da izbegnemo paralelni overload.
    const { category } = req.body;

    // Ukoliko je payload kategorija, regenerisi nju. Ako ne, regenerisi sve.
    await sitemapWorkerService.triggerRegeneration({
      trigger: "CRON_SCHEDULED_REBUILD",
      category: category,
    });

    res.json({
      success: true,
      message: "Sitemap regeneration job queued successfully",
      category: category || "ALL",
    });
  } catch (error) {
    next(error);
  }
};
