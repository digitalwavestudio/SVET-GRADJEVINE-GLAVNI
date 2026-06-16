import express from "express";
import {
  forceSync,
  updateProfile,
  migrateProfile,
  getPublicProfile,
  switchRole,
  registerFcmToken,
} from "../controllers/users.controller.ts";
import { logDestructiveAction } from "../utils/destructive-audit.ts";
import { AdminSettingsService } from "../services/admin/admin-settings.service.ts";
import { validateRequest, validateBody } from "../middleware/validate.ts";
import {
  userProfileSchema,
  presenceSchema,
  updatePackageSchema,
  adminActionSchema,
  migrateProfileSchema,
  userProfileAdminUpdateSchema,
} from "@svet-gradjevine/shared";
import { authLimiter } from "../middleware/rate-limit.middleware.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { idempotency } from "../middlewares/idempotency.ts";
import { UsersService } from "../services/users.service.ts";
import { admin } from "../config/firebase.ts";
import { AuditService, AuditAction } from "../services/audit.service.ts";
import { UnifiedAdsService } from "../services/unified-ads.service.ts";
import { userPresenceLoader } from "../utils/dataloader.ts";
import { z } from "zod";

export const usersRouter = express.Router();

const initUserSchema = userProfileAdminUpdateSchema
  .extend({
    role: z.string().optional(),
  })
  .passthrough();

