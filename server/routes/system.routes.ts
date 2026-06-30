import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { z } from "zod";

export const systemRouter = Router();

systemRouter.get("/bust-cache", async (_req, res) => {
  try {
    const { clearL1HomepageCache } = await import("../services/bff.service.ts");
    clearL1HomepageCache();
    const { CacheService } = await import("../services/cache.service.ts");
    await CacheService.clear().catch(() => {});
    res.json({ success: true, message: "Cache obrisan" });
  } catch (err) {
    res.status(500).json({ error: "Greška pri brisanju keša" });
  }
});

// Javni endpoint za čitanje konfiguracije (treba nam na frontendu)
systemRouter.get("/config", async (req, res) => {
  try {
    const configDoc = await db.collection("system").doc("config").get();
    if (!configDoc.exists) {
      return res.json({
        holidayModeActive: false,
        discountPercentage: 0,
        applicablePackages: []
      });
    }
    res.json(configDoc.data());
  } catch (error) {
    console.error("Fetch System Config Error:", error);
    res.status(500).json({ error: "Greška prilikom dohvatanja sistemske konfiguracije" });
  }
});

const configSchema = z.object({
  holidayModeActive: z.boolean(),
  discountPercentage: z.number().min(0).max(100),
  applicablePackages: z.array(z.string()),
});

// Admin endpoint za postavljanje konfiguracije
systemRouter.post("/config", requireAuth, async (req, res) => {
  try {
    const user = getReqUser(req);
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Nedozvoljen pristup" });
    }

    const adminId = user.uid;
    const parsed = configSchema.parse(req.body);

    await db.collection("system").doc("config").set(
      {
        ...parsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminId
      }, 
      { merge: true }
    );

    // Invalidate cached settings so changes take effect immediately
    try {
      const { CacheService } = await import("../services/cache.service.ts");
      await Promise.allSettled([
        CacheService.delete("settings_swr_global"),
        CacheService.delete("settings_swr_branding"),
      ]);
    } catch (_) { /* non-critical */ }

    res.json({ success: true, message: "Sistemska konfiguracija ažurirana" });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Nevažeći parametri", details: err.format() });
    }
    console.error("Update System Config Error:", err);
    res.status(500).json({ error: "Greška prilikom ažuriranja konfiguracije" });
  }
});
