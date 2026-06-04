import { Request, Response, NextFunction } from "express";
import { MasterService } from "../services/masters.service.ts";

export const getPublicMasters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await MasterService.getPublicMasters(100);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const searchMasters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = req.body; // validated by middleware
    const { filters, lastVisibleId } = validated;

    const result = (await MasterService.searchMasters(
      filters,
      lastVisibleId,
      24,
    )) as {
      docs: Record<string, unknown>[];
      lastVisibleId: string | null;
      hasMore: boolean;
      totalHits?: number;
      warning?: string;
    };
    res.json(result);
  } catch (err) {
    next(err);
  }
};
