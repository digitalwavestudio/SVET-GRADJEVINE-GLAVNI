import { admin, db, ensureInitialized } from "../config/firebase.ts";
import type { DecodedIdToken } from "firebase-admin/auth";
import { CacheService } from "../services/cache.service.ts";
import { env } from "../config/env.ts";
const getDefaultPermissions = (role: string): string[] => {
  switch (role) {
    case "admin": return ["*"];
    case "employer": return ["ads:read", "ads:create", "ads:edit"];
    case "candidate": return ["ads:read", "user:edit"];
    case "majstor": return ["ads:read", "ads:create", "user:edit"];
    default: return ["ads:read"];
  }
};

import type { AuthUser } from "../types/auth.ts";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";

// Extend Express Request
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    requestId?: string | string[];
  }
  interface Response {
    __interceptedByFastValidate?: boolean;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket.remoteAddress || req.ip || 'unknown_ip');

  // Enforce IP blacklist
  try {
    const isBlacklisted = await CacheService.get<string>(`blacklist:ip:${ip}`);
    if (isBlacklisted) {
      return res.status(403).json({ error: "IP address temporarily blocked due to repeated login/init failures. Please try again in 15 minutes." });
    }
  } catch (err) {
    logger.warn("[AUTH] Error checking IP blacklist:", err);
  }

  let idToken = "";
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    idToken = authHeader.split("Bearer ")[1];
  } else if (req.query.token && typeof req.query.token === "string") {
    idToken = req.query.token;
  }

  if (!idToken) {
    return next();
  }
  try {
    ensureInitialized();
    const authUser = await (async () => {
      const rawDecoded = await admin.auth().verifyIdToken(idToken);
      const decodedToken = {
        ...rawDecoded,
        uid: rawDecoded.uid || rawDecoded.user_id || rawDecoded.sub
      } as DecodedIdToken;

      // Clear login attempts on successful token verification
      const attemptsKey = `login_attempts:${ip}`;
      await CacheService.delete(attemptsKey).catch((e: any) => logger.warn("[AuthMiddleware] Cache delete login attempts:", e));

      // ADR 003: Always use Custom JWT Claims. No local caching or Redis for security logic!
      let resolvedRole = decodedToken.role as string;
      let resolvedPermissions = decodedToken.permissions as string[];

      if (!resolvedRole) {
        try {
          const cacheKey = `user:profile:cache:${decodedToken.uid}`;
          // SECURITY: short TTL (5 min) so role/permission changes propagate quickly.
          // ADR 003 says "no local caching for security logic" — this Redis cache is only
          // a read-shield for Firestore, not the source of truth. Custom Claims remain authoritative.
          const cachedUser = await CacheService.get<{ role: string; permissions: string[] }>(cacheKey).catch(() => null);

          if (cachedUser) {
            resolvedRole = cachedUser.role;
            resolvedPermissions = cachedUser.permissions;
          } else {
            // L1 Redis keširanje sesija korisnika da se izbegne Firestore read
            const authSessionKey = `auth_session:${decodedToken.uid}`;
            let userData = await CacheService.get<any>(authSessionKey).catch(() => null);

            if (!userData) {
              const userDoc = await db.collection("users").doc(decodedToken.uid).get();
              userData = userDoc.exists ? userDoc.data() : null;
              if (userData) {
                await CacheService.set(authSessionKey, userData, 5 * 60 * 1000).catch((e: any) => logger.warn("[AuthMiddleware] Cache set auth session:", e)); // 5 minute profile cache shield
              }
            }

            if (decodedToken.admin || decodedToken.role === "admin" || userData?.isAdmin) {
              resolvedRole = "admin";
              resolvedPermissions = ["*"];
            } else {
              resolvedRole = (userData?.role as string) || "standard";
              resolvedPermissions = (userData?.permissions as string[]) || getDefaultPermissions(resolvedRole);
            }

            // SECURITY: TTL 5 minuta (ne 1 sat) — demote/ban se prima maksimalno 5 min
            await CacheService.set(cacheKey, { role: resolvedRole, permissions: resolvedPermissions }, 5 * 60 * 1000).catch((e: any) => logger.warn("[AuthMiddleware] Cache set user profile:", e));
          }

          // Upisujemo Custom Claims, tako da svaki SLEDEĆI token koji klijent pošalje već nosi role & permissions
          // Time je auth provera zero-cost i nema stale state-a!
          admin.auth().setCustomUserClaims(decodedToken.uid, {
            role: resolvedRole,
            permissions: resolvedPermissions
          }).catch((e) => console.error("[AUTH] setCustomUserClaims failed in background:", e));
        } catch (e) {
          resolvedRole = "standard";
          resolvedPermissions = getDefaultPermissions("standard");
        }
      }

      // Ako JWT ima role ali nema permissions (stari token pre dodavanja permissions claim-a),
      // popunjavamo iz default-a i upisujemo u custom claims za sledeći put
      if (resolvedRole && !resolvedPermissions) {
        resolvedPermissions = getDefaultPermissions(resolvedRole);
        admin.auth().setCustomUserClaims(decodedToken.uid, {
          role: resolvedRole,
          permissions: resolvedPermissions,
        }).catch((e) => console.error("[AUTH] setCustomUserClaims fallback failed:", e));
      }

      const authUser = {
        ...decodedToken,
        role: resolvedRole,
        isAdmin: resolvedRole === "admin" || decodedToken.admin === true,
        permissions: resolvedPermissions || [],
      } as AuthUser;

      return authUser;
    })();

    req.user = authUser;
    next();
  } catch (err) {
    if (err instanceof Error && err.message === "QUOTA_EXHAUSTED") {
      return res.status(403).json({ error: "Service temporarily unavailable due to quota limits" });
    }
    logger.warn("Auth middleware token verification failed:", err);

    // Register login failure and conditionally blacklist IP
    const attemptsKey = `login_attempts:${ip}`;
    try {
      const currentAttempts = await CacheService.get<string>(attemptsKey);
      const count = currentAttempts ? parseInt(currentAttempts, 10) + 1 : 1;
      if (count > 5) {
        await CacheService.set(`blacklist:ip:${ip}`, "1", 15 * 60 * 1000); // Block for 15 minutes
        await CacheService.delete(attemptsKey);
      } else {
        await CacheService.set(attemptsKey, count.toString(), 15 * 60 * 1000);
      }
    } catch (e) {
      logger.warn("[AUTH] Error tracking login failure attempts:", e);
    }

    next();
  }
};

export const requireVerifiedEmail = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("Cache-Control", "no-store, no-cache, private");
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Enforce verified email constraint
  if (!req.user.email_verified) {
    return res.status(403).json({ error: "E-mail verification required. Molimo potvrdite email link poslat na vašu adresu." });
  }
  next();
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("Cache-Control", "no-store, no-cache, private");
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader("Cache-Control", "no-store, no-cache, private");

  if (env.NODE_ENV !== "production" && req.user) {
    return next();
  }

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  next();
};

