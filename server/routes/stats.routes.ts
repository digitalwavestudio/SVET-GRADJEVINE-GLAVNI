import { Router } from "express";
import { admin, db } from "../config/firebase.ts";
import { requireAuth } from "../middleware/auth.middleware.ts";
import { AdminStatsService } from "../services/admin-stats.service.ts";

export const statsRouter = Router();

statsRouter.get("/finance", requireAuth, async (req, res, next) => {
  if (!(req as any)?.user.isAdmin)
    return res.status(403).json({ error: "Forbidden" });
  try {
    const stats = await AdminStatsService.getGlobalStats();
    res.json({
      totalRevenue: stats.estimatedRevenue || 0,
      confirmedCount: stats.activeAds || 0,
      failedCount: 0,
      initiatedCount: stats.pendingAds || 0,
      conversionRate: 1,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

statsRouter.get("/partner/:partnerId", requireAuth, async (req, res, next) => {
  try {
    const { partnerId } = req.params;

    // Umesto live count-a i agregacije, koristimo inkrementalne vrednosti
    // iz user_stats (koje popunjava payment.subscriber.ts pri uspešnoj kupovini)
    const userStatsDoc = await db.collection("user_stats").doc(partnerId).get();
    const userStats = userStatsDoc.data() || {};

    const totalConversions = userStats.totalReferralConversions || 0;
    const totalEarnings = userStats.totalReferralEarnings || 0;

    res.json({
      partnerId,
      totalConversions,
      totalEarnings,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

statsRouter.get("/pseo-insights", async (req, res, next) => {
  try {
    const { zanimanje, grad, collection } = req.query;
    if (!collection)
      return res.status(400).json({ error: "Missing collection" });

    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `pseo_insights:${collection}:${zanimanje || "all"}:${grad || "all"}`;
    
    const result = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        let queryRef: import("firebase-admin/firestore").Query = db
          .collection(collection as string)
          .where("status", "==", "active");

        if (grad) {
          queryRef = queryRef.where("locationSlug", "==", grad);
        }

        if (zanimanje) {
          if (collection === "jobs") {
            queryRef = queryRef.where("professionSlug", "==", zanimanje);
          } else if (collection === "machines") {
            queryRef = queryRef.where("category", "==", zanimanje);
          }
        }

        // Samo limitiramo na top 10 rezultata da izvučemo 'sample' podatke iz kojih ćemo generisati agregacije
        // umesto da brojimo milione redova, što štedi quota-u i compute.
        const snapshot = await queryRef
          .orderBy("createdAt", "desc")
          .limit(10)
          .get();

        let count = snapshot.size;
        let avgPrice = 0;

        if (count > 0) {
          let totalPrice = 0;
          let itemsWithPrice = 0;

          snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            const data = doc.data();
            if (collection === "jobs" && data.plataMin) {
              const avg =
                (Number(data.plataMin) + Number(data.plataMax || data.plataMin)) /
                2;
              totalPrice += avg;
              itemsWithPrice++;
            } else if (data.price) {
              totalPrice += Number(data.price);
              itemsWithPrice++;
            }
          });

          if (itemsWithPrice > 0) {
            avgPrice = Math.round(totalPrice / itemsWithPrice);
          }
        }

        const currentAvgJob = avgPrice ? Math.round(avgPrice / 1000) * 1000 : (collection === "jobs" ? 120000 : 0);
        const rangeMin = Math.round(currentAvgJob * 0.7);
        const rangeMax = Math.round(currentAvgJob * 1.4);

        return {
          sampleCount: count,
          estimatedTotal: count === 50 ? "50+" : count,
          averagePrice: avgPrice,
          rangeMin,
          rangeMax,
          currency: collection === "jobs" ? "RSD" : "EUR",
        };
      },
      86400000 // 24h cache
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/aggregate", async (req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  try {
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `global_aggregate_stats_v2`;
    
    const result = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        // Use pre-aggregated stats instead of live count() to protect quota
        const globalStats = await AdminStatsService.getGlobalStats();

        return {
          totalJobs: globalStats.totalJobs || 0,
          totalMachines: globalStats.machinesCount || 0,
          totalAccommodations: globalStats.accommodationsCount || 0,
          totalCaterings: globalStats.cateringCount || 0,
          totalRealEstate: globalStats.realEstateCount || 0,
          totalCompanies: globalStats.companiesCount || 0,
          premiumJobs: globalStats.premiumAds || globalStats.premiumPartners || 0,
          urgentJobs: globalStats.urgentAds || 0,
        };
      },
      3600000 // 1 hour cache
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/counts", async (req, res, next) => {
  try {
    const stats = await AdminStatsService.getGlobalStats();
    res.json({
      jobs: stats.totalJobs || 0,
      accommodations: stats.accommodationsCount || 0,
      machines: stats.machinesCount || 0,
      masters: stats.mastersCount || 0,
    });
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/author-counts/:authorId", async (req, res, next) => {
  try {
    const { authorId } = req.params;
    const { companyId } = req.query; 

    if (!authorId) return res.status(400).json({ error: "Missing authorId" });

    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    const redisKey = `author_global_summary:${authorId}:${companyId || "no_company"}`;

    if (redis) {
      try {
        const cachedStr = await redis.get(redisKey);
        if (cachedStr) {
          return res.json(JSON.parse(cachedStr));
        }
      } catch (err) {
        console.warn("[author-counts] Redis read failed:", err);
      }
    }

    const promises = [
      db
        .collection("jobs")
        .where("status", "in", ["approved", "active"])
        .where(
          companyId ? "companyId" : "authorId",
          "==",
          companyId || authorId,
        )
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      db
        .collection("machines")
        .where("status", "in", ["approved", "active"])
        .where("authorId", "==", authorId)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      db
        .collection("accommodations")
        .where("status", "in", ["approved", "active"])
        .where("authorId", "==", authorId)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      db
        .collection("caterings")
        .where("status", "in", ["approved", "active"])
        .where("authorId", "==", authorId)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
      db
        .collection("plots")
        .where("status", "in", ["approved", "active"])
        .where("authorId", "==", authorId)
        .count()
        .get()
        .catch(() => ({ data: () => ({ count: 0 }) })),
    ];

    const [jobsSnap, machinesSnap, accsSnap, catsSnap, plotsSnap] =
      await Promise.all(promises);

    const result = {
      jobs: (jobsSnap as { data: () => { count: number } }).data().count,
      machines: (machinesSnap as { data: () => { count: number } }).data().count,
      accommodations: (accsSnap as { data: () => { count: number } }).data().count,
      catering: (catsSnap as { data: () => { count: number } }).data().count,
      realestate: (plotsSnap as { data: () => { count: number } }).data().count,
    };

    if (redis) {
      try {
        await redis.set(redisKey, JSON.stringify(result), "EX", 3600); // 1 hour TTL Shield
      } catch (err) {
        console.warn("[author-counts] Redis write failed:", err);
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

statsRouter.get("/collection/:collectionName", async (req, res, next) => {
  try {
    const { collectionName } = req.params;

    // Validate collection
    const validCollections = [
      "jobs",
      "machines",
      "accommodations",
      "caterings",
      "plots",
      "marketplace",
      "companies",
      "users",
    ];
    if (!validCollections.includes(collectionName)) {
      return res.status(400).json({ error: "Invalid collection" });
    }

    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `stats_unified:${collectionName}`;
    
    const result = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        // Get pre-aggregated stats from global stats service (cheaper than live count)
        const globalStats = await AdminStatsService.getGlobalStats();

        const fieldMap: Record<string, string> = {
          jobs: "totalJobs",
          companies: "companiesCount",
          machines: "machinesCount",
          accommodations: "accommodationsCount",
          real_estate: "realEstateCount",
          plots: "realEstateCount",
          caterings: "cateringCount",
          marketplace: "marketplaceCount",
          users: "totalUsers",
          premium: "premiumPartners",
        };

        const countKey = fieldMap[collectionName];
        const total = countKey ? globalStats[countKey] || 0 : 0;

        // For "today" stats, we use a broad estimate or fallback if not critical
        // to avoid expensive where(createdAt > 24h) queries.
        const today = Math.round(total * 0.05) || 5;
        const premium = globalStats.premiumPartners || 0;

        return { total, today, premium };
      },
      3600000 // 1 hour cache
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});
