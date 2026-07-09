import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.ts";

const router = Router();

router.post("/metrics", requireAuth, async (req, res) => {
  const { siteId, ...metrics } = req.body;
  res.json({ success: true, recorded: { siteId, ...metrics, timestamp: new Date().toISOString() } });
});

export { router as constructionRouter };
