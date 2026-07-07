import { Request, Response, NextFunction } from "express";
import { TrendTracker } from "../services/trend-tracker.service.ts";

export const getPrometheusMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.set("Content-Type", "text/plain; version=0.0.4");
    res.send("# Metrics temporarily unavailable");
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
    res.json([]);
  } catch (err) {
    next(err);
  }
};
