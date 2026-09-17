import { Request, Response } from "express";
import { parseSearchQuery, searchAndAnswer, callGemini, chatWithGemini, parseAdIntent, gradeAd } from "../services/ai-search.service.ts";
import { CacheService } from "../services/cache.service.ts";

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

  const safePage = page || 1;
  const safePageSize = pageSize || 10;
  const cacheKey = `ai_ask_v1_${query.trim().toLowerCase()}_${safePage}_${safePageSize}`;
  const cached = await CacheService.get<Awaited<ReturnType<typeof searchAndAnswer>>>(cacheKey).catch(() => null);
  if (cached) {
    return res.json(cached);
  }

  const result = await searchAndAnswer(query, safePage, safePageSize);
  await CacheService.set(cacheKey, result, 300000).catch(() => {});
  res.json(result);
}

export async function dashboardAssist(req: Request, res: Response) {
  const { message, temperature } = req.body;
  if (!message || typeof message !== "string") {
    return res.json({ response: "Nema upita" });
  }

  const safeTemperature = typeof temperature === "number" && Number.isFinite(temperature)
    ? Math.min(Math.max(temperature, 0), 1)
    : 0.1;

  try {
    const text = await callGemini(message, safeTemperature);
    res.json({ response: text });
  } catch (error) {
    console.error("Error in dashboardAssist:", error);
    res.status(500).json({ response: "Greška na serveru prilikom poziva AI servisa." });
  }
}

export async function chatAssist(req: Request, res: Response) {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.json({ response: "Nema poruka" });
  }

  try {
    const text = await chatWithGemini(messages);
    res.json({ response: text });
  } catch (error) {
    console.error("Error in chatAssist:", error);
    res.status(500).json({ response: "Greška na serveru prilikom poziva AI servisa." });
  }
}

export async function parseAd(req: Request, res: Response) {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const result = await parseAdIntent(text);
    res.json(result);
  } catch (error) {
    console.error("Error in parseAd:", error);
    res.status(500).json({ error: "Server error" });
  }
}

export async function gradeAdScore(req: Request, res: Response) {
  const { adData } = req.body;
  if (!adData || typeof adData !== "object") {
    return res.status(400).json({ error: "No ad data provided" });
  }

  try {
    const result = await gradeAd(adData);
    res.json(result);
  } catch (error) {
    console.error("Error in gradeAdScore:", error);
    res.status(500).json({ error: "Server error" });
  }
}
