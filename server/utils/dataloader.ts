import DataLoader from "dataloader";
import { db } from "../config/firebase.ts";
import { FieldPath } from "firebase-admin/firestore";
import { CacheService } from "../services/cache.service.ts";
import { CacheKeys } from "../constants/cache-keys.ts";
import { logger } from "../utils/logger.ts";

// Per-collection Firestore read tracking
const collectionReads = new Map<string, number>();
let metricsReported = false;

function trackRead(collection: string, count: number) {
  collectionReads.set(collection, (collectionReads.get(collection) || 0) + count);
  if (!metricsReported) {
    metricsReported = true;
    setInterval(() => {
      if (collectionReads.size === 0) return;
      const snapshot = Object.fromEntries(collectionReads);
      logger.info("[ReadMetrics] Firestore reads per collection (last 60s)", snapshot);
      collectionReads.clear();
    }, 60000);
  }
}

export interface UserDTO {
  id?: string;
  uid?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: string;
  [key: string]: unknown;
}

export interface ListingDTO {
  id: string;
  title: string;
  [key: string]: unknown;
}

export interface UserStatsDTO {
  id: string;
  activeAds?: number;
  pendingApplications?: number;
  totalViews?: number;
  totalSpend?: number;
  activePackage?: string;
  premiumAdsCount?: number;
  totalPremiumPurchases?: number;
  lastPaymentAmount?: number;
  lastPaymentAt?: any;
  [key: string]: unknown;
}

// Global Read-Budget Trackers (In-Memory per Node Process)
let globalReadCount = 0;
let windowStartTime = Date.now();
// Povećano sa 500 na 2000 — 500 je bilo previše restriktivno za homepage sa 10+ upita
// Konfigurabilno preko env var-a za fleksibilnost
const READ_BUDGET_LIMIT = parseInt(process.env.FIRESTORE_READ_BUDGET || "2000", 10);
const WINDOW_MS = 60000; // 1 minute window

/**
 * Enterprise Quota Sentinel
 * Returns false if the request exceeds the allowed process-level budget.
 */
function checkReadBudget(requestedCount: number): boolean {
  const now = Date.now();
  if (now - windowStartTime > WINDOW_MS) {
    globalReadCount = 0;
    windowStartTime = now;
  }
  
  if (globalReadCount + requestedCount > READ_BUDGET_LIMIT) {
    logger.error("[Dataloader] QuotaBudgetExceeded", { globalReadCount, requestedCount });
    return false;
  }
  
  globalReadCount += requestedCount;
  return true;
}

// 1. Generic Creator
export function createFirestoreLoader(collectionPath: string) {
  return new DataLoader(
    async (keys: readonly string[]) => {
      try {
        const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted").catch(() => false);
        if (isExhausted) {
          logger.warn(`[Dataloader] [Generic] Quota exhausted for ${collectionPath}, returning nulls`);
          return keys.map(() => null);
        }

        if (!checkReadBudget(keys.length)) {
            return keys.map(() => null);
        }

        const chunks = [];
        for (let i = 0; i < keys.length; i += 30) {
          chunks.push(keys.slice(i, i + 30));
        }

        const results = await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const snap = await db
                .collection(collectionPath)
                .where(FieldPath.documentId(), "in", chunk)
                .get();
              trackRead(collectionPath, chunk.length);
              return snap.docs;
            } catch (err) {
              logger.error(`[Dataloader] Generic Firestore query failed for ${collectionPath} chunk:`, err);
              return [];
            }
          }),
        );

        const mergedDocs = results.flat();
        const dic = new Map(
          mergedDocs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]),
        );

        return keys.map((key) => dic.get(key) || null);
      } catch (err) {
        logger.error(`[Dataloader] createFirestoreLoader batch function failed for ${collectionPath} keys ${keys.join(",")}:`, err);
        return keys.map(() => null);
      }
    },
    {
      batchScheduleFn: (callback) => setTimeout(callback, 100),
    },
  );
}

