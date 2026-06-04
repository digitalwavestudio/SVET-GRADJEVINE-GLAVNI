// @ts-nocheck
import { db, admin } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { ArticleStatus } from "../../../src/types/magazine.ts";

export class MagazineStatsService {
  private static readonly COLLECTION = "articles";

  // L1 RAM Shield
  private static l1ShieldCache = new Map<
    string,
    { data: unknown; expiry: number }
  >();
  private static readonly L1_SHIELD_TTL = 60 * 1000;

  /**
   * Fetches global magazine metadata with caching
   */
  static async getMetadata() {
    const cacheKey = "magazine_metadata_stats";

    // L1 Check
    const now = Date.now();
    const shield = this.l1ShieldCache.get(cacheKey);
    if (shield && now < shield.expiry) return shield.data as T;

    const data = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        const { checkQuotaStatus, getMockDocSnapshot } = await import("../../config/firebase.ts");

        let doc;
        if (checkQuotaStatus()) {
          console.warn("[MagazineStatsService] Quota exhausted, using local mock for metadata/magazine_stats");
          doc = getMockDocSnapshot("magazine_stats", "metadata/magazine_stats");
        } else {
          doc = await db.doc("metadata/magazine_stats").get();
        }

        return doc.exists
          ? doc.data()
          : {
              totalArticles: 0,
              totalViews: 0,
              categories: [],
              popularTags: [],
            };
      },
      60 * 60 * 1000, // 1 hour
      { totalArticles: 0, totalViews: 0, categories: [], popularTags: [] }, // Fallback
    );

    this.l1ShieldCache.set(cacheKey, {
      data,
      expiry: now + this.L1_SHIELD_TTL,
    });
    return data;
  }

  /**
   * Recalculates global magazine stats from scratch
   * Uses projection query (.select) to remain hyper-efficient on reads
   */
  static async recalculateMetadata() {
    try {
      // 1. Fetch categories
      const categoriesSnap = await db.collection("magazine_categories").get();
      const categoriesList = categoriesSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
        slug: doc.data().slug || "",
      }));

      // 2. Query articles using select projection (extreme network and query optimization)
      const articlesSnap = await db
        .collection(this.COLLECTION)
        .select("status", "viewCount", "category", "tags")
        .get();

      let totalArticles = 0;
      let totalViews = 0;
      const categoryCounts: Record<string, number> = {};
      const tagMap: Record<string, number> = {};

      articlesSnap.docs.forEach((doc) => {
        const d = doc.data();
        const status = d.status || "draft";

        // Count published articles
        if (status === ArticleStatus.PUBLISHED) {
          totalArticles++;
        }

        // Aggregate total views
        totalViews += typeof d.viewCount === "number" ? d.viewCount : 0;

        // Count per category (only for published articles)
        if (status === ArticleStatus.PUBLISHED && d.category) {
          categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
        }

        // Aggregate tags (only for published articles)
        if (status === ArticleStatus.PUBLISHED && Array.isArray(d.tags)) {
          d.tags.forEach((t: string) => {
            if (t) {
              tagMap[t] = (tagMap[t] || 0) + 1;
            }
          });
        }
      });

      // Map category list with computed counts
      const categoriesStats = categoriesList.map((cat) => ({
        name: cat.name,
        slug: cat.slug,
        count: categoryCounts[cat.slug] || 0,
      }));

      // Sort popular tags
      const popularTags = Object.entries(tagMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((entry) => entry[0]);

      const statsData = {
        totalArticles,
        totalViews,
        categories: categoriesStats,
        popularTags,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Atomic Update to fast-path metadata
      await db.doc("metadata/magazine_stats").set(statsData, { merge: true });

      // Invalidate cache
      const cacheKey = "magazine_metadata_stats";
      await CacheService.delete(cacheKey);
      this.l1ShieldCache.delete(cacheKey);

      return statsData;
    } catch (err: unknown) {
      console.error("[MagazineStatsService] Failed to recalculate metadata", err);
      throw err;
    }
  }

  /**
   * Records a view with REDIS-BASED PAGE VIEW BUFFER (Enterprise cost saving & quota protection)
   * We increment the article counter in Redis hash immediately.
   * A background worker (PageViewsAggregatorWorker) flushes these views to Firestore inside a batch-merge
   * every 30 minutes, keeping write quotas in check under high traffic.
   */
  static async recordView(articleId: string) {
    try {
      const { getRedis } = await import("../../utils/redis.ts");
      const redis = getRedis();
      if (redis) {
        await redis.hincrby("metrics:magazine_pending_views", articleId, 1);
      } else {
        // Fallback: probabilistic update if Redis is completely down
        if (Math.random() < 0.1) {
          const incrementValue = 10;
          await db.runTransaction(async (transaction) => {
            const articleRef = db.collection(this.COLLECTION).doc(articleId);
            const metadataRef = db.doc("metadata/magazine_stats");

            transaction.update(articleRef, {
              viewCount: admin.firestore.FieldValue.increment(incrementValue),
              views: admin.firestore.FieldValue.increment(incrementValue),
            });

            transaction.set(
              metadataRef,
              {
                totalViews:
                  admin.firestore.FieldValue.increment(incrementValue),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          });
        }
      }
    } catch (err) {
      console.warn("[MagazineStatsService] recordView fallback error:", err);
    }
  }
}
