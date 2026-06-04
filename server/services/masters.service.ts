import { UnifiedSearchService } from "./unified-search.service.ts";
import { CacheService } from "./cache.service.ts";
import { db, admin } from "../config/firebase.ts";

export interface MasterDTO {
  id: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  profession?: string;
  professionSlug?: string;
  location?: string;
  locationSlug?: string;
  photoURL?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  [key: string]: unknown;
}

export class MasterService {
  static async getPublicMasters(limitCount: number = 100): Promise<{
    docs: MasterDTO[];
    lastVisibleId: string | null;
    hasMore: boolean;
    warning?: string;
  }> {
    const cacheKey = `public_masters_${limitCount}`;
    const cached = await CacheService.get<{
      docs: MasterDTO[];
      lastVisibleId: string | null;
      hasMore: boolean;
      warning?: string;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const snap = await db
        .collection("users")
        .where("role", "==", "majstor")
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      const docs = snap.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

      const response = {
        docs,
        lastVisibleId:
          docs.length === limitCount ? docs[docs.length - 1].id : null,
        hasMore: docs.length === limitCount,
      };

      // Cache for 30 minutes
      await CacheService.set(cacheKey, response, 1800000);
      return response;
    } catch (error: any) {
      const err = error as Error & { code?: number; details?: string };
      const isQuotaError = 
        err?.message?.includes("Quota limit exceeded") || 
        err?.details?.includes("Quota limit exceeded") ||
        err?.code === 8;
        
      if (isQuotaError) {
        console.error("[MASTERS] Firestore QUOTA EXCEEDED. Serving fallback/stale data.");
      } else {
        console.error("[MASTERS] Firestore error:", err);
      }
      
      // Try to return stale cache if database is down or quota hit
      return (cached as any) || { 
        docs: [], 
        lastVisibleId: null, 
        hasMore: false, 
        warning: isQuotaError ? "Privremeno smo dostigli limit baze podataka. Molimo pokušajte ponovo kasnije." : undefined 
      };
    }
  }

  static async searchMasters(
    filters: any,
    lastVisibleId?: string,
    limitCount = 24,
  ): Promise<{
    docs: MasterDTO[];
    lastVisibleId: string | null;
    hasMore: boolean;
    totalHits?: number;
    warning?: string;
  }> {
    // Koristimo UnifiedSearchService koji podržava Algolia i Firestore fallback
    return UnifiedSearchService.search(
      "masters",
      filters,
      limitCount,
      lastVisibleId,
    );
  }
}
