// ≡ƒ¢í∩╕Å [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { admin as firebaseAdmin, db } from "../config/firebase.ts";
import { CacheService } from "./cache.service.ts";

type RawAdData = Record<string, unknown>;
import { AdminStatsService } from "./admin/admin-stats.service.ts";
import { AuditService, AuditAction } from "./audit.service.ts";
import { Logger } from "../utils/logger.ts";
import { AppError, BadRequestError } from "../utils/appError.ts";
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { BaseAdStrategy } from "./ads/base-ad.strategy.ts";
import { Listing } from "../types/ads.ts";

/**
 * UnifiedAdsService handles creation and deletion of all ad types
 * ensuring data integrity and secure statistical aggregation.
 */
export class UnifiedAdsService {
  private static logger = new Logger({ service: "UnifiedAdsService" });

  private static readonly CATEGORY_MAP: Record<string, { category: string; entityType: string }> = {
    jobs: { category: "jobs", entityType: "job" },
    companies: { category: "companies", entityType: "company" },
  };

  private static cachedStrategies = new Map<string, BaseAdStrategy>();

  private static getStrategy(category: string): BaseAdStrategy {
    const cached = this.cachedStrategies.get(category);
    if (cached) return cached;
    const mapping = this.CATEGORY_MAP[category];
    if (!mapping) throw new BadRequestError(`No strategy found for category: ${category}`);
    const strategy = new BaseAdStrategy(mapping.category, mapping.entityType);
    this.cachedStrategies.set(category, strategy);
    return strategy;
  }

  /**
   * Internal helper for metadata caching (direct fetch + CacheService)
   */
  private static async getCachedMetadata<T>(cacheKey: string, _fastPathDoc: string, fetchFn: () => Promise<T>, fallbackValue?: T): Promise<T> {
    try {
      const cached = await CacheService.get<T>(cacheKey).catch(() => null);
      if (cached) {
        if (Array.isArray(cached) && cached.length === 0) {
          // Prazan niz ignorišemo i idemo na pravi upit
        } else {
          return cached;
        }
      }

      const data = await fetchFn();
      if (Array.isArray(data) && data.length === 0) {
        return data;
      }
      await CacheService.set(cacheKey, data, 300000).catch(() => {});
      return data;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error(`[UnifiedAdsService] Cache failure for ${cacheKey}:`, error.message);
      if (fallbackValue !== undefined) return fallbackValue;
      throw error;
    }
  }

  static async createAd(category: string, rawData: Record<string, any>, uid: string) {
    const strategy = this.getStrategy(category);
    return strategy.createAd(rawData, uid);
  }

  static async getMyAds(uid: string, limitNum: number) {
    try {
      // Limit query at Firestore level for efficiency, not client-side
      const snap = await db.collection("listings")
        .where("authorId", "==", uid)
        .orderBy("createdAt", "desc")
        .limit(limitNum)
        .get();

      let docs: any[] = snap.docs
        .map((doc) => {
          const data = doc.data();
          const type = data.type || '';
          let typeLabel = 'Oglas';
          if (type === 'job') typeLabel = 'Posao';
          else if (type === 'company') typeLabel = 'Firma';
          return { ...data, id: doc.id, typeLabel, postType: type || 'other' };
        });

      return { docs, lastVisibleId: null, hasMore: false };
    } catch (e: any) {
      console.error("[UnifiedAdsService] getMyAds error:", e?.message || e);
      return { docs: [], lastVisibleId: null, hasMore: false };
    }
  }

  static async updateAdById(id: string, updates: Record<string, any>, user: { uid: string; isAdmin?: boolean; role?: string }) {
    const adRef = db.collection("listings").doc(id);
    const snap = await adRef.get();

    if (!snap.exists) {
      throw new BadRequestError("Oglas nije prona─æen");
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

    // Invalidate employer dashboard stats cache to resolve "Ghost" ads immediately
    const { DashboardService } = await import("./dashboard/dashboard.service.ts");
    await DashboardService.clearEmployerStatsCache(adData.authorId).catch(() => {});

    return { success: true };
  }

  static async updateAd(
    category: string,
    id: string,
    rawData: Record<string, unknown>,
    uid: string,
  ) {
    const strategy = this.getStrategy(category);
    return strategy.updateAd(id, rawData, uid);
  }

  static async deleteAd(category: string, id: string, uid: string) {
    const strategy = this.getStrategy(category);
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

    const fallbackPartners = [
      { id: "f1", name: "ENERGOPROJEKT", logo: "" },
      { id: "f2", name: "STRABAG", logo: "" },
      { id: "f3", name: "NAPRED", logo: "" },
      { id: "f4", name: "KARIN KOMERC", logo: "" },
      { id: "f5", name: "MILLENNIUM TEAM", logo: "" },
      { id: "f6", name: "PUTEVI SRBIJE", logo: "" }
    ];

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

        return partners.length > 0 ? partners : fallbackPartners;
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
    const cacheKey = `promoted_v4_${options.isUrgent ? "urgent" : ""}_${options.isPremium ? "premium" : ""}_${options.limit || 12}`;
    const fastPathDoc = "metadata/promoted_ads_fastpath";
    const fastPathField = options.isUrgent ? "urgent" : "premium";

    const finalFallback: RawAdData[] = [];

    try {
      return await this.getCachedMetadata(cacheKey, fastPathDoc, async () => {
          let query = db
            .collection("listings")
            .where("status", "==", "active");

          if (options.isUrgent) query = query.where("isUrgent", "==", true);
          if (options.isPremium) query = query.where("isPremium", "==", true);

          query = query.orderBy("createdAt", "desc");
          const snap = await query.limit(Math.max(options.limit || 12, 100)).get();

          if (snap.empty) return finalFallback;

          let results = snap.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
              ...d,
              createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
            };
          });

          results.sort((a: any, b: any) => {
            const cA = a.createdAt, cB = b.createdAt;
            const aT = cA?.toMillis?.() ?? (typeof cA === 'string' ? new Date(cA).getTime() : cA) ?? 0;
            const bT = cB?.toMillis?.() ?? (typeof cB === 'string' ? new Date(cB).getTime() : cB) ?? 0;
            return bT - aT;
          });
          results = results.slice(0, options.limit || 12);

          if (options.isPremium && results.length > 0) {
            console.log(`[PREMIUM_DEBUG] getPromotedAds found ${results.length} premium docs, types:`, results.map((r: any) => ({ id: r.id, type: r.type, isPremium: r.isPremium, title: r.title })));
          }

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
    const strategy = this.getStrategy(category);
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
      // Ignori┼íemo Redis gre┼íke pri ─ìitanju
    }

    const collName = category === "companies" ? "users" : "listings";
    let q: FirebaseFirestore.Query = db.collection(collName);
    if (category === "companies") {
      q = q.where("role", "==", "company");
    } else if (category !== "all") {
      let entityType = category;
      if (category === "jobs") entityType = "job";

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

    // PROMPT 5: ─îuvanje aktivnih oglasa u Redisu 15 minuta (900000 ms) ─ìime neutrali┼íemo Google Crawler upite
    try {
      await CacheService.set(cacheKey, result, 900000);
    } catch (e) {
      // Ignori┼íemo gre┼íke
    }

    return result;
  }
}
