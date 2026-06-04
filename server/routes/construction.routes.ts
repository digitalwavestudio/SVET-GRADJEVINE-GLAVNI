import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { z } from "zod";

export const constructionRouter = Router();

// Zod validation schema for construction site creation/update
const constructionSiteSchema = z.object({
  site: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Naziv gradilišta je obavezan"),
    address: z.string().optional(),
    description: z.string().optional(),
  }).passthrough()
});

// Create/Update Site
constructionRouter.post("/sites", requireAuth, validateRequest(constructionSiteSchema), async (req, res, next) => {
  try {
    const uid = (req as any)?.user.uid;
    const { site } = req.body;

    if (!site.id) {
      site.createdAt = admin.firestore.FieldValue.serverTimestamp();
      site.authorId = uid;
      const docRef = await db.collection("construction_sites").add(site);
      return res.json({ id: docRef.id, success: true });
    } else {
      const id = site.id;
      delete site.id;
      await db
        .collection("construction_sites")
        .doc(id)
        .update({
          ...site,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      return res.json({ id, success: true });
    }
  } catch (error) {
    next(error);
  }
});

// Get all construction data (Sites, Events, Diaries)
constructionRouter.get("/all-data", requireAuth, async (req, res, next) => {
  try {
    const uid = (req as any)?.user.uid;
    const { activeSiteId, eventsCursor, diariesCursor } = req.query;

    let eventsQ = db.collection("events").where("authorId", "==", uid).limit(30);
    if (eventsCursor) {
      if (typeof eventsCursor === "string" && eventsCursor.match(/^\d+$/)) {
        eventsQ = eventsQ.startAfter(admin.firestore.Timestamp.fromMillis(parseInt(eventsCursor, 10)));
      } else {
        const doc = await db.collection("events").doc(eventsCursor as string).get();
        if (doc.exists) eventsQ = eventsQ.startAfter(doc);
      }
    }

    let diariesQ = db.collection("diaries").where("authorId", "==", uid).orderBy("day", "desc").limit(30);
    if (diariesCursor) {
      const doc = await db.collection("diaries").doc(diariesCursor as string).get();
      if (doc.exists) diariesQ = diariesQ.startAfter(doc);
    }

    const [sitesSnap, eventsSnap, diariesSnap] = await Promise.all([
      db
        .collection("construction_sites")
        .where("authorId", "==", uid)
        .orderBy("name", "asc")
        .limit(100)
        .get(),
      eventsQ.get(),
      diariesQ.get(),
    ]);

    const sites = sitesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const events = eventsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const diaryLogs: Record<number, string> = {};
    diariesSnap.docs.forEach((doc) => {
      const data = doc.data();
      diaryLogs[data.day] = data.content;
    });

    let siteWorkers = {};
    let siteResources = {};

    if (activeSiteId && activeSiteId !== "ALL") {
      const [workerSnap, resourceSnap] = await Promise.all([
        db
          .collection("construction_sites")
          .doc(activeSiteId as string)
          .collection("workers")
          .limit(1000)
          .get(),
        db
          .collection("construction_sites")
          .doc(activeSiteId as string)
          .collection("resources")
          .limit(1000)
          .get(),
      ]);
      siteWorkers = {
        [activeSiteId as string]: workerSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
      siteResources = {
        [activeSiteId as string]: resourceSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })),
      };
    }

    res.json({
      sites,
      events,
      diaryLogs,
      siteWorkers,
      siteResources,
    });
  } catch (error) {
    next(error);
  }
});
