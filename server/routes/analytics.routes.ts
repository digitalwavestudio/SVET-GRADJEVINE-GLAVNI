import { Router } from "express";
import { AnalyticsService } from "../services/analytics.service.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";

const analyticsRouter = Router();

analyticsRouter.get("/my-trends", requireAuth, async (req, res) => {
  const _origJson = res.json;
  res.json = function (body: unknown) {
    if (res.headersSent) return this as unknown as import("express").Response;
    return _origJson.call(this, body);
  };
  const userId = (req as any)?.user?.uid;
  if (!userId) return res.status(401).json({ error: "Niste autentifikovani" });
  const { days } = req.query;

  const breakerTimeout = setTimeout(async () => {
    if (!res.headersSent) {
      console.warn(`[LatencyBreaker] Analytics my-trends exceeded 500ms for user: ${userId}.`);
      res.json([]);
    }
  }, 500);

  res.on("finish", () => clearTimeout(breakerTimeout));
  res.on("close", () => clearTimeout(breakerTimeout));

  try {
    const stats = await AnalyticsService.getUserTotalTrends(
      userId,
      days ? parseInt(days as string) : 7,
    );
    if (!res.headersSent) {
      res.json(stats);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

analyticsRouter.get("/ad/:adId", requireAuth, async (req, res) => {
  const _origJson = res.json;
  res.json = function (body: unknown) {
    if (res.headersSent) return this as unknown as import("express").Response;
    return _origJson.call(this, body);
  };
  const { adId } = req.params;

  const breakerTimeout = setTimeout(async () => {
    if (!res.headersSent) {
      console.warn(`[LatencyBreaker] Analytics ad exceeded 500ms for ad: ${adId}.`);
      res.json([]);
    }
  }, 500);

  res.on("finish", () => clearTimeout(breakerTimeout));
  res.on("close", () => clearTimeout(breakerTimeout));

  try {
    const stats = await AnalyticsService.getAdViewTrend(adId);
    if (!res.headersSent) {
      res.json(stats);
    }
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

export { analyticsRouter };