// 2. Specialized Loader for User Profiles (public isolated PII)
export const userProfileLoader = new DataLoader<string, UserDTO | null>(
  async (keys: readonly string[]) => {
    const fetchedUsers = new Map<string, UserDTO>();
    try {
      const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted").catch(() => false);
      if (isExhausted) {
        logger.warn(`[Dataloader] [Safe-Pass] [Profile] Quota exhausted, returning empty profiles for ${keys.length} keys`);
        return keys.map(() => null);
      }

      // 1. Try Cache first
      const cacheMap = await CacheService.getMultiple<UserDTO>(keys.map(k => `public_profile_${k}`)).catch(() => new Map());
      keys.forEach(key => {
        const cached = cacheMap.get(`public_profile_${key}`);
        if (cached) fetchedUsers.set(key, cached);
      });

      const missingKeys = keys.filter(k => !fetchedUsers.has(k));

      if (missingKeys.length > 0) {
        if (!checkReadBudget(missingKeys.length)) {
            return keys.map((key) => fetchedUsers.get(key) || null);
        }

        const chunks = [];
        for (let i = 0; i < missingKeys.length; i += 30) {
          chunks.push(missingKeys.slice(i, i + 30));
        }

        await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const snap = await db
                .collection("users")
                .where(FieldPath.documentId(), "in", chunk)
                .get();
              trackRead("users", chunk.length);
              snap.docs.forEach((doc) => {
                const rawUser = { id: doc.id, ...doc.data() } as Record<string, unknown>;
                const {
                  email: _e,
                  phoneNumber: _p,
                  pib: _pib,
                  maticniBroj: _mb,
                  address: _a,
                  savedJobs: _sj,
                  savedAds: _sa,
                  savedSearches: _ss,
                  ...publicUser
                } = rawUser;

                const profile = {
                  ...publicUser,
                  uid: rawUser.uid || doc.id,
                  id: doc.id,
                  displayName:
                    rawUser.displayName ||
                    `${rawUser.firstName || ""} ${rawUser.lastName || ""}`.trim(),
                };

                fetchedUsers.set(doc.id, profile as UserDTO);
                CacheService.set(`public_profile_${doc.id}`, profile, 60000).catch(err => console.error("[Cache] invalidation error:", err));
              });
            } catch (err) {
              logger.error(`[Dataloader] User profile Firestore query failed for chunk ${chunk.join(",")}:`, err);
            }
          }),
        );
      }
    } catch (err) {
      logger.error(`[Dataloader] userProfileLoader batch function failed for keys ${keys.join(",")}:`, err);
    }
    return keys.map((key) => fetchedUsers.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 100),
  },
);

// 2.5 Internal Full User Loader (No PII filtering)
export const internalUserLoader = new DataLoader<string, UserDTO | null>(
  async (keys: readonly string[]) => {
    const fetchedUsers = new Map<string, UserDTO>();
    try {
      const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted").catch(() => false);
      if (isExhausted) {
        logger.warn(`[Dataloader] [Safe-Pass] [Internal] Quota exhausted, returning empty users for ${keys.length} keys`);
        return keys.map(() => null);
      }

      const cacheMap = await CacheService.getMultiple<UserDTO>(keys.map(k => `user_full_${k}`)).catch(() => new Map());
      keys.forEach(key => {
        const cached = cacheMap.get(`user_full_${key}`);
        if (cached) fetchedUsers.set(key, cached);
      });

      const missingKeys = keys.filter(k => !fetchedUsers.has(k));

      if (missingKeys.length > 0) {
        if (!checkReadBudget(missingKeys.length)) {
            return keys.map((key) => fetchedUsers.get(key) || null);
        }

        const chunks = [];
        for (let i = 0; i < missingKeys.length; i += 30) {
          chunks.push(missingKeys.slice(i, i + 30));
        }

        await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const snap = await db
                .collection("users")
                .where(FieldPath.documentId(), "in", chunk)
                .get();
              trackRead("users", chunk.length);
              snap.docs.forEach((doc) => {
                const data = { id: doc.id, uid: doc.id, ...doc.data() } as UserDTO;
                fetchedUsers.set(doc.id, data);
                CacheService.set(`user_full_${doc.id}`, data, 60000).catch(err => console.error("[Cache] invalidation error:", err));
              });
            } catch (err) {
              logger.error(`[Dataloader] Internal user Firestore query failed for chunk ${chunk.join(",")}:`, err);
            }
          }),
        );
      }
    } catch (err) {
      logger.error(`[Dataloader] internalUserLoader batch function failed for keys ${keys.join(",")}:`, err);
    }
    return keys.map((key) => fetchedUsers.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 100),
  },
);