usersRouter.post(
  "/init",
  requireAuth,
  authLimiter,
  idempotency({ ttl: 5 }),
  validateRequest(initUserSchema),
  async (req, res, next) => {
    try {
      if (req.body._honeypot && req.body._honeypot.length > 0) {
        return res.status(403).json({ error: 'Suspected bot activity. Registration blocked.' });
      }

      // 1. reCAPTCHA v3 Pre-flight Verification Check
      const recaptchaToken = req.body.recaptchaToken || req.headers['x-recaptcha-token'];
      if (process.env.RECAPTCHA_SECRET_KEY) {
        if (!recaptchaToken) {
          return res.status(400).json({ error: "Missing reCAPTCHA token." });
        }
        try {
          const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
          const rcRes = await fetch(verifyUrl, { method: "POST" });
          const rcData = await rcRes.json() as { success: boolean; score: number };
          if (!rcData.success || rcData.score < 0.5) {
            return res.status(403).json({ error: "reCAPTCHA verification failed. Suspected bot activity." });
          }
        } catch (err) {
          console.error("[AUTH] reCAPTCHA verify request failed:", err);
          if (process.env.NODE_ENV === "production") {
            return res.status(500).json({ error: "Internal reCAPTCHA verification service error." });
          }
        }
      } else {
        console.warn("[AUTH] RECAPTCHA_SECRET_KEY not set. Local development bypass enabled.");
      }

      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { role } = req.body;

      // Inicijalizujemo usera sa tokenData za brzu validaciju claimsa
      const result = await UsersService.initUser(uid, req.body, req.user);
      if (result.isNew) {
        await UnifiedAdsService.initUserStats(uid, result.role);
      }

      // 2. Multi-Device Session Control & Automatic Token Eviction (via Redis active_sessions)
      const userAgent = req.headers['user-agent'] || 'unknown_agent';
      const forwarded = req.headers['x-forwarded-for'];
      const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket.remoteAddress || req.ip || 'unknown_ip');
      const crypto = await import("crypto");
      const deviceId = crypto.createHash('md5').update(`${userAgent}_${ip}`).digest('hex');

      const CacheService = (await import("../services/cache.service.ts")).CacheService;
      interface ActiveSession {
        deviceId: string;
        userAgent: string;
        lastActive: number;
      }
      let sessions: ActiveSession[] = [];
      const sessionsRaw = await CacheService.get<string>(`active_sessions:${uid}`);
      if (sessionsRaw) {
        try {
          sessions = JSON.parse(sessionsRaw) as ActiveSession[];
        } catch {
          sessions = [];
        }
      }

      // Sort and update session list
      sessions = sessions.filter((s) => s && s.deviceId);
      const existingSessionIdx = sessions.findIndex((s) => s.deviceId === deviceId);
      const now = Date.now();

      if (existingSessionIdx > -1) {
        sessions[existingSessionIdx].lastActive = now;
      } else {
        sessions.push({ deviceId, userAgent, lastActive: now });
      }

      sessions.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));

      // Rule limits: role=standard max 1, role=poslodavac/others max 3
      const userRole = result.role || "standard";
      const sessionLimit = userRole === "standard" ? 1 : 3;

      if (sessions.length > sessionLimit) {
        sessions = sessions.slice(0, sessionLimit);
        // Automatically evict older active token sets by revoking all refresh tokens for this user
        await admin.auth().revokeRefreshTokens(uid).catch(err => console.error("[Users] revokeRefreshTokens failed:", err));
      }

      await CacheService.set(`active_sessions:${uid}`, JSON.stringify(sessions), 7 * 24 * 60 * 60);

      // Log authentication audit trial
      await AuditService.log({
        action: result.isNew ? AuditAction.AUTH_REGISTER : AuditAction.AUTH_LOGIN,
        userId: uid,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { role: result.role, inputRole: role }
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

usersRouter.post("/switch-role", requireAuth, idempotency({ ttl: 5 }), switchRole);
usersRouter.post("/deactivate", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await UsersService.updateProfile(uid, { status: "deleted" }, true);
    const CacheService = (await import("../services/cache.service.ts")).CacheService;
    await CacheService.delete(`auth:claims:${uid}`);
    logDestructiveAction(req, uid, "PROFILE_DEACTIVATION", { type: "user_self_deactivation" });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
usersRouter.post("/force-sync", requireAuth, idempotency({ ttl: 10 }), forceSync);
usersRouter.put("/profile", requireAuth, idempotency({ ttl: 5 }), validateBody(userProfileSchema), updateProfile);
usersRouter.post(
  "/profile",
  requireAuth,
  idempotency({ ttl: 5 }),
  validateRequest(migrateProfileSchema),
  migrateProfile,
);

usersRouter.get("/search-partner", async (req, res, next) => {
  try {
    const { code, slug } = req.query;
    const partner = await UsersService.searchPartner({
      code: code as string,
      slug: slug as string,
    });
    if (!partner) return res.status(404).json({ error: "Partner not found" });
    res.json(partner);
  } catch (error) {
    next(error);
  }
});

// Presence update
usersRouter.post(
  "/presence",
  requireAuth,
  validateRequest(presenceSchema),
  async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { status } = req.body;
      await UsersService.updatePresence(uid, status);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

const presenceBatchSchema = z.object({
  userIds: z.array(z.string()).min(1, "Morate poslati najmanje jedan korisnički ID"),
});

usersRouter.post("/presence/batch", validateRequest(presenceBatchSchema), async (req, res, next) => {
  try {
    const { userIds } = req.body;

    // Batch DataLoader resolution to eliminate N+1
    const results: Record<string, unknown> = {};
    if (userIds.length > 0) {
      const presences = await userPresenceLoader.loadMany(userIds);
      userIds.forEach((uid: string, index: number) => {
        const presence = presences[index];
        results[uid] =
          presence instanceof Error ? { status: "offline" } : (presence || { status: "offline" });
      });
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/:id/presence", async (req, res, next) => {
  try {
    const { id } = req.params;
    const presence = await UsersService.getPresence(id);
    res.json(presence);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userDoc = await UsersService.getUserById(uid, req.user, true);
    res.json(userDoc);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me/events", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const events = await UsersService.getAvailabilityEvents(uid);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Package update
usersRouter.post(
  "/packages",
  requireAuth,
  validateRequest(updatePackageSchema),
  async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { packageId, duration } = req.body;
      // Check if user is admin or updating themselves
      const result = await UsersService.updatePackage(uid, packageId, duration);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// ─── Premium Package Activation ───────────────────────────────────────────────
async function getPremiumPrice(): Promise<number> {
  try {
    const settings = await AdminSettingsService.getSettings("global");
    return (settings as any)?.pricing?.professional_monthly ?? 6000;
  } catch {
    return 6000;
  }
}

usersRouter.post("/activate-premium", requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const premiumPrice = await getPremiumPrice();
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ error: "Korisnik nije pronađen." });
    }

    const userData = userSnap.data()!;
    const currentBalance: number = userData.walletBalance || 0;

    // Check if already premium
    if (userData.isPremium === true) {
      return res.status(400).json({ error: "Premium paket je već aktivan na vašem nalogu." });
    }

    // Check balance
    if (currentBalance < premiumPrice) {
      return res.status(400).json({
        error: `Nemate dovoljno kredita. Potrebno: ${premiumPrice} SGK, dostupno: ${currentBalance} SGK.`,
      });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    // Deduct from wallet
    batch.update(userRef, {
      walletBalance: admin.firestore.FieldValue.increment(-premiumPrice),
      isPremium: true,
      premiumBadge: "gold",
      premiumActivatedAt: now,
    });

    // Create transaction record
    const txRef = db.collection("transactions").doc();
    batch.set(txRef, {
      userId: uid,
      type: "PREMIUM_AKTIVACIJA",
      description: "Aktivacija Premium paketa – Zlatni bedž",
      amount: -premiumPrice,
      status: "completed",
      createdAt: now,
    });

    await batch.commit();

    // Invalidate auth cache so updated claims are picked up
    try {
      const { CacheService } = await import("../services/cache.service.ts");
      await CacheService.delete(`auth:claims:${uid}`);
    } catch (_) { /* non-critical */ }

    return res.json({
      success: true,
      message: "Premium paket je uspešno aktiviran. Zlatni bedž je dodat na vaš profil!",
      newBalance: currentBalance - premiumPrice,
    });
  } catch (error) {
    next(error);
  }
});

usersRouter.post(
  "/:id/admin-action",
  requireAuth,
  validateRequest(adminActionSchema),
  async (req, res, next) => {
    try {
      const userObj = req.user as { isAdmin?: boolean } | undefined;
      const isAdmin = userObj?.isAdmin;
      if (!isAdmin) return res.status(403).json({ error: "Forbidden" });

      const { action } = req.body;
      const uid = req.params.id;

      const updates: Record<string, unknown> = {};
      if (action === "approve") updates.status = "active";
      if (action === "premium") {
        const userDoc = await UsersService.getUserById(uid);
        if (userDoc) updates.isPremiumProfile = !userDoc.isPremiumProfile;
      }
      if (action === "delete") updates.status = "deleted";

      if (Object.keys(updates).length > 0) {
        await UsersService.updateProfile(uid, updates, true);
        
        // Clear auth cache if role or status is being impacted (esp. for bans)
        if (action === "delete" || updates.role) {
           const CacheService = (await import("../services/cache.service.ts")).CacheService;
           await CacheService.delete(`auth:claims:${uid}`);
        }
        
        // Log profile deactivation / deletion as a destructive audit trace
        if (action === "delete") {
          logDestructiveAction(req, uid, "PROFILE_DEACTIVATION", { type: "profile_status_deleted" });
        }
      }

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

usersRouter.get("/:id/public", getPublicProfile);
usersRouter.post("/fcm-token", requireAuth, registerFcmToken);
