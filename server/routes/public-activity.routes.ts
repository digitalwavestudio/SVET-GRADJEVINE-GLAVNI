import { Router } from "express";
import { PublicActivityService } from "../services/public-activity.service.ts";
import { FollowService } from "../services/follow.service.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { getReqUser } from "../utils/request.ts";

export const publicActivityRouter = Router();

publicActivityRouter.get("/global", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const activities = await PublicActivityService.getGlobal(limit);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
});

publicActivityRouter.get("/personalized", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const uid = getReqUser(req).uid;
    const followedIds = await FollowService.getFollowingIds(uid);
    const activities = await PublicActivityService.getPersonalized(followedIds, limit);
    res.json({ activities });
  } catch (err) {
    next(err);
  }
});
