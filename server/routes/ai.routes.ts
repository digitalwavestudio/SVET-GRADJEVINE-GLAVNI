import { Router } from "express";
import { z } from "zod";
import { searchIntent, askAi, dashboardAssist, chatAssist, parseAd, gradeAdScore } from "../controllers/ai.controller.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { aiAccountLimiter, aiPublicLimiter } from "../middleware/rate-limit.middleware.ts";

const router = Router();
const aiQuerySchema = z.object({
  query: z.string().min(1).max(500),
  page: z.coerce.number().int().min(1).max(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(24).optional(),
});
const aiMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  temperature: z.number().min(0).max(1).optional(),
  context: z.unknown().optional(),
});
const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "model"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(20),
});
const parseAdSchema = z.object({
  text: z.string().min(1).max(8000),
});
const gradeAdSchema = z.object({
  adData: z.record(z.string(), z.unknown()),
});

router.post("/search-intent", aiPublicLimiter, validateRequest(aiQuerySchema), searchIntent);
router.post("/ask", aiPublicLimiter, validateRequest(aiQuerySchema), askAi);
router.post("/chat", aiPublicLimiter, validateRequest(aiChatSchema), chatAssist);
router.post("/dashboard-assist", requireAuth, aiAccountLimiter, validateRequest(aiMessageSchema), dashboardAssist);
router.post("/parse-ad", requireAuth, aiAccountLimiter, validateRequest(parseAdSchema), parseAd);
router.post("/grade-ad", requireAuth, aiAccountLimiter, validateRequest(gradeAdSchema), gradeAdScore);

export default router;
