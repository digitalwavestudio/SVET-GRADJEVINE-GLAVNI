import { AuditService, AuditAction } from '../services/audit.service.ts';
import { Router } from "express";
import { db, admin } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { getDefaultRole } from "../constants/roles.ts";
import { validateRequest } from "../middleware/validate.ts";
import { z } from "zod";

const completeFirstLoginSchema = z.object({
  email: z.string().email("Neispravna email adresa"),
  firstName: z.string().optional().default(""),
  lastName: z.string().optional().default(""),
  idempotencyKey: z.string().min(1, "Idempotency key is required")
});

export const authRouter = Router();

authRouter.post(
  "/logout",
  requireAuth,
  async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      
      // Revoke all Firebase refresh tokens, this instantly logs the user out everywhere
      if (uid) {
        await admin.auth().revokeRefreshTokens(uid);
      }
      
      await AuditService.log({
        action: AuditAction.AUTH_LOGOUT,
        userId: uid || "unknown",
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      res.json({ success: true, message: "Session revoked successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export interface ActiveSession {
  deviceId: string;
  userAgent: string;
  lastActive: number;
}

authRouter.post(
  "/revoke-all-sessions",
  requireAuth,
  async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Revoke Firebase refresh tokens globally across all devices
      await admin.auth().revokeRefreshTokens(uid);
      
      await AuditService.log({
        action: 'REVOKE_SESSIONS',
        userId: uid,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      res.json({ success: true, message: "All sessions revoked successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Helper to get sessions from Redis
const getSessions = async (uid: string): Promise<ActiveSession[]> => {
  const CacheService = (await import("../services/cache.service.ts")).CacheService;
  const sessionsRaw = await CacheService.get<string>(`active_sessions:${uid}`);
  return sessionsRaw ? JSON.parse(sessionsRaw) as ActiveSession[] : [];
};

authRouter.post('/devices/track', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const deviceIdRaw = req.headers['x-device-id'] || 'unknown_device';
    const deviceId = Array.isArray(deviceIdRaw) ? deviceIdRaw[0] : deviceIdRaw;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    
    const CacheService = (await import("../services/cache.service.ts")).CacheService;
    const sessions = await getSessions(uid);
    
    const now = Date.now();
    // Update or add the session
    const existingIndex = sessions.findIndex((s: ActiveSession) => s.deviceId === deviceId);
    if (existingIndex > -1) {
       sessions[existingIndex].lastActive = now;
       sessions[existingIndex].userAgent = userAgent;
    } else {
       sessions.push({ deviceId, userAgent, lastActive: now });
    }
    
    // Store back in Redis, expire in 7 days
    await CacheService.set(`active_sessions:${uid}`, JSON.stringify(sessions), 7 * 24 * 60 * 60);
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/devices', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const sessions = await getSessions(uid);
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/devices/revoke-others', requireAuth, async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const currentDeviceId = req.headers['x-device-id'];
    
    const CacheService = (await import("../services/cache.service.ts")).CacheService;
    let sessions = await getSessions(uid);
    
    if (currentDeviceId) {
       const deviceIdStr = Array.isArray(currentDeviceId) ? currentDeviceId[0] : currentDeviceId;
       sessions = sessions.filter((s: ActiveSession) => s.deviceId === deviceIdStr);
       await CacheService.set(`active_sessions:${uid}`, JSON.stringify(sessions), 7 * 24 * 60 * 60);
    }
    
    // Put other device IDs into a deny-list!
    // Since Firebase doesn't have device-ids in JWT, we rely on the specific frontend sending x-device-id.
    // If we want a hard Firebase revoke, we can revoke ALL refresh tokens,
    // which will log everyone out when their ID tokens expire in 1 hour.
    await admin.auth().revokeRefreshTokens(uid);
    
    res.json({ success: true, message: "Svi ostali uređaji su specifično izlogovani.", activeSessions: sessions });
  } catch (err) {
    next(err);
  }
});

// Endpoint for atomic user provisioning
authRouter.post(
  "/complete-first-login",
  requireAuth,
  validateRequest(completeFirstLoginSchema),
  async (req, res, next) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { email, firstName, lastName, idempotencyKey } = req.body;

      const responsePayload = await db.runTransaction(async (transaction) => {
        const idempotencyRef = db
          .collection("idempotency_logs")
          .doc(idempotencyKey);
        const idempotencySnap = await transaction.get(idempotencyRef);

        // Idempotency: Ako je ključ već obrađen, vratimo sačuvani odgovor
        if (idempotencySnap.exists) {
          return (idempotencySnap.data()?.response || { success: true }) as Record<string, unknown>;
        }

        const userRef = db.collection("users").doc(uid);
        const userSnap = await transaction.get(userRef);

        // Idempotency: If user already exists, don't overwrite
        if (userSnap.exists) {
          const resData = { success: true, message: "User already exists" };
          transaction.set(idempotencyRef, {
            idempotencyKey,
            uid,
            status: "PROCESSED",
            response: resData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return resData;
        }

        const defaultRole = getDefaultRole();

        // Create user atomically
        transaction.set(userRef, {
          email,
          firstName: firstName || "",
          lastName: lastName || "",
          role: defaultRole.name,
          isVerified: false,
          walletBalance: 1500, // TODO: Read from system settings/config doc instead of hardcoding
          permissions: defaultRole.permissions,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const successResponse = {
          success: true,
          message: "User provisioned successfully",
        };
        transaction.set(idempotencyRef, {
          idempotencyKey,
          uid,
          status: "PROCESSED",
          response: successResponse,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return successResponse;
      });

      res.json(responsePayload);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Atomic User Provisioning Error:", errorMsg);
      res.status(500).json({ error: "Failed to provision user" });
    }
  },
);
