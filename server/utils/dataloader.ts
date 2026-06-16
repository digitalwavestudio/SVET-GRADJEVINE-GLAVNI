import DataLoader from "dataloader";
import { db } from "../config/firebase.ts";
import { FieldPath } from "firebase-admin/firestore";
import { CacheService } from "../services/cache.service.ts";
import { CacheKeys } from "../constants/cache-keys.ts";

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
const READ_BUDGET_LIMIT = 500; 
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
    console.error(`[Dataloader] [CRITICAL] QuotaBudgetExceeded: Current process reached ${globalReadCount} reads. Blocking additional ${requestedCount} reads.`);
    return false;
  }
  
  globalReadCount += requestedCount;
  return true;
}

// 1. Generic Creator
export function createFirestoreLoader(collectionPath: string) {
  return new DataLoader(
    async (keys: readonly string[]) => {
      // 0. Safe-Pass through Redis: Check if Firestore quota is exhausted
      const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted");
      if (isExhausted) {
        console.warn(`[Dataloader] [Generic] Quota exhausted for ${collectionPath}, returning nulls`);
        return keys.map(() => null);
      }

      // 0.1 Local Process Budget Check
      if (!checkReadBudget(keys.length)) {
          return keys.map(() => null);
      }

      const chunks = [];
      for (let i = 0; i < keys.length; i += 30) {
        chunks.push(keys.slice(i, i + 30));
      }

      const allDocs = await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db
            .collection(collectionPath)
            .where(FieldPath.documentId(), "in", chunk)
            .get();
          return snap.docs;
        }),
      );

      const mergedDocs = allDocs.flat();
      const dic = new Map(
        mergedDocs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]),
      );

      return keys.map((key) => dic.get(key) || null);
    },
    {
      batchScheduleFn: (callback) => setTimeout(callback, 30),
    },
  );
}

// 2. Specialized Loader for User Profiles (public isolated PII)
export const userProfileLoader = new DataLoader<string, UserDTO | null>(
  async (keys: readonly string[]) => {
    // 0. Safe-Pass through Redis: Check if Firestore quota is exhausted
    const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted");
    if (isExhausted) {
      console.warn(`[Dataloader] [Safe-Pass] [Profile] Quota exhausted, returning empty profiles for ${keys.length} keys`);
      return keys.map(() => null);
    }

    const fetchedUsers = new Map<string, UserDTO>();

    // 1. Try Cache first
    const cacheMap = await CacheService.getMultiple<UserDTO>(keys.map(k => `public_profile_${k}`));
    keys.forEach(key => {
      const cached = cacheMap.get(`public_profile_${key}`);
      if (cached) fetchedUsers.set(key, cached);
    });

    const missingKeys = keys.filter(k => !fetchedUsers.has(k));

    if (missingKeys.length > 0) {
      // 0.1 Local Process Budget Check
      if (!checkReadBudget(missingKeys.length)) {
          return keys.map((key) => fetchedUsers.get(key) || null);
      }

      const chunks = [];
      for (let i = 0; i < missingKeys.length; i += 30) {
        chunks.push(missingKeys.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db
            .collection("users")
            .where(FieldPath.documentId(), "in", chunk)
            .get();
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
            // REDUCED TTL: 60 SECONDS (Short-lived aggregation to protect quotas without stale state)
            CacheService.set(`public_profile_${doc.id}`, profile, 60000).catch(err => console.error("[Cache] invalidation error:", err));
          });
        }),
      );
    }

    return keys.map((key) => fetchedUsers.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 30),
  },
);

