import { admin, db, ensureInitialized } from "../config/firebase.ts";
import type { DecodedIdToken } from "firebase-admin/auth";
import { CacheService } from "../services/cache.service.ts";
import { MonitoringService } from "../services/monitoring.service.ts";
import { AppScope, AuthorizationService } from "../services/authorization.service.ts";
import { JwksService } from "../services/jwks.service.ts";
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
    const authUser = await MonitoringService.tracePhase("auth_verification", async () => {
      let decodedToken;
      try {
        const rawDecoded = await JwksService.verifyIdTokenLocal(idToken);
        // Normalize Firebase specific claims to standard AuthUser interface
        decodedToken = {
          ...rawDecoded,
          uid: rawDecoded.uid || rawDecoded.user_id || rawDecoded.sub
        } as DecodedIdToken;
      } catch (localVerifyErr: unknown) {
        const error = localVerifyErr instanceof Error ? localVerifyErr : new Error(String(localVerifyErr));
        logger.warn(`[AUTH] Local JWKS verification failed, trying fallback to Admin SDK: ${error.message}`);
        // Fallback to official admin SDK verifyIdToken if local check fails for unexpected reasons (e.g. key refreshing latency)
        let timeoutId: NodeJS.Timeout | null = null;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Admin SDK verification timeout (3000ms limit achieved)")), 3000);
        });

        decodedToken = await Promise.race([
          admin.auth().verifyIdToken(idToken, true),
          timeoutPromise
        ]);

        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }

      // Clear login attempts on successful token verification
      const attemptsKey = `login_attempts:${ip}`;
      await CacheService.delete(attemptsKey).catch((e: any) => logger.warn("[AuthMiddleware] Cache delete login attempts:", e));

      // ADR 003: Always use Custom JWT Claims. No local caching or Redis for security logic!
      let resolvedRole = decodedToken.role as string;
      let resolvedPermissions = decodedToken.permissions as string[];
      
      if (!resolvedRole) {
        try {
          const cacheKey = `user:profile:cache:${decodedToken.uid}`;
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
              resolvedPermissions = (userData?.permissions as string[]) || AuthorizationService.getDefaultPermissions(resolvedRole);
            }
            
            // Keširamo u Redisu na 24 sata (24 * 60 * 60 * 1000 milisekundi)
            await CacheService.set(cacheKey, { role: resolvedRole, permissions: resolvedPermissions }, 24 * 60 * 60 * 1000).catch((e: any) => logger.warn("[AuthMiddleware] Cache set user profile:", e));
          }
          
          // Upisujemo Custom Claims, tako da svaki SLEDEĆI token koji klijent pošalje već nosi role & permissions
          // Time je auth provera zero-cost i nema stale state-a!
          admin.auth().setCustomUserClaims(decodedToken.uid, { 
            role: resolvedRole, 
            permissions: resolvedPermissions 
          }).catch((e) => console.error("[AUTH] setCustomUserClaims failed in background:", e));
        } catch (e) {
          resolvedRole = "standard";
          resolvedPermissions = AuthorizationService.getDefaultPermissions("standard");
        }
      }

      const authUser = {
        ...decodedToken,
        role: resolvedRole,
        isAdmin: resolvedRole === "admin" || decodedToken.admin === true,
        permissions: resolvedPermissions || [],
      } as AuthUser;

      return authUser;
    }, { ip });

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
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access only" });
  }
  next();
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store, no-cache, private");
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.user.isAdmin || req.user.permissions?.includes("*")) {
      return next();
    }
    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: `Forbidden: Requires permission ${permission}` });
    }
    next();
  };
};

export const requireScope = (scope: AppScope | string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Cache-Control", "no-store, no-cache, private");
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Admin always has all scopes
    if (req.user.isAdmin || req.user.permissions?.includes(AppScope.MASTER_ALL)) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(scope)) {
      logger.warn(`[AUTH] Access denied. User ${req.user.uid} missing scope: ${scope}`);
      return res.status(403).json({ 
        error: `Forbidden: Missing required scope: ${scope}`,
        requiredScope: scope 
      });
    }
    next();
  };
};

