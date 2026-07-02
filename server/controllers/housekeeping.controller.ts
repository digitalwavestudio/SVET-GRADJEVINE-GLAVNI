import { Request, Response, NextFunction } from "express";
import { HousekeepingService } from "../services/housekeeping.service.ts";
import { env } from "../config/env.ts";


export const runCleanup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hasCronKey = env.CRON_KEY && req.headers['x-cron-key'] === env.CRON_KEY;
    const isAdmin = req.user?.isAdmin === true;
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
