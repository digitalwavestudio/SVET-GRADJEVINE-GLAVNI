import { Request as ExpressRequest, Response, NextFunction } from "express";
import { env } from "../config/env.ts";
import { bffService } from "../services/bff.service.ts";

export const getHomepageBff = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
) => {
  if (env.NODE_ENV === "production") {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  } else {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }
  res.setHeader("X-Cache-Tier", "Tier-2-Public-SWR");
  try {
    const platform = (req.headers["x-client-platform"] as string) || "web";
    const result = await bffService.getHomepageData(platform);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDashboardMetrics = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "private, max-age=60, stale-while-revalidate=120",
  );
  res.setHeader("X-Cache-Tier", "Tier-1.5-SWR-Granular");

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.uid;

  try {
    const metrics = await bffService.getDashboardMetrics(userId);
    return res.json({
      success: true,
      data: metrics
    });
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === "QUOTA_EXHAUSTED_NO_STALE_CACHE") {
      return res.status(203).json({
        success: true,
        data: {
          myAdsCount: 0,
          unreadMessagesCount: 0,
          unreadActivitiesCount: 0,
          walletBalance: 0,
          walletVerified: false,
          serverTime: new Date().toISOString(),
          _circuit: "OPEN"
        }
      });
    }
    next(err);
  }
};

export const getDashboardBff = async (
  req: ExpressRequest,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "private, max-age=300, stale-while-revalidate=600",
  );
  res.setHeader("X-Cache-Tier", "Tier-2-SWR-Granular");

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.uid;
  const role = req.user.role;
  const isAdmin = !!req.user.isAdmin;
  const cacheControlHeader = req.headers["cache-control"] as string | undefined;

  try {
    const result = await bffService.getDashboardData(
      userId,
      role,
      isAdmin,
      req.user!,
      cacheControlHeader
    );

    if (result && typeof result === "object" && "_sandbox" in result && result._sandbox) {
      return res.status(203).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message === "QUOTA_EXHAUSTED_NO_STALE_CACHE") {
      return res.status(203).json({
        success: true,
        _degraded: true,
        stats: {
          activeAds: 0,
          pendingAds: 0,
          totalViews: 0,
          applicationsCount: 0,
          recentAds: [],
          recentApplications: [],
          totalAdsCount: 0,
          totalUsers: 0
        },
        recentActivities: [],
        myAds: [],
        trends: []
      });
    }
    next(err);
  }
};
