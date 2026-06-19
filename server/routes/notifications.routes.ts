import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { notificationActionSchema } from "@svet-gradjevine/shared";
import { CacheService } from "../services/cache.service.ts";
import { logger } from "../utils/logger.ts";

export const notificationsRouter = Router();

// Polling endpoint for aggregated inbox
notificationsRouter.get("/poll", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const clientTimestamp = parseInt(req.query.since as string) || 0;

    const cacheKey = `notifications_payload_${uid}`;

    // Track user activity in active notification users list in Redis
    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    if (redis && typeof redis.sadd === "function") {
      try {
        await redis.sadd("active_notification_users", uid);
      } catch (e) {
        logger.warn("[Notifications] Failed to add active user to redis tracking:", e);
      }
    }

    // Attempt to get from in-memory/Redis aggregate
    let payloadState = await CacheService.get<{ activities: any[], unreadCount: number, lastUpdated: number } | null>(cacheKey);

    if (!payloadState) {
      try {
        // Provera Redis ključa notifications_pending_count:${uid} pre bilo kog doticaja Firestore-a
        const pendingCount = await CacheService.get<any>(`notifications_pending_count:${uid}`).catch(() => null);

        if (pendingCount === "0") {
          payloadState = {
            activities: [],
            unreadCount: 0,
            lastUpdated: Date.now(),
          };
          await CacheService.set(cacheKey, payloadState, 300000); // 5 minutes cache
        } else {
          // Aggregate from Firestore and cache in parallel
          const [snap, countSnap] = await Promise.all([
            db
              .collection("activities")
              .where("userId", "==", uid)
              .orderBy("createdAt", "desc")
              .limit(20)
              .get(),
            db
              .collection("activities")
              .where("userId", "==", uid)
              .where("read", "==", false)
              .count()
              .get(),
          ]);

          const activities = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const unreadCount = countSnap.data().count;

          payloadState = {
            activities,
            unreadCount,
            lastUpdated: Date.now(),
          };

          await CacheService.set(cacheKey, payloadState, 300000); // 5 minutes cache

          // Sinhronizujemo precalculated sate na osnovu stvarnog unreadCount-a
          const statusVal = unreadCount === 0 ? "0" : "1";
          await CacheService.set(`notifications_pending_count:${uid}`, statusVal, 30 * 60 * 1000).catch(err => console.error("[Notifications] CacheService.set failed:", err));
        }
      } catch (err: any) {
        if (
          err.code === 8 ||
          err.code === 'RESOURCE_EXHAUSTED' ||
          (err.message && err.message.includes("RESOURCE_EXHAUSTED")) ||
          (err.message && err.message.includes("Quota"))
        ) {
          logger.warn(`[QUOTA ALERT] Firestore Quota Exceeded. Returning empty default notifications for user ${uid}.`);
          payloadState = { activities: [], unreadCount: 0, lastUpdated: Date.now() };
          await CacheService.set(cacheKey, payloadState, 300000); // Cache empty for 5 mins to avoid retries
        } else {
          throw err;
        }
      }
    }

    // If client already has the latest state, return concise unmodified response
    if (clientTimestamp >= payloadState.lastUpdated) {
      return res.json({ hasUpdates: false });
    }

    // Send full payload
    res.json({
      hasUpdates: true,
      data: payloadState,
    });
  } catch (error) {
    next(error);
  }
});

// Mark single as read
notificationsRouter.get("/history", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const limitNum = Math.min(parseInt(req.query.limit as string) || 5, 20);
    const { lastVisibleId } = req.query;

    let q = db.collection("activities")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc");

    if (lastVisibleId && typeof lastVisibleId === "string" && lastVisibleId !== "null" && lastVisibleId !== "undefined") {
      const lastDoc = await db.collection("activities").doc(lastVisibleId).get();
      if (lastDoc.exists) {
        q = q.startAfter(lastDoc);
      }
    }

    q = q.limit(limitNum);
    try {
      const snap = await q.get();

      const activities = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const hasMore = snap.docs.length === limitNum;
      const nextLastVisibleId = hasMore ? snap.docs[snap.docs.length - 1].id : null;

      res.json({
        activities,
        nextLastVisibleId,
        hasMore,
      });
    } catch (err: any) {
      if (err.message && err.message.includes("RESOURCE_EXHAUSTED")) {
        logger.warn(`[QUOTA ALERT] Firestore Quota Exceeded. Returning empty history for user ${uid}.`);
        res.json({
          activities: [],
          nextLastVisibleId: null,
          hasMore: false,
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
});

// Mark single as read
notificationsRouter.post("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { id } = req.params;

    const activityRef = db.collection("activities").doc(id);
    const activitySnap = await activityRef.get();

    if (!activitySnap.exists) {
      return res.status(404).json({ error: "Aktivnost nije pronađena" });
    }

    const activityData = activitySnap.data();
    if (activityData?.userId !== uid) {
      return res.status(403).json({ error: "Zabranjen pristup / IDOR pokušaj" });
    }

    await activityRef.update({ read: true });
    await CacheService.delete(`notifications_payload_${uid}`);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
notificationsRouter.post("/read-all", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;

    const snap = await db
      .collection("activities")
      .where("userId", "==", uid)
      .where("read", "==", false)
      .limit(50)
      .get();

    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();
      await CacheService.delete(`notifications_payload_${uid}`);
    }
    await CacheService.set(`notifications_pending_count:${uid}`, "0", 30 * 60 * 1000).catch(err => console.error("[Notifications] CacheService.set failed:", err));

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Add activity/notification
notificationsRouter.post(
  "/",
  requireAuth,
  validateRequest(notificationActionSchema),
  async (req, res, next) => {
    try {
      const uid = getReqUser(req).uid;
      const { activity } = req.body;

      // Checked via schema

      const newActivity = {
        ...activity,
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("activities").add(newActivity);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);
