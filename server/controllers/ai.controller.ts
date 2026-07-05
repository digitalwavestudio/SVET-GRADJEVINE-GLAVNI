import { Request, Response } from "express";
import { parseSearchQuery, searchAndAnswer } from "../services/ai-search.service.ts";

export async function searchIntent(req: Request, res: Response) {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.json({ url: null });
  }

  const result = await parseSearchQuery(query);
  res.json(result);
}

export async function askAi(req: Request, res: Response) {
  const { query, page, pageSize } = req.body;
  if (!query || typeof query !== "string") {
    return res.json({ answer: "", count: 0, page: 1, pageSize: 10, totalPages: 0, error: "Nema upita" });
  }

  const result = await searchAndAnswer(query, page || 1, pageSize || 10);
  res.json(result);
}
