import { Router } from "express";
import { searchIntent, askAi, dashboardAssist } from "../controllers/ai.controller.ts";

const router = Router();
router.post("/search-intent", searchIntent);
router.post("/ask", askAi);
router.post("/dashboard-assist", dashboardAssist);

export default router;
