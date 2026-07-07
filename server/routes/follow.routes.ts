import { Router } from "express";
import { FollowService } from "../services/follow.service.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { getReqUser } from "../utils/request.ts";

export const followRouter = Router();

followRouter.post("/:targetId", requireAuth, async (req, res, next) => {
  try {
    const followerId = getReqUser(req).uid;
    const { targetId } = req.params;
    const result = await FollowService.follow(followerId, targetId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

followRouter.delete("/:targetId", requireAuth, async (req, res, next) => {
  try {
    const followerId = getReqUser(req).uid;
    const { targetId } = req.params;
    const result = await FollowService.unfollow(followerId, targetId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

followRouter.get("/is-following/:targetId", async (req, res, next) => {
  try {
    let uid: string | null = null;
    try {
      const user = getReqUser(req);
      uid = user?.uid || null;
    } catch {
      // not authenticated
    }
    if (!uid) return res.json({ isFollowing: false });
    const isFollowing = await FollowService.isFollowing(uid, req.params.targetId);
    res.json({ isFollowing });
  } catch (err) {
    next(err);
  }
});

followRouter.get("/followers/:targetId", async (req, res, next) => {
  try {
    const followers = await FollowService.getFollowers(req.params.targetId);
    const count = await FollowService.getFollowerCount(req.params.targetId);
    res.json({ followers, count });
  } catch (err) {
    next(err);
  }
});

followRouter.get("/following/:userId", async (req, res, next) => {
  try {
    const following = await FollowService.getFollowing(req.params.userId);
    res.json({ following });
  } catch (err) {
    next(err);
  }
});

followRouter.get("/following-ids", requireAuth, async (req, res, next) => {
  try {
    const ids = await FollowService.getFollowingIds(getReqUser(req).uid);
    res.json({ ids });
  } catch (err) {
    next(err);
  }
});
