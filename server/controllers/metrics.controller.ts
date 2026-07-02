import { Request, Response, NextFunction } from "express";

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
    res.json({ success: true, processed: 0 });
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
    res.json({ stats: [] });
  } catch (err) {
    next(err);
  }
};
