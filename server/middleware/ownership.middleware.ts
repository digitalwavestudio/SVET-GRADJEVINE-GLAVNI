import type { Request, Response, NextFunction } from "express";
import { db } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { logger } from "../utils/logger.ts";

export const AD_OWNERSHIP_CACHE_PREFIX = "ad_ownership:";

export function invalidateAdOwnershipCache(adId: string) {
  CacheService.delete(`${AD_OWNERSHIP_CACHE_PREFIX}${adId}`).catch((e: any) => logger.warn("[Ownership] cache invalidation error:", e?.message));
}

export const validateAdOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Niste autorizovani" });
    }

    // Skip ownership check for GET requests (public)
    if (req.method === "GET") {
      return next();
    }

    const { id } = req.params;
    const adId = id || req.body?.id;

    if (!adId) {
      return res.status(400).json({ error: "Identifikator oglasa nije prosleđen" });
    }

    // Admins circumvent ownership validation checks
    if (user.isAdmin) {
      return next();
    }

    // Implement L2 Cache Shield for ownership checks (5 min) to prevent repeated FS lookups
    const ownershipCacheKey = `${AD_OWNERSHIP_CACHE_PREFIX}${adId}`;
    const cachedAuthorId = await CacheService.get<string>(ownershipCacheKey);

    if (cachedAuthorId) {
      if (cachedAuthorId === user.uid) {
        return next();
      } else {
        return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
      }
    }

    // Direktna provera vlasništva nad oglasom kroz Firestore
    let adDocAuthorId: string | undefined;
    const adDoc = await db.collection("listings").doc(adId).get();
    if (adDoc.exists) {
      adDocAuthorId = adDoc.data()?.authorId as string;
      if (adDocAuthorId) {
        await CacheService.set(ownershipCacheKey, adDocAuthorId, 300 * 1000); // 5 min TTL
      }
    }

    if (!adDoc.exists) {
      return res.status(404).json({ error: "Oglas ne postoji" });
    }

    if (adDocAuthorId !== user.uid) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateApplicationOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Niste autorizovani" });
    }

    const { id, appId: paramAppId } = req.params;
    const appId = id || paramAppId || req.body?.id || req.body?.appId;

    if (!appId) {
      return res.status(400).json({ error: "Identifikator prijave nije prosleđen" });
    }

    if (user.isAdmin) {
      return next();
    }

    // Direktna provera vlasništva nad prijavom kroz Firestore (zabranjeno keširanje ownershipa)
    let appCached = { exists: false, candidateId: undefined as string | undefined, employerId: undefined as string | undefined };
    const appDoc = await db.collection("applications").doc(appId).get();
    if (appDoc.exists) {
      const appData = appDoc.data();
      appCached = { 
        exists: true, 
        candidateId: appData?.candidateId as string,
        employerId: appData?.employerId as string
      };
    }

    if (!appCached.exists) {
      return res.status(404).json({ error: "Prijava ne postoji" });
    }

    if (
      appCached.candidateId !== user.uid &&
      appCached.employerId !== user.uid
    ) {
      return res.status(403).json({ error: "Nemate dozvolu za pristup ovim podacima" });
    }

    next();
  } catch (error) {
    next(error);
  }
};
