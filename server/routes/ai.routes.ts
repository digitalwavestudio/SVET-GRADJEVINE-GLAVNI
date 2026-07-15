import { Router } from "express";
import { searchIntent, askAi, dashboardAssist, chatAssist, parseAd, gradeAdScore } from "../controllers/ai.controller.ts";

const router = Router();
router.post("/search-intent", searchIntent);
router.post("/ask", askAi);
router.post("/dashboard-assist", dashboardAssist);
router.post("/chat", chatAssist);
router.post("/parse-ad", parseAd);
router.post("/grade-ad", gradeAdScore);

export default router;
