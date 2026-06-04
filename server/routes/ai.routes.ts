import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware.ts";
import {
  parseSearchIntent,
  processDashboardCommand,
  moderateImage,
} from "../services/ai.service.ts";

export const aiRouter = Router();

// Rate limiter za AI endpointove
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 20, // max 20 requestova po minutu po IP-u (increased for batch image moderation)
  message: "Previše AI upita, pokušajte kasnije",
  standardHeaders: true,
  legacyHeaders: false,
});

aiRouter.use(aiLimiter);

// POST /api/ai/moderate-image
// Ulaz: { imageUrl: string }
// Izlaz: { isSafe: boolean, reason: string, confidence: number }
aiRouter.post("/moderate-image", async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    if (
      !imageUrl ||
      typeof imageUrl !== "string" ||
      imageUrl.trim().length === 0
    ) {
      return res.status(400).json({ error: "ImageUrl je obavezan" });
    }

    const moderationResult = await moderateImage(imageUrl);
    res.json(moderationResult);
  } catch (error) {
    console.error("AI service error:", error);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/search-intent
// Ulaz: { query: string }
// Izlaz: { intent: string, entities: string[] }
aiRouter.post("/search-intent", async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Query je obavezan" });
    }

    const parsedData = await parseSearchIntent(query);
    res.json(parsedData);
  } catch (error) {
    console.error("AI service error:", error);
    res.status(500).json({ error: "AI service error" });
  }
});

// POST /api/ai/dashboard-assist
// Ulaz: { message: string, context: any }
// Izlaz: { response: string }
// Zahteva auth
aiRouter.post("/dashboard-assist", requireAuth, async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message je obavezan" });
    }

    const responseText = await processDashboardCommand(message, context);
    res.json({ response: responseText });
  } catch (error) {
    console.error("AI service error:", error);
    res.status(500).json({ error: "AI service error" });
  }
});
