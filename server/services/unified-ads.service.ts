// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { admin as firebaseAdmin, db, getDb } from "../config/firebase.ts";
import { CacheService } from "./cache.service.ts";
import { AdminStatsService } from "./admin-stats.service.ts";
import { AuditService, AuditAction } from "./audit.service.ts";
import { Logger } from "../utils/logger.ts";
import { AppError, BadRequestError } from "../utils/appError.ts";
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { AdStrategyFactory } from "./ads/strategy-factory.ts";
import { Listing } from "../types/ads.ts";

/**
 * UnifiedAdsService handles creation and deletion of all ad types
 * ensuring data integrity and secure statistical aggregation.
 */
export class UnifiedAdsService {
  private static logger = new Logger({ service: "UnifiedAdsService" });

  // L1 Hard Cache (Shield) specifically for homepage performance
  private static l1ShieldCache = new Map<string, { data: any; expiry: number }>();
  private static inflightPromises = new Map<string, Promise<any>>();
  private static readonly L1_SHIELD_TTL = 60 * 1000; // 1 minute protection

  /**
   * Internal helper to handle request collapsing and L1/L2 caching logic for metadata
   */
  private static async getCachedMetadata<T>(cacheKey: string, fastPathDoc: string, fetchFn: () => Promise<T>, fallbackValue?: T): Promise<T> {
    const now = Date.now();
    
    // 1. L1 RAM Shield Check (Static/Synchronous)
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) return shield.data as T;

    // 2. In-flight Promise Collapsing (Prevents Thundering Herd)
    const inflight = this.inflightPromises.get(cacheKey);
    if (inflight) return inflight as Promise<T>;

