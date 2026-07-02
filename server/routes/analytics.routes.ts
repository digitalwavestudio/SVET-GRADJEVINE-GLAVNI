import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { logger } from "../utils/logger.ts";

const analyticsRouter = Router();

analyticsRouter.get("/my-trends", requireAuth, async (req, res) => {
  const userId = getReqUser(req).uid;
  if (!userId) return res.status(401).json({ error: "Niste autentifikovani" });
  const { days } = req.query;

  const breakerTimeout = setTimeout(async () => {
    if (!res.headersSent) {
      logger.warn(`[LatencyBreaker] Analytics my-trends exceeded 500ms for user: ${userId}.`);
      res.status(503).json({ error: "Request timeout", _degraded: true });
    }
  }, 500);

  res.on("finish", () => clearTimeout(breakerTimeout));
  res.on("close", () => clearTimeout(breakerTimeout));

  try {
    if (!res.headersSent) {
      res.json({ views: [], clicks: [], period: days ? parseInt(days as string) : 7 });
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

analyticsRouter.get("/ad/:adId", requireAuth, async (req, res) => {
  const { adId } = req.params;

  const breakerTimeout = setTimeout(async () => {
    if (!res.headersSent) {
      logger.warn(`[LatencyBreaker] Analytics ad exceeded 500ms for ad: ${adId}.`);
      res.status(503).json({ error: "Request timeout", _degraded: true });
    }
  }, 500);

  res.on("finish", () => clearTimeout(breakerTimeout));
  res.on("close", () => clearTimeout(breakerTimeout));

  try {
    if (!res.headersSent) {
      res.json({ views: [], trend: "flat" });
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export { analyticsRouter };
