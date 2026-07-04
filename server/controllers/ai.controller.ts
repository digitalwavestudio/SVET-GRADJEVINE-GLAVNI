import { Request, Response } from "express";
import { parseSearchQuery } from "../services/ai-search.service.ts";

export async function searchIntent(req: Request, res: Response) {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.json({ url: null });
  }

  const result = await parseSearchQuery(query);
  res.json(result);
}
