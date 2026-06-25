import { db, checkQuotaStatus } from "../../config/firebase.ts";
import { resolveGeoFallback } from "../../utils/geocode.ts";
import { ImageTransformer } from "../../utils/image.transformer.ts";
import { UnifiedSearchUtils } from "./unified-search-utils.service.ts";
import { CacheService } from "../cache.service.ts";
import { Logger } from "../../utils/logger.ts";
import * as admin from "firebase-admin";
import { FieldPath, Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import crypto from "crypto";
import { 
  UnifiedSearchResult, 
  UnifiedSearchFilters,
  UnifiedSearchDoc 
} from "../unified-search.service.ts";

export class UnifiedSearchFirestore {
  private static readonly SEARCH_FIELDS = [
    "title", "name", "description", "price", "location", "loc",
    "type", "status", "createdAt", "images",
    "isPremium", "isUrgent", "isPremiumPartner", "isVerified",
    "comp", "salary", "sal", "logo",
    "benefits", "plataMin", "plataMax", "salaryType",
    "smestaj", "prevoz", "hrana",
    "housing", "transport", "food", "topliObrok", "benefiti", "rawBenefits",
    "adTitle", "adType", "categoryId", "categorySlug",
    "companyName", "companyLogo",
    "locationSlug", "authorId", "authorSnapshot",
    "machineType", "condition", "fuelType",
    "weightKg", "weightLb", "year", "workingHours", "make", "model",
    "isNegotiable", "pricePerDay", "pricePerHour",
    "pricePerWeek", "pricePerMonth", "isServiced",
    "accommodationType", "beds", "roomType", "parkingAvailable", "typeSlug",
    "area", "purpose", "accessRoad", "highwayAccess", "railAccess",
    "cateringType", "kitchenType", "invoiceAvailable",
    "minOrder", "dailyCapacityMeals",
    "jobType", "profession", "professionSlug",
    "currency", "city",
    "mainCategories",
  ];

  private static applyCommonSortAndSelect(q: FirebaseFirestore.Query): FirebaseFirestore.Query {
    return q
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .select(...this.SEARCH_FIELDS);
  }

  private static sortWithPremium(docs: UnifiedSearchDoc[]): UnifiedSearchDoc[] {
    return docs.sort((a, b) => {
      const aP = (a as any).isPremium ? 1 : 0;
      const bP = (b as any).isPremium ? 1 : 0;
      if (bP !== aP) return bP - aP;
      const aT = (a as any).createdAt?.toMillis?.() || (a as any).createdAt || 0;
      const bT = (b as any).createdAt?.toMillis?.() || (b as any).createdAt || 0;
      return bT - aT;
    });
  }

  private static buildBaseQuery(
    category: string,
    entityType: string,
    filtersAny: UnifiedSearchFilters
  ): FirebaseFirestore.Query {
    let q: FirebaseFirestore.Query;
    const isProfileSearch =
      category === "masters" ||
      category === "companies" ||
      entityType === "master" ||
      entityType === "company";

    if (isProfileSearch) {
      q = db.collection("users");
      const targetRole =
        category === "masters" || entityType === "master"
          ? "majstor"
          : "company";
      q = q.where("role", "==", targetRole);
    } else if (
      [
        "listings",
        "jobs",
        "job",
        "machines",
        "accommodations",
        "caterings",
        "plots",
        "marketplace",
        "realEstate",
      ].includes(category) ||
      entityType !== category
    ) {
      q = db.collectionGroup("listings");
      if (entityType && entityType !== "all")
        q = q.where("type", "==", entityType);
    } else {
      q = db.collection(category);
    }

    if (!filtersAny.showAllStatuses) q = q.where("status", "in", ["active", "approved"]);

    const targetedLoc = filtersAny.locationSlug || filtersAny.location;
    if (targetedLoc && targetedLoc !== "SVE") {
      const resGeo = resolveGeoFallback(targetedLoc as string);
      if (resGeo && resGeo.district && resGeo.district !== "srbija" && resGeo.district !== targetedLoc) {
        const locOptions = Array.from(new Set([targetedLoc, resGeo.district]));
        q = q.where("locationSlug", "in", locOptions);
      } else {
        q = q.where("locationSlug", "==", targetedLoc);
      }
    }
    if (filtersAny.authorId) q = q.where("authorId", "==", filtersAny.authorId);
    if (filtersAny.userId) q = q.where("authorId", "==", filtersAny.userId);
    if (filtersAny.companyId)
      q = q.where("companyId", "==", filtersAny.companyId);

    if (filtersAny.isPremiumPartner)
      q = q.where("isPremiumPartner", "==", true);
    if (filtersAny.isVerified) q = q.where("isVerified", "==", true);
    // isUrgent and isPremium filtered in-memory after query (no composite index for orderBy)

    if (filtersAny.mainCategory)
      q = q.where("mainCategories", "array-contains", filtersAny.mainCategory);
    if (filtersAny.employeeCount)
      q = q.where("employeeCount", "==", filtersAny.employeeCount);

    if (filtersAny.type && entityType === "accommodation")
      q = q.where("typeSlug", "==", filtersAny.type);
    if (filtersAny.accommodationType)
      q = q.where("accommodationType", "==", filtersAny.accommodationType);
    if (filtersAny.beds || filtersAny.minBeds)
      q = q.where("beds", ">=", Number(filtersAny.beds || filtersAny.minBeds));
    if (filtersAny.roomType) q = q.where("roomType", "==", filtersAny.roomType);
    if (filtersAny.parkingAvailable)
      q = q.where("parkingAvailable", "==", true);

    if (filtersAny.machineType)
      q = q.where("machineType", "==", filtersAny.machineType);
    if (filtersAny.condition)
      q = q.where("condition", "==", filtersAny.condition);
    if (filtersAny.adType) q = q.where("adType", "==", filtersAny.adType);
    if (filtersAny.categoryId)
      q = q.where("categoryId", "==", filtersAny.categoryId);
    if (filtersAny.fuelType) q = q.where("fuelType", "==", filtersAny.fuelType);
    if (filtersAny.minWeightKg)
      q = q.where("weightKg", ">=", Number(filtersAny.minWeightKg));
    if (filtersAny.maxWeightKg)
      q = q.where("weightKg", "<=", Number(filtersAny.maxWeightKg));

    if (filtersAny.minArea) q = q.where("area", ">=", Number(filtersAny.minArea));
    if (filtersAny.maxArea) q = q.where("area", "<=", Number(filtersAny.maxArea));
    if (filtersAny.purpose) q = q.where("purpose", "==", filtersAny.purpose);
    if (filtersAny.accessRoad) q = q.where("accessRoad", "==", true);
    if (filtersAny.highwayAccess) q = q.where("highwayAccess", "==", true);
    if (filtersAny.railAccess) q = q.where("railAccess", "==", true);

    if (filtersAny.profession)
      q = q.where("professionSlug", "==", filtersAny.profession);

    if (filtersAny.minPrice != null)
      q = q.where("price", ">=", Number(filtersAny.minPrice));
    if (filtersAny.maxPrice != null)
      q = q.where("price", "<=", Number(filtersAny.maxPrice));

    if (filtersAny.cateringType)
      q = q.where("cateringType", "==", filtersAny.cateringType);
    if (filtersAny.kitchenType)
      q = q.where("kitchenType", "==", filtersAny.kitchenType);
    if (filtersAny.invoiceAvailable)
      q = q.where("invoiceAvailable", "==", true);
    if (filtersAny.minOrder)
      q = q.where("minOrder", "<=", Number(filtersAny.minOrder));
    if (filtersAny.dailyCapacity)
      q = q.where(
        "dailyCapacityMeals",
        ">=",
        Number(filtersAny.dailyCapacity),
      );
      
    return q;
  }

  static async executeFirestoreSearch(
    category: string,
    entityType: string,
    filters: UnifiedSearchFilters,
    pageSize: number,
    currentPage: number,
    firestoreCursorId: string | undefined,
    lastVisibleId: string | undefined,
    logger: Logger
  ): Promise<UnifiedSearchResult> {
    const filtersAny: UnifiedSearchFilters = filters;
    let q = this.buildBaseQuery(category, entityType, filtersAny);

    // COUNT aggregation uklonjen pošto generiše nepredvidiv broj "Read" operacija za kompleksne/nestandardne upite.
    // Prelazimo na "N + 1" limit paginaciju da detektujemo sledeću stranu bez dodatih čitanja.
    
    q = this.applyCommonSortAndSelect(q);
    q = q.limit(pageSize + 1); // 🚀 N + 1 Optimizacija

    if (firestoreCursorId) {
      if (!checkQuotaStatus()) {
        const decodedStr = Buffer.from(
          lastVisibleId!.replace("cursor_", ""),
          "base64",
        ).toString("utf-8");
        const parsedToken = JSON.parse(decodedStr);
        
        // 🚀 OPTIMIZATION: If we have sort keys in the token, we use startAfter(values) 
        // to bypass the extra .get() call, saving 1 Read per page.
        if (parsedToken.createdAt !== undefined) {
          const createdAtVal = typeof parsedToken.createdAt === 'number' 
            ? Timestamp.fromMillis(parsedToken.createdAt)
            : parsedToken.createdAt;
          
          q = q.startAfter(createdAtVal, parsedToken.id);
        } else {
          // Fallback for legacy simple ID-only cursors
          const isProfileSearch = false;
          const collectionName = isProfileSearch
            ? "users"
            : [
                  "listings",
                  "jobs",
                  "machines",
                  "accommodations",
                  "caterings",
                  "plots",
                  "marketplace",
                  "realEstate",
                ].includes(category) ||
                (entityType && entityType !== category)
              ? "listings"
              : category;
          const lastDoc = await db
            .collection(collectionName)
            .doc(firestoreCursorId)
            .get();
          if (lastDoc.exists) q = q.startAfter(lastDoc);
        }
      }
    }

    try {
      if (checkQuotaStatus()) {
        logger.warn(`[UnifiedSearch] Pre-emptive Quota check activated for ${category}`);
        return {
          docs: [],
          lastVisibleId: null,
          hasMore: false,
          warning: "Sistem je trenutno pod opterećenjem. Koristimo rezervni režim rada (SWR Fallback)."
        };
      }

      const snap = await q.get();
      
      const hasMore = snap.docs.length > pageSize;
      let actualDocs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

      let docs: UnifiedSearchDoc[] = actualDocs.map((doc: QueryDocumentSnapshot) =>
          UnifiedSearchUtils.mapToListing(
              ImageTransformer.transformDocumentImages({
                id: doc.id,
                ...doc.data(),
              })
            )
      );

      if (filtersAny.isPremium) {
        const before = docs.length;
        docs = docs.filter((d: any) => d.isPremium === true);
        console.log(`[PREMIUM_DEBUG] Filtered ${before} → ${docs.length} docs (isPremium filter), sample isPremium values:`, docs.slice(0,3).map(d => (d as any).isPremium));
      }
      if (filtersAny.isUrgent) {
        const before = docs.length;
        docs = docs.filter((d: any) => d.isUrgent === true);
        console.log(`[URGENT_DEBUG] Filtered ${before} → ${docs.length} docs (isUrgent filter)`);
      }

      docs = this.sortWithPremium(docs);

      const rawLastVisibleDoc = actualDocs.length > 0 ? actualDocs[actualDocs.length - 1] : null;
      let secureNextCursor = null;

      if (hasMore && rawLastVisibleDoc) {
        const d = rawLastVisibleDoc.data();
        const tokenObj = { 
          id: rawLastVisibleDoc.id, 
          p: currentPage + 1,
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().getTime() : d.createdAt 
        };
        secureNextCursor =
          "cursor_" +
          Buffer.from(JSON.stringify(tokenObj)).toString("base64");
      }

      const response = {
        docs,
        lastVisibleId: secureNextCursor,
        hasMore,
        totalHits: docs.length,
      };

      if (!lastVisibleId && !filtersAny.search) {
        await CacheService.set(
          `fallback_search_${category}`,
          response,
          86400000,
        );
      }

      return response;
    } catch (error: unknown) {
      const err = error as Error & { details?: string; code?: number };
      const isQuotaError = 
        err?.message?.includes("Quota limit exceeded") || 
        err?.details?.includes("Quota limit exceeded") ||
        err?.code === 8; // RESOURCE_EXHAUSTED

      if (isQuotaError) {
        logger.warn(`Firestore QUOTA EXCEEDED for ${category}. Returning empty list.`);
        return { 
          docs: [], 
          lastVisibleId: null, 
          hasMore: false,
          warning: "Privremeno smo dostigli limit baze podataka. Molimo pokušajte ponovo kasnije."
        };
      }
      throw error;
    }
  }

  static async executeFirestoreInMemorySearch(
    category: string,
    entityType: string,
    filters: UnifiedSearchFilters,
    pageSize: number,
    currentPage: number,
    logger: Logger
  ): Promise<UnifiedSearchResult> {
    const filtersAny: UnifiedSearchFilters = filters;
    let q = this.buildBaseQuery(category, entityType, filtersAny);

    // Limit to 150 latest documents for in-memory keyword filtering (quota safe)
    q = this.applyCommonSortAndSelect(q);
    q = q.limit(150);

    try {
      if (checkQuotaStatus()) {
        logger.warn(`[UnifiedSearch] Pre-emptive Quota check activated for ${category}`);
        return {
          docs: [],
          lastVisibleId: null,
          hasMore: false,
          warning: "Sistem je trenutno pod opterećenjem. Koristimo rezervni režim rada."
        };
      }

      const snap = await q.get();

      const allDocs: UnifiedSearchDoc[] = this.sortWithPremium(snap.docs.map((doc: QueryDocumentSnapshot) =>
          UnifiedSearchUtils.mapToListing(
              ImageTransformer.transformDocumentImages({
                id: doc.id,
                ...doc.data(),
              })
            )
      ));

      const searchKeyword = (filtersAny.search || "").toLowerCase().trim();
      let filteredDocs = allDocs.filter((doc: any) => {
        if (!searchKeyword) return true;
        const titleMatch = doc.title && String(doc.title).toLowerCase().includes(searchKeyword);
        const compMatch = doc.comp && String(doc.comp).toLowerCase().includes(searchKeyword);
        const nameMatch = doc.name && String(doc.name).toLowerCase().includes(searchKeyword);
        const descMatch = doc.description && String(doc.description).toLowerCase().includes(searchKeyword);
        const opisMatch = doc.opis && String(doc.opis).toLowerCase().includes(searchKeyword);
        return titleMatch || compMatch || nameMatch || descMatch || opisMatch;
      });

      if (filtersAny.isPremium) filteredDocs = filteredDocs.filter((d: any) => d.isPremium === true);
      if (filtersAny.isUrgent) filteredDocs = filteredDocs.filter((d: any) => d.isUrgent === true);

      const offset = (currentPage - 1) * pageSize;
      const paginatedDocs = filteredDocs.slice(offset, offset + pageSize);
      const hasMore = filteredDocs.length > offset + pageSize;
      let secureNextCursor = null;

      if (hasMore && paginatedDocs.length > 0) {
        const lastDoc = paginatedDocs[paginatedDocs.length - 1];
        const tokenObj = { 
          id: lastDoc.id, 
          p: currentPage + 1,
        };
        secureNextCursor =
          "cursor_" +
          Buffer.from(JSON.stringify(tokenObj)).toString("base64");
      }

      return {
        docs: paginatedDocs,
        lastVisibleId: secureNextCursor,
        hasMore,
        totalHits: filteredDocs.length,
        warning: "Prikazujemo rezultate u rezervnom (resilient) režimu rada jer je glavni pretraživač trenutno nedostupan."
      };
    } catch (error: unknown) {
      logger.error("Firestore in-memory search fallback failed:", error);
      return { docs: [], lastVisibleId: null, hasMore: false };
    }
  }
}
