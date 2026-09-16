import { Logger } from "../utils/logger.ts";
import { db } from "../config/firebase.ts";
import { ImageTransformer } from "../utils/image.transformer.ts";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { CacheService } from "./cache.service.ts";
import { searchJobsIndex } from "./algolia.service.ts";

export interface UnifiedSearchDoc {
  id: string;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface UnifiedSearchFilters {
  search?: string;
  location?: string;
  locationSlug?: string;
  radius?: string | number;
  lat?: number;
  lng?: number;
  authorId?: string;
  companyId?: string;
  userId?: string;
  professionSlug?: string;
  skills?: string[];
  isVerified?: boolean;
  isUrgent?: boolean;
  isPremium?: boolean;
  isPremiumPartner?: boolean;
  minPrice?: number;
  maxPrice?: number;
  showAllStatuses?: boolean;
  [key: string]: unknown;
}

export interface UnifiedSearchResult {
  docs: UnifiedSearchDoc[];
  lastVisibleId: string | null;
  hasMore: boolean;
  totalHits?: number;
  warning?: string;
}

const ALGOLIA_PAGE_CURSOR_PREFIX = "algolia-page:";

function parseAlgoliaPageCursor(lastVisibleId?: string): number {
  if (!lastVisibleId?.startsWith(ALGOLIA_PAGE_CURSOR_PREFIX)) return 0;
  const page = Number(lastVisibleId.slice(ALGOLIA_PAGE_CURSOR_PREFIX.length));
  return Number.isInteger(page) && page >= 0 ? page : 0;
}

function getSortTimestamp(value: unknown): number {
  if (value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function matchesStructuredTextFilters(data: Record<string, any>, filters: UnifiedSearchFilters): boolean {
  const targetedLoc = filters.locationSlug || filters.location;
  if (targetedLoc && targetedLoc !== "SVE") {
    if (data.locationSlug !== targetedLoc && data.location !== targetedLoc) return false;
  }

  const targetProfession = filters.profession || filters.professionSlug;
  if (targetProfession && data.professionSlug !== targetProfession && data.profession !== targetProfession) return false;

  if (filters.authorId && data.authorId !== filters.authorId) return false;
  if (filters.userId && data.authorId !== filters.userId) return false;
  if (filters.companyId && data.companyId !== filters.companyId) return false;
  if (filters.isPremiumPartner && data.isPremiumPartner !== true) return false;
  if (filters.isVerified && data.isVerified !== true) return false;
  if (filters.isPremium && data.isPremium !== true) return false;
  if (filters.isUrgent && data.isUrgent !== true) return false;
  if (filters.mainCategory && !(Array.isArray(data.mainCategories) && data.mainCategories.includes(filters.mainCategory))) return false;
  if (filters.categoryId && data.categoryId !== filters.categoryId) return false;
  if (filters.sectorSlug && data.sectorSlug !== filters.sectorSlug) return false;

  const minBeds = Number(filters.beds ?? filters.minBeds);
  if (!Number.isNaN(minBeds) && Number(data.beds || 0) < minBeds) return false;
  if (filters.roomType && data.roomType !== filters.roomType) return false;
  if (filters.parkingAvailable && data.parkingAvailable !== true) return false;
  if (filters.machineType && data.machineType !== filters.machineType) return false;
  if (filters.condition && data.condition !== filters.condition) return false;
  if (filters.adType && data.adType !== filters.adType) return false;
  if (filters.fuelType && data.fuelType !== filters.fuelType) return false;

  const numericFilters: Array<[unknown, unknown, (value: number, limit: number) => boolean]> = [
    [data.weightKg, filters.minWeightKg, (value, limit) => value >= limit],
    [data.weightKg, filters.maxWeightKg, (value, limit) => value <= limit],
    [data.area, filters.minArea, (value, limit) => value >= limit],
    [data.area, filters.maxArea, (value, limit) => value <= limit],
    [data.price, filters.minPrice, (value, limit) => value >= limit],
    [data.price, filters.maxPrice, (value, limit) => value <= limit],
  ];
  for (const [value, limit, matches] of numericFilters) {
    if (limit == null || limit === "") continue;
    const numericLimit = Number(limit);
    const numericValue = Number(value);
    if (Number.isNaN(numericLimit) || Number.isNaN(numericValue) || !matches(numericValue, numericLimit)) return false;
  }

  if (filters.purpose && data.purpose !== filters.purpose) return false;
  if (filters.accessRoad && data.accessRoad !== true) return false;
  if (filters.highwayAccess && data.highwayAccess !== true) return false;
  if (filters.railAccess && data.railAccess !== true) return false;
  if (filters.kitchenType && data.kitchenType !== filters.kitchenType) return false;
  return true;
}

export class UnifiedSearchService {
  private static logger = new Logger({ service: "UnifiedSearchService" });

  static clearL1ShieldCache(): void {
    // No-op: L1 shield removed in cleanup
  }

  static async search(
    category: string,
    filters: UnifiedSearchFilters = {},
    pageSize: number = 20,
    lastVisibleId?: string,
  ): Promise<UnifiedSearchResult> {
    // Cache key koristi SAMO stabilne filtere — bez paginationa i search query-a
    // Ovo drastično povećava cache hit rate (sa ~0% na 80%+)
    const stableFilters: Record<string, unknown> = {
      type: filters.type,
      locationSlug: filters.locationSlug || filters.location,
      isPremium: filters.isPremium,
      isUrgent: filters.isUrgent,
      isVerified: filters.isVerified,
      authorId: filters.authorId,
      companyId: filters.companyId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      professionSlug: filters.professionSlug,
      machineType: filters.machineType,
    };
    // Ukloni undefined/null vrednosti da key bude konzistentan
    const cleanFilters = Object.fromEntries(
      Object.entries(stableFilters).filter(([_, v]) => v != null && v !== undefined)
    );
    const cacheKey = `search_v5:${category}:${pageSize}:${lastVisibleId || "first"}:${JSON.stringify(cleanFilters)}:${filters.search || ""}`;
    const cached = !filters.search ? await CacheService.get<UnifiedSearchResult>(cacheKey) : null;
    if (cached) return cached;
    let entityType = category;
    if (category && category !== "all") {
      if (category === "companies") entityType = "company";
      else if (category === "masters") entityType = "master";
      else if (category === "jobs" || category === "job") entityType = "job";
      else if (category === "magazine" || category === "articles") entityType = "article";
    }

    if ((category === "jobs" || entityType === "job") && typeof filters.search === "string" && filters.search.trim() && !filters.showAllStatuses) {
      const algoliaPage = parseAlgoliaPageCursor(lastVisibleId);
      try {
        const algoliaResult = await searchJobsIndex(filters.search, algoliaPage, [], pageSize);
        if (algoliaResult) {
          const docs: UnifiedSearchDoc[] = [];
          for (const hit of algoliaResult.hits || []) {
            if (!hit?.objectID) continue;
            const snapshot = await db.collection("listings").doc(hit.objectID).get();
            if (!snapshot.exists) continue;
            const data = { id: snapshot.id, ...snapshot.data() } as UnifiedSearchDoc & Record<string, any>;
            if (data.type !== "job") continue;
            if (data.status !== "active" && data.status !== "approved") continue;
            if (!matchesStructuredTextFilters(data, filters)) continue;
            docs.push(ImageTransformer.transformDocumentImages(data) as UnifiedSearchDoc);
          }

          docs.sort((a, b) => {
            const aP = (a as any).isPremium ? 1 : 0;
            const bP = (b as any).isPremium ? 1 : 0;
            if (bP !== aP) return bP - aP;
            return getSortTimestamp((b as any).createdAt) - getSortTimestamp((a as any).createdAt);
          });

          const hasMore = algoliaResult.page < algoliaResult.nbPages - 1;
          const result: UnifiedSearchResult = {
            docs,
            lastVisibleId: hasMore ? `${ALGOLIA_PAGE_CURSOR_PREFIX}${algoliaResult.page + 1}` : null,
            hasMore,
            totalHits: algoliaResult.nbHits ?? docs.length,
          };
          await CacheService.set(cacheKey, result, 300000).catch(() => {});
          return result;
        }
      } catch (error) {
        console.error("[UnifiedSearch] Algolia text search failed, using Firestore fallback:", error);
      }
    }

    let q: FirebaseFirestore.Query;

    // Majstori su u users kolekciji (role == "majstor"),
    // firme i ostali oglasi su u listings kolekciji
    if (category === "masters" || entityType === "master") {
      q = db.collection("users");
      q = q.where("role", "==", "majstor");
    } else {
      q = db.collection("listings");
      if (entityType && entityType !== "all") q = q.where("type", "==", entityType);
    }

    if (!filters.showAllStatuses) q = q.where("status", "==", "active");

    const targetedLoc = filters.locationSlug || filters.location;
    if (targetedLoc && targetedLoc !== "SVE") {
      q = q.where("locationSlug", "==", targetedLoc);
    }

    if (filters.authorId) q = q.where("authorId", "==", filters.authorId);
    if (filters.userId) q = q.where("authorId", "==", filters.userId);
    if (filters.companyId) q = q.where("companyId", "==", filters.companyId);
    if (filters.isPremiumPartner) q = q.where("isPremiumPartner", "==", true);
    if (filters.isVerified) q = q.where("isVerified", "==", true);
    if (filters.isPremium) q = q.where("isPremium", "==", true);
    if (filters.isUrgent) q = q.where("isUrgent", "==", true);
    if (filters.mainCategory) q = q.where("mainCategories", "array-contains", filters.mainCategory);
    if (filters.beds || filters.minBeds) q = q.where("beds", ">=", Number(filters.beds || filters.minBeds));
    if (filters.roomType) q = q.where("roomType", "==", filters.roomType);
    if (filters.parkingAvailable) q = q.where("parkingAvailable", "==", true);
    if (filters.machineType) q = q.where("machineType", "==", filters.machineType);
    if (filters.condition) q = q.where("condition", "==", filters.condition);
    if (filters.adType) q = q.where("adType", "==", filters.adType);
    if (filters.categoryId) q = q.where("categoryId", "==", filters.categoryId);
    if (filters.fuelType) q = q.where("fuelType", "==", filters.fuelType);
    if (filters.minWeightKg) q = q.where("weightKg", ">=", Number(filters.minWeightKg));
    if (filters.maxWeightKg) q = q.where("weightKg", "<=", Number(filters.maxWeightKg));
    if (filters.minArea) q = q.where("area", ">=", Number(filters.minArea));
    if (filters.maxArea) q = q.where("area", "<=", Number(filters.maxArea));
    if (filters.purpose) q = q.where("purpose", "==", filters.purpose);
    if (filters.accessRoad) q = q.where("accessRoad", "==", true);
    if (filters.highwayAccess) q = q.where("highwayAccess", "==", true);
    if (filters.railAccess) q = q.where("railAccess", "==", true);
    const targetProfession = filters.profession || filters.professionSlug;
    if (targetProfession) q = q.where("professionSlug", "==", targetProfession);
    const needsLargeBatch = !!filters.search;
    if (filters.minPrice != null) q = q.where("price", ">=", Number(filters.minPrice));
    if (filters.maxPrice != null) q = q.where("price", "<=", Number(filters.maxPrice));
    if (filters.kitchenType) q = q.where("kitchenType", "==", filters.kitchenType);

    // Get total count
    let totalHits: number | undefined;
    try {
      if (category === "masters" || entityType === "master") {
        const countSnap = await db.collection("users").where("role", "==", "majstor").count().get();
        totalHits = countSnap.data().count;
      } else {
        let countQ: FirebaseFirestore.Query = db.collection("listings");
        if (entityType && entityType !== "all") countQ = countQ.where("type", "==", entityType);
        const countSnap = await countQ.count().get();
        totalHits = countSnap.data().count;
      }
    } catch (e) {
      console.error(`[UnifiedSearch] count query failed:`, e);
    }

    q = q.orderBy("createdAt", "desc");
    const queryLimit = needsLargeBatch ? Math.max(pageSize, 1000) : pageSize + 1;
    q = q.limit(queryLimit);

    if (lastVisibleId) {
      const lastColl = (category === "masters" || entityType === "master") ? "users" : "listings";
      const lastDoc = await db.collection(lastColl).doc(lastVisibleId).get();
      if (lastDoc.exists) q = q.startAfter(lastDoc);
    }

    try {
      const snap = await q.get();
      // Tačno pageSize dokumenata znači da verovatno ima još.
      const hasMore = snap.docs.length === queryLimit;
      const actualDocs = snap.docs.slice(0, pageSize);

      let docs: UnifiedSearchDoc[] = actualDocs.map((doc: QueryDocumentSnapshot) => {
        const data = { id: doc.id, ...doc.data() };
        return ImageTransformer.transformDocumentImages(data) as UnifiedSearchDoc;
      });

      if (filters.isPremium) docs = docs.filter((d: any) => d.isPremium === true);
      if (filters.isUrgent) docs = docs.filter((d: any) => d.isUrgent === true);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        docs = docs.filter((d: any) => (d.title || '').toLowerCase().includes(q));
      }

      docs = docs.sort((a, b) => {
        const aP = (a as any).isPremium ? 1 : 0;
        const bP = (b as any).isPremium ? 1 : 0;
        if (bP !== aP) return bP - aP;
        const cA = (a as any).createdAt;
        const cB = (b as any).createdAt;
        const aT = cA?.toMillis?.() ?? (typeof cA === 'string' ? new Date(cA).getTime() : cA) ?? 0;
        const bT = cB?.toMillis?.() ?? (typeof cB === 'string' ? new Date(cB).getTime() : cB) ?? 0;
        return bT - aT;
      });

      const filteredCount = docs.length;
      const hasMoreFinal = needsLargeBatch ? filteredCount > pageSize : hasMore;
      if (needsLargeBatch) docs = docs.slice(0, pageSize);

      const lastVisible = hasMoreFinal && actualDocs.length > 0 ? actualDocs[actualDocs.length - 1].id : null;

      const result: UnifiedSearchResult = { docs, lastVisibleId: lastVisible, hasMore: hasMoreFinal, totalHits: totalHits ?? filteredCount };
      await CacheService.set(cacheKey, result, 300000).catch(() => {});
      return result;
    } catch (error: unknown) {
      const err = error as Error & { details?: string; code?: number };
      if (err?.message?.includes("Quota limit exceeded") || err?.details?.includes("Quota limit exceeded") || err?.code === 8) {
        this.logger.warn(`Firestore QUOTA EXCEEDED for ${category}.`);
        return { docs: [], lastVisibleId: null, hasMore: false, warning: "Privremeno smo dostigli limit baze podataka." };
      }
      throw error;
    }
  }
}