// 3. Specialized Loader for User Presence
export const userPresenceLoader = new DataLoader(
  async (keys: readonly string[]) => {
    const cacheMap = await CacheService.getMultiple<{ state?: string, lastChanged?: number } | null>(
      keys.map((key) => `presence:${key}`)
    );

    return keys.map((key) => {
      const presence = cacheMap.get(`presence:${key}`);
      if (presence && presence.state === "online") {
        return { status: "online", lastActive: presence.lastChanged };
      }
      return { status: "offline" };
    });
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 30),
  },
);

// 4. In-Memory Coalescing Loader for Listings (Ads)
export const listingsLoader = new DataLoader<string, ListingDTO | null>(
  async (keys: readonly string[]) => {
    const fetchedListings = new Map<string, ListingDTO>();
    try {
      const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted").catch(() => false);
      if (isExhausted) {
        logger.warn(`[Dataloader] [Safe-Pass] Quota exhausted, returning empty listings for ${keys.length} keys`);
        return keys.map(() => null);
      }

      const cacheMap = await CacheService.getMultiple<ListingDTO>(keys.map(k => CacheKeys.adDetail(k))).catch(() => new Map());
      keys.forEach(key => {
        const cached = cacheMap.get(CacheKeys.adDetail(key));
        if (cached) fetchedListings.set(key, cached);
      });

      const missingKeys = keys.filter(k => !fetchedListings.has(k));

      if (missingKeys.length > 0) {
        if (!checkReadBudget(missingKeys.length)) {
            return keys.map((key) => fetchedListings.get(key) || null);
        }

        const chunks = [];
        for (let i = 0; i < missingKeys.length; i += 30) {
          chunks.push(missingKeys.slice(i, i + 30));
        }

        await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const snap = await db
                .collection("listings")
                .where(FieldPath.documentId(), "in", chunk)
                .get();
              trackRead("listings", chunk.length);
              snap.docs.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() } as ListingDTO;
                fetchedListings.set(doc.id, data);
                CacheService.set(CacheKeys.adDetail(doc.id), data, 1800000).catch(err => console.error("[Cache] invalidation error:", err));
              });
            } catch (err) {
              logger.error(`[Dataloader] Firestore query failed for chunk ${chunk.join(",")}:`, err);
            }
          }),
        );
      }
    } catch (err) {
      logger.error(`[Dataloader] listingsLoader batch function failed for keys ${keys.join(",")}:`, err);
    }
    return keys.map((key) => fetchedListings.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 100),
    cache: false,
  },
);

// 5. Specialized Loader for User Stats
export const userStatsLoader = new DataLoader<string, UserStatsDTO | null>(
  async (keys: readonly string[]) => {
    const fetchedStats = new Map<string, UserStatsDTO>();
    try {
      const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted").catch(() => false);
      if (isExhausted) {
        logger.warn(`[Dataloader] [Safe-Pass] Quota exhausted, returning empty stats for ${keys.length} keys`);
        return keys.map(() => null);
      }

      const cacheMap = await CacheService.getMultiple<UserStatsDTO>(keys.map(k => `user_stats_${k}`)).catch(() => new Map());
      keys.forEach(key => {
        const cached = cacheMap.get(`user_stats_${key}`);
        if (cached) fetchedStats.set(key, cached);
      });

      const missingKeys = keys.filter(k => !fetchedStats.has(k));

      if (missingKeys.length > 0) {
        if (!checkReadBudget(missingKeys.length)) {
            return keys.map((key) => fetchedStats.get(key) || null);
        }

        const chunks = [];
        for (let i = 0; i < missingKeys.length; i += 30) {
          chunks.push(missingKeys.slice(i, i + 30));
        }

        await Promise.all(
          chunks.map(async (chunk) => {
            try {
              const snap = await db
                .collection("user_stats")
                .where(FieldPath.documentId(), "in", chunk)
                .get();
              trackRead("user_stats", chunk.length);
              snap.docs.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() } as UserStatsDTO;
                fetchedStats.set(doc.id, data);
                CacheService.set(`user_stats_${doc.id}`, data, 120000).catch(err => console.error("[Cache] invalidation error:", err));
              });
            } catch (err) {
              logger.error(`[Dataloader] User stats Firestore query failed for chunk ${chunk.join(",")}:`, err);
            }
          }),
        );
      }
    } catch (err) {
      logger.error(`[Dataloader] userStatsLoader batch function failed for keys ${keys.join(",")}:`, err);
    }
    return keys.map((key) => fetchedStats.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 100),
  },
);