    const fetchTask = (async () => {
      try {
        const data = await CacheService.getOrSetSWR(
          cacheKey,
          async () => {
             // 1. Try Firestore Fast-Path (L0) as a cheaper fallback than query
             try {
               const { checkQuotaStatus, getMockDocSnapshot } = await import("../config/firebase.ts");
               
                let doc;
                if (checkQuotaStatus()) {
                   console.warn(`[UnifiedAdsService] Quota exhausted, using local mock for ${fastPathDoc}`);
                   doc = getMockDocSnapshot(fastPathDoc.split('/').pop() || "", fastPathDoc);
                } else {
                   // EXTREME TIMEOUT: 100ms for Fast-Path FirestoreDoc. 
                   // If Firestore is slow, we'd rather fail the Fast-Path and fallback than block the BFF.
                   const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 100));
                   doc = await Promise.race([
                     db.doc(fastPathDoc).get(),
                     timeoutPromise
                   ]).catch(() => null);
                }

               if (doc && doc.exists) {
                 const d = doc.data();
                 const actualData = d?.stats || d?.partners || d?.urgent || d?.premium || d;
                 if (actualData) {
                   console.log(`[UnifiedAdsService] L0 Fast-Path hit for ${cacheKey}`);
                   return actualData;
                 }
               }
             } catch (e: unknown) {
               const err = e instanceof Error ? e : new Error(String(e));
               console.warn(`[UnifiedAdsService] L0 Fast-Path failed for ${cacheKey}:`, err.message);
             }

             // Stop execution and return fallback immediately if circuit breaker tripped
             const { checkQuotaStatus } = await import("../config/firebase.ts");
             if (checkQuotaStatus()) {
               console.warn(`[UnifiedAdsService] Quota status is active after fast-path attempt. Skipping cold-path query for ${cacheKey} and returning fallback.`);
               return fallbackValue as T;
             }

             // 2. Fallback to real query (Cold Path)
             const res = await fetchFn();
             
             return res;
          },
          30 * 24 * 3600 * 1000, // Near-Infinite 30 Days TTL (Protected with Event-Driven Cache Invalidation)
          fallbackValue
        );
        this.l1ShieldCache.set(cacheKey, { data, expiry: now + this.L1_SHIELD_TTL });
        return data;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[UnifiedAdsService] Cache Shield failure for ${cacheKey}:`, error.message);
        throw error;
      } finally {
        this.inflightPromises.delete(cacheKey);
      }
    })();

    this.inflightPromises.set(cacheKey, fetchTask);
    
    // 3. Global Tier-2 Safety Timeout: 150ms max wait for the whole tiered lookup
    const globalTimeout = new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallbackValue as T), 150);
    });

    return Promise.race([fetchTask, globalTimeout]);
  }

  static async createAd(category: string, rawData: Record<string, any>, uid: string) {
    const strategy = AdStrategyFactory.getStrategy(category);
    return strategy.createAd(rawData, uid);
  }

  static async getMyAds(uid: string, limitNum: number, cursor?: string, searchQ?: string) {
    // Use raw Firestore directly to bypass proxy timeout/circuit-breaker
    const rawDb = getDb();
    const fetchLimit = searchQ ? 150 : Math.max(limitNum * 2, 50);
    const snap = await rawDb.collection("listings")
      .where("authorId", "==", uid)
      .limit(fetchLimit)
      .get();

    const excludeStatuses = new Set(["deleted"]);
    const { ImageTransformer } = await import("../utils/image.transformer.ts");

    let docs = snap.docs
      .filter(doc => !excludeStatuses.has(doc.data().status))
      .map((doc: firebaseAdmin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data() as Listing;
      let typeLabel = '';
      let postType = data.type || '';

      switch(data.type) {
        case 'job': typeLabel = 'Posao'; break;
        case 'accommodation': typeLabel = 'Smeštaj'; break;
        case 'machine': typeLabel = 'Mašina'; break;
        case 'catering': typeLabel = 'Ketering'; break;
        case 'plot': 
        case 'real_estate':
          typeLabel = 'Plac'; break;
        case 'company': typeLabel = 'Firma'; break;
        default: typeLabel = 'Oglas'; postType = 'other';
      }

      return ImageTransformer.transformDocumentImages({
        ...data,
        id: doc.id,
        typeLabel,
        postType
      }) as Listing & { typeLabel: string; postType: string };
    });

    // Sort by createdAt descending in-memory
    docs.sort((a, b) => {
      const aVal: any = a.createdAt;
      const bVal: any = b.createdAt;
      const aTime = aVal?.toDate?.()?.getTime() ?? Number(aVal) ?? 0;
      const bTime = bVal?.toDate?.()?.getTime() ?? Number(bVal) ?? 0;
      return bTime - aTime;
    });

    // Handle cursor-based offset
    if (cursor) {
      const cursorIdx = docs.findIndex(d => d.id === cursor);
      if (cursorIdx >= 0) {
        docs = docs.slice(cursorIdx + 1);
      }
    }

    // Apply search filter
    if (searchQ) {
      const lowQ = searchQ.toLowerCase();
      docs = docs.filter(d => 
        (d.title && d.title.toLowerCase().includes(lowQ)) || 
        (d.comp && d.comp.toLowerCase().includes(lowQ))
      );
    }

    const hasMore = docs.length > limitNum;
    const pageDocs = docs.slice(0, limitNum);

    return {
      docs: pageDocs,
      lastVisibleId: pageDocs.length > 0 ? pageDocs[pageDocs.length - 1].id : null,
      hasMore,
    };
  }

  static async updateAdById(id: string, updates: Record<string, any>, user: { uid: string; isAdmin?: boolean; role?: string }) {
    const adRef = db.collection("listings").doc(id);
    const snap = await adRef.get();

    if (!snap.exists) {
      throw new BadRequestError("Oglas nije pronađen");
    }

    const adData = snap.data()!;

    // allow if author or admin
    if (adData.authorId !== user.uid && !user.isAdmin) {
      throw new BadRequestError("Niste autorizovani da menjate ovaj oglas");
    }

    // Clean invalid local images
    if (Array.isArray(updates.images)) {
      updates.images = (updates.images as string[]).filter((url: string) => !url.startsWith("blob:") && !url.startsWith("data:"));
    }

    await adRef.update({
      ...updates,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    const { CacheService } = await import("./cache.service.ts");
    const { CacheKeys } = await import("../constants/cache-keys.ts");
    await CacheService.delete(CacheKeys.adDetail(id));
    await CacheService.invalidateByPrefix(`myAds_${adData.authorId}`);
    await CacheService.invalidateByPrefix(`publicProfileAds_${adData.authorId}`);
    await CacheService.invalidateByPrefix("public_ads_");
    await CacheService.invalidateByPrefix("search_ads_"); 
    const { PredictiveAnalyticsService } = await import("./predictive.service.ts");
    await PredictiveAnalyticsService.forceRefresh(id).catch((e: unknown) => console.error("[Ads] operation error:", e));

    // Invalidate employer dashboard stats cache to resolve "Ghost" ads immediately
    const { DashboardService } = await import("./dashboard.service.ts");
    await DashboardService.clearEmployerStatsCache(adData.authorId).catch((e: unknown) => console.error("[Ads] operation error:", e));

    return { success: true };
  }

  static async updateAd(
    category: string,
    id: string,
    rawData: Record<string, unknown>,
    uid: string,
  ) {
    const strategy = AdStrategyFactory.getStrategy(category);
    return strategy.updateAd(id, rawData, uid);
  }

  static async deleteAd(category: string, id: string, uid: string) {
    const strategy = AdStrategyFactory.getStrategy(category);
    return strategy.deleteAd(id, uid);
  }

  static async getAdById(category: string, id: string) {
    const { listingsLoader } = await import("../utils/dataloader.ts");
    const docData = await listingsLoader.load(id);
    if (!docData) return null;
    return docData;
  }

  static async getPremiumPartners() {
    const cacheKey = "premium_partners_v2";
    const fastPathDoc = "metadata/premium_partners_fastpath";

    const fallbackPartners: { id: string; name: string; logo: string }[] = [];

    try {
      return await this.getCachedMetadata(cacheKey, fastPathDoc, async () => {
        const snap = await db
          .collection("listings")
          .where("type", "==", "company")
          .where("status", "==", "active")
          .where("isPremium", "==", true)
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();

        if (snap.empty) return fallbackPartners;

        const partners = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || d.comp || d.title || "Kompanija",
            logo: d.logo || d.logoUrl || "",
          };
        });

        const finalData = partners.length > 0 ? partners : fallbackPartners;
        
        // Strip undefined values which Firebase rejects
        const sanitizedFinalData = JSON.parse(JSON.stringify(finalData));
        
        // Sync back to Fast-Path
        await db.doc(fastPathDoc).set({
          partners: sanitizedFinalData,
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch((e: unknown) => console.error("[Ads] operation error:", e));

        return finalData;
      }, fallbackPartners);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn("[PARTNERS] using disaster fallback:", error.message);
      return fallbackPartners;
    }
  }

  static async getPromotedAds(options: {
    limit?: number;
    isUrgent?: boolean;
    isPremium?: boolean;
  }) {
    const cacheKey = `promoted_${options.isUrgent ? "urgent" : ""}_${options.isPremium ? "premium" : ""}_${options.limit || 12}`;
    const fastPathDoc = "metadata/promoted_ads_fastpath";
    const fastPathField = options.isUrgent ? "urgent" : "premium";

    const finalFallback: any[] = [];

    try {
      return await this.getCachedMetadata(cacheKey, fastPathDoc, async () => {
          let query = db
            .collectionGroup("listings")
            .where("status", "in", ["active", "approved"]);

          if (options.isUrgent) query = query.where("isUrgent", "==", true);
          if (options.isPremium) query = query.where("isPremium", "==", true);

          query = query.orderBy("createdAt", "desc");

          const snap = await query.limit(options.limit || 12).get();

          if (snap.empty) return finalFallback;

          const results = snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
            };
          });

          // Strip undefined values which Firebase rejects
          const sanitizedResults = JSON.parse(JSON.stringify(results));

          // Self-heal Fast-Path
          await db.doc(fastPathDoc).set({
            [fastPathField]: sanitizedResults,
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
          }, { merge: true }).catch((e: unknown) => console.error("[Ads] operation error:", e));

          return results;
      }, finalFallback);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.warn(`[PROMOTED] degraded: ${err.message}`);
      return finalFallback;
    }
  }

  static async moderateAd(
    category: string,
    id: string,
    action: "approve" | "reject",
    adminId: string,
    reason?: string,
  ) {
    const strategy = AdStrategyFactory.getStrategy(category);
    return strategy.moderateAd(id, action, adminId, reason);
  }

  static async initUserStats(uid: string, role: string) {
    return await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists) throw new BadRequestError("User not found");
      const userData = userSnap.data()!;

      if (userData.statsCounted) return { alreadyCounted: true };

      // Inkrementacija
      await AdminStatsService.updateGlobalStats(
        "users",
        1,
        false,
        "active",
        transaction,
      );

      if (role === "majstor") {
        await AdminStatsService.updateGlobalStats(
          "masters",
          1,
          false,
          "active",
          transaction,
        );
      }

      transaction.update(userRef, { statsCounted: true });
      return { success: true };
    });
  }

  static async getPublicAds(category: string, limitCount: number = 10, cursor?: string) {
    const cacheKey = `public_ads_v2_${category}_${limitCount}_${cursor || "first"}`;
    
    // PROMPT 5: Cache-first rutiranje u Redisu na 15 minuta
    try {
      const cached = await CacheService.get<{ docs: any[], lastVisibleId: string | null, hasMore: boolean }>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (e) {
      // Ignorišemo Redis greške pri čitanju
    }

    const collName = category === "companies" ? "users" : "listings";
    let q: FirebaseFirestore.Query = db.collection(collName);
    if (category === "companies") {
      q = q.where("role", "==", "company");
    } else if (category !== "all" && category !== "marketplace") {
      let entityType = category;
      if (category === "machines") entityType = "machine";
      else if (category === "accommodations") entityType = "accommodation";
      else if (category === "caterings") entityType = "catering";
      else if (category === "plots" || category === "real_estate") entityType = "plot";
      else if (category === "realEstate") entityType = "realEstate";
      else if (category === "jobs") entityType = "job";

      q = q.where("type", "==", entityType).where("status", "==", "active");
    } else {
      q = q.where("status", "==", "active");
    }

    q = q.orderBy("createdAt", "desc");

    if (cursor) {
      if (cursor.includes("|")) {
        const [timeStr, id] = cursor.split("|");
        const ts = firebaseAdmin.firestore.Timestamp.fromMillis(parseInt(timeStr, 10));
        q = q.startAfter(ts, id);
      } else if (cursor.match(/^\d+$/)) {
        q = q.startAfter(firebaseAdmin.firestore.Timestamp.fromMillis(parseInt(cursor, 10)));
      } else {
        const cursorDoc = await db.collection(collName).doc(cursor).get();
        if (cursorDoc.exists) {
          q = q.startAfter(cursorDoc);
        }
      }
    }

    const snap = await q
      .orderBy(firebaseAdmin.firestore.FieldPath.documentId(), "desc")
      .limit(limitCount)
      .select(
        "title",
        "price",
        "location",
        "type",
        "status",
        "createdAt",
        "images",
        "isPremium",
        "isUrgent",
        "comp",
        "salary",
        "logo",
      )
      .get();

    const { ImageTransformer } = await import("../utils/image.transformer.ts");
    const docs = snap.docs.map((doc: firebaseAdmin.firestore.QueryDocumentSnapshot) =>
      ImageTransformer.transformDocumentImages({
        id: doc.id,
        ...doc.data(),
      }),
    );

    const result = {
      docs,
      lastVisibleId: docs.length === limitCount ? `${(docs[docs.length - 1] as any).createdAt?.toDate ? (docs[docs.length - 1] as any).createdAt.toDate().getTime() : ((docs[docs.length - 1] as any).createdAt || Date.now())}|${(docs[docs.length - 1] as any).id}` : null,
      hasMore: docs.length === limitCount,
    };

    // PROMPT 5: Čuvanje aktivnih oglasa u Redisu 15 minuta (900000 ms) čime neutrališemo Google Crawler upite
    try {
      await CacheService.set(cacheKey, result, 900000);
    } catch (e) {
      // Ignorišemo greške
    }

    return result;
  }
}
