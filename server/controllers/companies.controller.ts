import { Request, Response, NextFunction } from "express";
import { UnifiedSearchService } from "../services/unified-search.service.ts";

export const searchCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { filters = {}, pageSize = 24, lastVisibleId } = req.body;

    // Zaštita od "Denial of Wallet"
    const { RateLimiterService } =
      await import("../services/rate-limiter.service.ts");
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const allowed = await RateLimiterService.isAllowed(
      `search:companies:${ipStr}`,
      10,
      1,
    );
    if (!allowed) {
      return res
        .status(429)
        .json({ error: "Previše zahteva. Sačekajte trenutak." });
    }

    const result = (await UnifiedSearchService.search(
      "companies",
      filters,
      Number(pageSize),
      lastVisibleId,
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
