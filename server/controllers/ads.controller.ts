import { Request, Response, NextFunction } from "express";
import { UnifiedSearchService } from "../services/unified-search.service.ts";
import { UnifiedAdsService } from "../services/unified-ads.service.ts";
import { db, getDb } from "../config/firebase.ts";
import { admin as firebaseAdmin } from "../config/firebase.ts";
import { ImageTransformer } from "../utils/image.transformer.ts";
import type { AuthenticatedRequest } from "../types/auth.ts";
import { logger } from "../utils/logger.ts";

export const getPublicAds = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  try {
    const category = req.params.category || "all";
    const limitCount = req.query.limit ? Math.min(Number(req.query.limit) || 10, 100) : 10;
    const cursor = req.query.cursor as string | undefined;

    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = cursor ? `public_ads_${category}_${limitCount}_${cursor}` : `public_ads_${category}_${limitCount}`;

    // Sprečava "Cache Stampede" udare kad cache istekne
    const response = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        const { UnifiedAdsService } = await import("../services/unified-ads.service.ts");
        const { publicAdsResponseSchema } = await import("../dto/ads.dto.ts");
        const res = await UnifiedAdsService.getPublicAds(category, limitCount, cursor);
        return publicAdsResponseSchema.parse(res);
      },
      1800000,
      { docs: [], lastVisibleId: null, hasMore: false } // Fallback to empty docs on quota failure
    ); // 30 min cache

    res.json(response);
  } catch (dbError) {
    console.error("[ADS] Firestore error (likely quota):", dbError);
    res.json({
      docs: [],
      lastVisibleId: null,
      hasMore: false,
      error: "Service temporarily limited",
    });
  }
};

export const getMyAds = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { limitCount = 20, cursor, searchQ } = req.query;
    const limitNum = Math.min(Number(limitCount) || 20, 50);
    // Cache key without cursor to maximize hit rate - pagination is handled server-side
    const cacheKey = `myAds_${user.uid}_${limitNum}`;
    const { CacheService } = await import("../services/cache.service.ts");

    let resultPayload: any | null;
    try {
      resultPayload = await CacheService.get(cacheKey);
    } catch {
      resultPayload = null;
    }

    if (!resultPayload) {
      try {
        const { UnifiedAdsService } = await import("../services/unified-ads.service.ts");
        const { myAdsResponseSchema } = await import("../dto/ads.dto.ts");
        const resPayload = await UnifiedAdsService.getMyAds(user.uid, limitNum);

        // Empty results handled gracefully without extra Firestore query

        const parseResult = myAdsResponseSchema.safeParse(resPayload);
        if (!parseResult.success) {
          console.error("[ADS] getMyAds Zod validation failed:", JSON.stringify(parseResult.error.issues, null, 2));
          console.error("[ADS] getMyAds raw first doc keys:", resPayload.docs?.[0] ? Object.keys(resPayload.docs[0]) : 'NO_DOCS');
          console.error("[ADS] getMyAds sample createdAt:", JSON.stringify(resPayload.docs?.[0]?.createdAt));
          console.error("[ADS] getMyAds sample lastVisibleId:", JSON.stringify(resPayload.lastVisibleId));
          // Return raw data anyway so user can see their ads
          resultPayload = resPayload;
        } else {
          resultPayload = parseResult.data;
        }
        await CacheService.set(cacheKey, resultPayload, 2 * 60 * 1000).catch((e: any) => logger.warn("[AdsController] Cache set for ads list:", e));
      } catch (quotaError: any) {
         console.error("[ADS] getMyAds error:", quotaError?.message || quotaError);
         if (quotaError?.stack) console.error("[ADS] getMyAds stack:", quotaError.stack);
         return res.status(503).json({ error: "Servis trenutno nedostupan. Molimo pokušajte kasnije.", docs: [], lastVisibleId: null, hasMore: false });
       }
    }

    res.json(resultPayload);
  } catch (dbError) {
    console.error("[ADS] getMyAds Error:", dbError);
    next(dbError);
  }
};

