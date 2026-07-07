import { Request, Response, NextFunction } from "express";
import { TrendTracker } from "../services/trend-tracker.service.ts";
import { db } from "../config/firebase.ts";

export const getPrometheusMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uptime = Math.floor(process.uptime());
    res.set("Content-Type", "text/plain; version=0.0.4");
    res.send([
      "# HELP app_up Svet Gradjevine app health check",
      "# TYPE app_up gauge",
      `app_up 1`,
      "# HELP app_uptime_seconds Application uptime in seconds",
      "# TYPE app_uptime_seconds gauge",
      `app_uptime_seconds ${uptime}`,
      "# HELP app_info Static application info",
      "# TYPE app_info gauge",
      `app_info{version="1.0.0",env="${process.env.NODE_ENV || "development"}"} 1`,
    ].join("\n"));
  } catch (err) {
    next(err);
  }
};

export const bulkRecordEvents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { events } = req.body || {};
    if (!Array.isArray(events) || events.length === 0) {
      return res.json({ success: true, processed: 0 });
    }

    let processed = 0;
    const promises: Promise<void>[] = [];

    for (const event of events) {
      if (event.type === "view" && (event.authorId || event.targetId)) {
        const authorId = event.authorId;
        if (authorId) {
          promises.push(TrendTracker.recordView(authorId));
          processed++;
        }
      }
    }

    await Promise.allSettled(promises);
    res.json({ success: true, processed });
  } catch (err) {
    next(err);
  }
};

export const recordEvent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getUserAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string, 10) || 14;

    if (!userId) {
      return res.json([]);
    }

    const doc = await db
      .doc(`user_stats/${userId}/private/trends`)
      .get();

    if (!doc.exists) {
      return res.json([]);
    }

    const data = doc.data();
    if (!data?.trend || typeof data.trend !== "object") {
      return res.json([]);
    }

    const now = new Date();
    const result: Array<{
      date: string;
      views: number;
      clicks: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayData = data.trend[dateKey];
      result.push({
        date: dateKey,
        views: dayData?.pregledi || 0,
        clicks: dayData?.prijave || 0,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
