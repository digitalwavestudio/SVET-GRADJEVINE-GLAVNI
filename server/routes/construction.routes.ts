import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { validateRequest } from "../middleware/validate.ts";
import { z } from "zod";
import {
  constructionWorkerSchema,
  constructionResourceSchema,
  constructionMetricSchema,
} from "@svet-gradjevine/shared";
import { constructionSiteUpdateSchema } from "../config/validation/construction.validation.ts";

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
    const uid = getReqUser(req).uid;
    const { site } = req.body;

    if (!site.id) {
      site.createdAt = admin.firestore.FieldValue.serverTimestamp();
      site.authorId = uid;
      const docRef = await db.collection("construction_sites").add(site);
      return res.json({ id: docRef.id, success: true });
    } else {
      const id = site.id;
      delete site.id;
      const siteRef = db.collection("construction_sites").doc(id);
      const existingDoc = await siteRef.get();
      if (!existingDoc.exists || existingDoc.data()?.authorId !== uid) {
        return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
      }
      await siteRef.update({
        ...site,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.json({ id, success: true });
    }
  } catch (error) {
    next(error);
  }
});

// Update site (name etc.)
constructionRouter.patch("/:siteId", requireAuth, validateRequest(constructionSiteUpdateSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId } = req.params;
    const updateData = req.body;

    const docRef = db.collection("construction_sites").doc(siteId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (docSnap.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await docRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: siteId, success: true });
  } catch (error) {
    next(error);
  }
});

// Soft-delete site
constructionRouter.delete("/:siteId", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId } = req.params;

    const docRef = db.collection("construction_sites").doc(siteId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (docSnap.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await docRef.update({
      status: "deleted",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: siteId, success: true });
  } catch (error) {
    next(error);
  }
});

// Get user's construction site
constructionRouter.get("/user-site", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const sitesSnap = await db.collection("construction_sites").where("authorId", "==", uid).limit(1).get();
    if (sitesSnap.docs.length === 0) {
      return res.json({ site: null });
    }
    res.json({ site: { id: sitesSnap.docs[0].id, ...sitesSnap.docs[0].data() } });
  } catch (error) {
    next(error);
  }
});

// Get all construction data (Sites, Events, Diaries)
constructionRouter.get("/all-data", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
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
    let siteMetrics = {};

    if (activeSiteId && activeSiteId !== "ALL") {
      const [workerSnap, resourceSnap, metricSnap] = await Promise.all([
        db
          .collection("construction_sites")
          .doc(activeSiteId as string)
          .collection("workers")
          .limit(100)
          .get(),
        db
          .collection("construction_sites")
          .doc(activeSiteId as string)
          .collection("resources")
          .limit(100)
          .get(),
        db
          .collection("construction_sites")
          .doc(activeSiteId as string)
          .collection("metrics")
          .orderBy("day", "asc")
          .limit(31)
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
      siteMetrics = {
        [activeSiteId as string]: metricSnap.docs.map((doc) => ({
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
      siteMetrics,
    });
  } catch (error) {
    next(error);
  }
});

// --- Workers CRUD ---

// Add worker
constructionRouter.post("/:siteId/workers", requireAuth, validateRequest(constructionWorkerSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId } = req.params;
    const data = req.body;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    const workerRef = db.collection("construction_sites").doc(siteId).collection("workers").doc();
    await workerRef.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ id: workerRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

// Update worker
constructionRouter.put("/:siteId/workers/:workerId", requireAuth, validateRequest(constructionWorkerSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId, workerId } = req.params;
    const data = req.body;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await db.collection("construction_sites").doc(siteId).collection("workers").doc(workerId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: workerId, success: true });
  } catch (error) {
    next(error);
  }
});

// Delete worker
constructionRouter.delete("/:siteId/workers/:workerId", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId, workerId } = req.params;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await db.collection("construction_sites").doc(siteId).collection("workers").doc(workerId).delete();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// --- Resources CRUD ---

// Add resource
constructionRouter.post("/:siteId/resources", requireAuth, validateRequest(constructionResourceSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId } = req.params;
    const data = req.body;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    const resRef = db.collection("construction_sites").doc(siteId).collection("resources").doc();
    await resRef.set({ ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.json({ id: resRef.id, ...data });
  } catch (error) {
    next(error);
  }
});

// Update resource
constructionRouter.put("/:siteId/resources/:resourceId", requireAuth, validateRequest(constructionResourceSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId, resourceId } = req.params;
    const data = req.body;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await db.collection("construction_sites").doc(siteId).collection("resources").doc(resourceId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ id: resourceId, success: true });
  } catch (error) {
    next(error);
  }
});

// Delete resource
constructionRouter.delete("/:siteId/resources/:resourceId", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { siteId, resourceId } = req.params;

    const siteDoc = await db.collection("construction_sites").doc(siteId).get();
    if (!siteDoc.exists) {
      return res.status(404).json({ error: "Nije pronađeno" });
    }
    if (siteDoc.data()?.authorId !== uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    await db.collection("construction_sites").doc(siteId).collection("resources").doc(resourceId).update({ status: "deleted" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// --- Metrics ---

// Save daily metrics
constructionRouter.post("/metrics", requireAuth, validateRequest(constructionMetricSchema), async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const data = req.body;

    const today = new Date();
    const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const metricsData = {
      ...data,
      day: today.getDate(),
      month: today.getMonth(),
      year: today.getFullYear(),
      dayKey,
      authorId: uid,
      recordedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Store under construction_sites if activeSiteId is known, or in a global collection
    const siteId = data.siteId;
    if (siteId) {
      const siteRef = db.collection("construction_sites").doc(siteId);
      const siteDoc = await siteRef.get();
      if (siteDoc.exists && siteDoc.data()?.authorId !== uid) {
        return res.status(403).json({ error: "Nemate dozvolu za pristup ovom gradilištu" });
      }
      const docRef = siteRef.collection("metrics").doc(dayKey);
      await docRef.set(metricsData, { merge: true });
    }

    // Also store globally for cross-site aggregation
    await db.collection("construction_metrics").doc(`${uid}_${dayKey}`).set(metricsData);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get metrics for a specific year/month
constructionRouter.get("/metrics/:year/:month", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const { year, month } = req.params;
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    const snap = await db
      .collection("construction_metrics")
      .where("authorId", "==", uid)
      .where("year", "==", yearNum)
      .where("month", "==", monthNum)
      .orderBy("day", "asc")
      .limit(31)
      .get();

    const metrics = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});