export const searchAds = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category, filters = {}, pageSize = 20, lastVisibleId } = req.body;
    const limit = Number(pageSize) || 20;

    // Zaštita od "Denial of Wallet"
    const { RateLimiterService } =
      await import("../services/rate-limiter.service.ts");
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const allowed = await RateLimiterService.isAllowed(
      `search:${ipStr}`,
      10,
      1,
    ); // 10 pretraga u sekundi
    if (!allowed) {
      return res
        .status(429)
        .json({ error: "Previše zahteva. Sačekajte trenutak." });
    }

    const { UnifiedSearchService } =
      await import("../services/unified-search.service.ts");
    const { CacheService } = await import("../services/cache.service.ts");

    const filtersStr = JSON.stringify(filters);
    const cacheKey = `search_ads_${category || "all"}_${filtersStr}_${limit}_${lastVisibleId || "none"}`;

    // Agresivno SWR keširanje na bazi query-parametr-hash-a
    // Povećavamo TTL na 60 minuta (3600000 ms) za anonimne pretrage
    const result = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        const { publicAdsResponseSchema } = await import("../dto/ads.dto.ts");
        const searchRes = await UnifiedSearchService.search(
          category || "all",
          filters,
          limit,
          lastVisibleId,
        );
        return publicAdsResponseSchema.parse(searchRes);
      },
      3600000, // 60 min cache
      { docs: [], lastVisibleId: null, hasMore: false }
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getAdById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const { db } = await import("../config/firebase.ts");
    const { CacheService } = await import("../services/cache.service.ts");
    const { CacheKeys } = await import("../constants/cache-keys.ts");
    const { publicAdSchema } = await import("../dto/ads.dto.ts");
    const cacheKey = CacheKeys.adDetail(id);

    const data = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        let docData: Record<string, unknown> | null = null;

        // 1. Try DataLoader first
        try {
          const { UnifiedAdsService } = await import("../services/unified-ads.service.ts");
          docData = await UnifiedAdsService.getAdById("", id) as unknown as Record<string, unknown> | null;
        } catch (e) {
          console.warn("[ADS] DataLoader failed, falling back to direct Firestore query:", e);
        }

        // 2. Fallback: direct Firestore query (bypasses DataLoader)
        if (!docData) {
          try {
            const snap = await db.collection("listings").doc(id).get();
            if (snap.exists) {
              docData = { id: snap.id, ...snap.data() } as Record<string, unknown>;
            }
          } catch (e) {
            console.warn("[ADS] Direct Firestore fallback also failed:", e);
          }
        }

        if (!docData) {
          return { error: "Oglas nije pronađen ili je obrisan", status: 410 };
        }

        if (docData.status === "deleted" || docData.status === "inactive") {
          const views = (docData.viewsCount as number) || 0;
          const hasTraffic = views >= 50;
          if (hasTraffic) {
            const parentSlug =
              docData.type === "machine"
                ? "/masine"
                : docData.type === "job"
                  ? "/poslovi"
                  : "/alat-i-oprema";
            return {
              error: "Oglas je obrisan",
              redirect: parentSlug,
              status: 410,
            };
          } else {
            return {
              error: "Oglas je obrisan, nije više dostupan",
              status: 410,
            };
          }
        }

        if (docData.authorId && typeof docData.authorId === "string") {
          const { userProfileLoader } = await import("../utils/dataloader.ts");
          const author = await userProfileLoader.load(docData.authorId as string).catch(() => null);
          if (author) {
            docData.authorSnapshot = {
              uid: author.uid || author.id,
              displayName: author.displayName || "",
              photoURL: author.avatarUrl || author.photoURL || "",
              companyName: author.companyName || "",
              verified: author.verified || false
            };
          }
        }

        try {
          return publicAdSchema.parse(docData);
        } catch (parseErr) {
          console.warn("[ADS] Schema validation failed, returning raw data:", parseErr);
          return docData;
        }
      },
      1800000,
      null
    );

    if (data && data.error && data.status) {
      res.setHeader("Cache-Control", "no-cache");
      return res.status(data.status as number).json(data);
    }

    if (data === null || data === undefined) {
      res.setHeader("Cache-Control", "no-cache");
      return res.status(503).json({ error: "Servis trenutno nedostupan" });
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=86400, stale-if-error=86400",
    );
    res.json(data);
  } catch (err) {
    console.error("[ADS] getAdById Error:", err);
    res.setHeader("Cache-Control", "no-cache");
    res.status(503).json({ error: "Servis trenutno nedostupan" });
  }
};

export const getAdsBatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }

    // Limit to 30 to prevent massive abuse and align with Firestore 'in' limits
    if (ids.length > 30) {
      return res.status(400).json({ error: "Maximum 30 ids per batch" });
    }

    const { CacheService } = await import("../services/cache.service.ts");
    const { CacheKeys } = await import("../constants/cache-keys.ts");

    // First, try to fetch all from cache using mget optimization
    const cacheMap = await CacheService.getMultiple<any & { id: string }>(ids.map(id => CacheKeys.adDetail(id)));

    const results: (any & { id: string })[] = [];
    const missingIds: string[] = [];

    ids.forEach((id) => {
      const cached = cacheMap.get(CacheKeys.adDetail(id));
      if (cached) {
        results.push(cached);
      } else {
        missingIds.push(id);
      }
    });

    if (missingIds.length > 0) {
      // Chunking inside just in case length is > 30, though we guarded it
      const snap = await db
        .collection("listings")
        .where(firebaseAdmin.firestore.FieldPath.documentId(), "in", missingIds)
        .get();

      const fetchedDocs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update cache
      fetchedDocs.forEach((doc) => {
        CacheService.set(CacheKeys.adDetail(doc.id), doc, 1800000).catch((e: any) => logger.warn("[AdsController] Cache set for ad detail:", e));
        results.push(doc);
      });
    }

    const { publicAdSchema } = await import("../dto/ads.dto.ts");

    // Return in deterministic order map
    const idMap = new Map(results.map((r) => [r.id, publicAdSchema.parse(r)]));
    const finalOrdered = ids.map((id) => idMap.get(id)).filter(Boolean);

    res.json(finalOrdered);
  } catch (err) {
    next(err);
  }
};

export const updateAd = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { UnifiedAdsService } = await import("../services/unified-ads.service.ts");
    const result = await UnifiedAdsService.updateAdById(id, updates, user);

    res.json(result);
  } catch (err) {
    next(err);
  }
};
