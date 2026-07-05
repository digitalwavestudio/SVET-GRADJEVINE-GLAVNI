import { Router } from "express";
import { searchIntent, askAi } from "../controllers/ai.controller.ts";

const router = Router();
router.post("/search-intent", searchIntent);
router.post("/ask", askAi);

export default router;
