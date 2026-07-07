import { Request, Response } from "express";
import { parseSearchQuery, searchAndAnswer, callGemini } from "../services/ai-search.service.ts";

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

export async function dashboardAssist(req: Request, res: Response) {
  const { message } = req.body;
  if (!message || typeof message !== "string") {
    return res.json({ response: "Nema upita" });
  }

  try {
    const text = await callGemini(message);
    res.json({ response: text });
  } catch (error) {
    console.error("Error in dashboardAssist:", error);
    res.status(500).json({ response: "Greška na serveru prilikom poziva AI servisa." });
  }
}