// 2.5 Internal Full User Loader (No PII filtering)
export const internalUserLoader = new DataLoader<string, UserDTO | null>(
  async (keys: readonly string[]) => {
    // 0. Safe-Pass through Redis: Check if Firestore quota is exhausted
    const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted");
    if (isExhausted) {
      console.warn(`[Dataloader] [Safe-Pass] [Internal] Quota exhausted, returning empty users for ${keys.length} keys`);
      return keys.map(() => null);
    }

    const fetchedUsers = new Map<string, UserDTO>();

    const cacheMap = await CacheService.getMultiple<UserDTO>(keys.map(k => `user_full_${k}`));
    keys.forEach(key => {
      const cached = cacheMap.get(`user_full_${key}`);
      if (cached) fetchedUsers.set(key, cached);
    });

    const missingKeys = keys.filter(k => !fetchedUsers.has(k));

    if (missingKeys.length > 0) {
      // 0.1 Local Process Budget Check
      if (!checkReadBudget(missingKeys.length)) {
          return keys.map((key) => fetchedUsers.get(key) || null);
      }

      const chunks = [];
      for (let i = 0; i < missingKeys.length; i += 30) {
        chunks.push(missingKeys.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db
            .collection("users")
            .where(FieldPath.documentId(), "in", chunk)
            .get();
          snap.docs.forEach((doc) => {
            const data = { id: doc.id, uid: doc.id, ...doc.data() } as UserDTO;
            fetchedUsers.set(doc.id, data);
            // REDUCED TTL: 60 SECONDS
            CacheService.set(`user_full_${doc.id}`, data, 60000).catch(err => console.error("[Cache] invalidation error:", err));
          });
        }),
      );
    }

    return keys.map((key) => fetchedUsers.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 30),
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
    // 0. Safe-Pass through Redis: Check if Firestore quota is exhausted
    const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted");
    if (isExhausted) {
      console.warn(`[Dataloader] [Safe-Pass] Quota exhausted, returning empty listings for ${keys.length} keys`);
      return keys.map(() => null);
    }

    const fetchedListings = new Map<string, ListingDTO>();

    const cacheMap = await CacheService.getMultiple<ListingDTO>(keys.map(k => CacheKeys.adDetail(k)));
    keys.forEach(key => {
      const cached = cacheMap.get(CacheKeys.adDetail(key));
      if (cached) fetchedListings.set(key, cached);
    });

    const missingKeys = keys.filter(k => !fetchedListings.has(k));

    if (missingKeys.length > 0) {
      // 0.1 Local Process Budget Check
      if (!checkReadBudget(missingKeys.length)) {
          return keys.map((key) => fetchedListings.get(key) || null);
      }

      const chunks = [];
      for (let i = 0; i < missingKeys.length; i += 30) {
        chunks.push(missingKeys.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db
            .collection("listings")
            .where(FieldPath.documentId(), "in", chunk)
            .get();
          snap.docs.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as ListingDTO;
            fetchedListings.set(doc.id, data);
            // REDUCED TTL: 120 SECONDS -> INCREASED TO 30 MINUTES (1,800,000 ms) for SEO crawlers and performance
            CacheService.set(CacheKeys.adDetail(doc.id), data, 1800000).catch(err => console.error("[Cache] invalidation error:", err));
          });
        }),
      );
    }

    return keys.map((key) => fetchedListings.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 50),
  },
);

// 5. Specialized Loader for User Stats
export const userStatsLoader = new DataLoader<string, UserStatsDTO | null>(
  async (keys: readonly string[]) => {
    // 0. Safe-Pass through Redis: Check if Firestore quota is exhausted
    const isExhausted = await CacheService.get<boolean>("circuit_breaker:firestore_quota:exhausted");
    if (isExhausted) {
      console.warn(`[Dataloader] [Safe-Pass] Quota exhausted, returning empty stats for ${keys.length} keys`);
      return keys.map(() => null);
    }

    const fetchedStats = new Map<string, UserStatsDTO>();

    const cacheMap = await CacheService.getMultiple<UserStatsDTO>(keys.map(k => `user_stats_${k}`));
    keys.forEach(key => {
      const cached = cacheMap.get(`user_stats_${key}`);
      if (cached) fetchedStats.set(key, cached);
    });

    const missingKeys = keys.filter(k => !fetchedStats.has(k));

    if (missingKeys.length > 0) {
      // 0.1 Local Process Budget Check
      if (!checkReadBudget(missingKeys.length)) {
          return keys.map((key) => fetchedStats.get(key) || null);
      }

      const chunks = [];
      for (let i = 0; i < missingKeys.length; i += 30) {
        chunks.push(missingKeys.slice(i, i + 30));
      }

      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await db
            .collection("user_stats")
            .where(FieldPath.documentId(), "in", chunk)
            .get();
          snap.docs.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as UserStatsDTO;
            fetchedStats.set(doc.id, data);
            // REDUCED TTL: 120 SECONDS
            CacheService.set(`user_stats_${doc.id}`, data, 120000).catch(err => console.error("[Cache] invalidation error:", err));
          });
        }),
      );
    }

    return keys.map((key) => fetchedStats.get(key) || null);
  },
  {
    batchScheduleFn: (callback) => setTimeout(callback, 30),
  },
);
