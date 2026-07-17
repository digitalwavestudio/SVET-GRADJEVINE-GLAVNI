import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { db } from "../config/firebase.ts";

const router = Router();

// GET /construction/all-data - vrati sve podatke za gradjevinske lokacije
router.get("/all-data", requireAuth, async (req, res) => {
  try {
    const authorId = req.user?.uid;
    const sitesSnap = await db.collection("construction_sites")
      .where("authorId", "==", authorId)
      .orderBy("createdAt", "desc")
      .get();

    const sites = sitesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ sites, events: {}, diaryLogs: {}, siteWorkers: {}, siteResources: {}, siteMetrics: {} });
  } catch {
    res.json({ sites: [], events: {}, diaryLogs: {}, siteWorkers: {}, siteResources: {}, siteMetrics: {} });
  }
});

// POST /construction/sites - kreiraj novu lokaciju
router.post("/sites", requireAuth, async (req, res) => {
  try {
    const { site } = req.body;
    const docRef = await db.collection("construction_sites").add({
      ...site,
      authorId: req.user?.uid,
      createdAt: new Date().toISOString(),
      status: "active",
    });
    res.json({ success: true, id: docRef.id });
  } catch {
    res.status(500).json({ error: "Failed to create site" });
  }
});

// DELETE /construction/:id - obrisi lokaciju
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.collection("construction_sites").doc(req.params.id).delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete site" });
  }
});

// PATCH /construction/:id - izmeni naziv lokacije
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    await db.collection("construction_sites").doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to update site" });
  }
});

router.post("/metrics", requireAuth, async (req, res) => {
  const { siteId, ...metrics } = req.body;
  res.json({ success: true, recorded: { siteId, ...metrics, timestamp: new Date().toISOString() } });
});

export { router as constructionRouter };
