import { Router } from "express";
import { searchIntent } from "../controllers/ai.controller.ts";

const router = Router();
router.post("/search-intent", searchIntent);

export default router;
