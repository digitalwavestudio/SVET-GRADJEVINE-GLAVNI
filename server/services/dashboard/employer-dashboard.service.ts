import { env } from "../../config/env.ts";
import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { 
  ApplicationItemDTO,
  DashboardAdItemDTO,
  DashboardTrendDTO
} from "../../dto/dashboard.dto.ts";
import { 
  employerStatsMemoryCache, 
  employerTrendsMemoryCache, 
  EMPLOYER_STATS_TTL 
} from "./dashboard-lru.ts";
import { CacheKeys } from "../../constants/cache-keys.ts";
import { logger } from "../../utils/logger.ts";

export class DashboardEmployerService {
  static async getEmployerStats(uid: string) {
    const cacheKey = CacheKeys.employerStats(uid);
    const now = Date.now();

    try {
      const result = await CacheService.getOrSetSWR(
        cacheKey,
        async () => {
          // 1. Memory Check (L1) - We still keep this for sub-second protection
          const memoryCached = employerStatsMemoryCache.get(uid);
          if (memoryCached) {
            return memoryCached;
          }

          let totalAds = 0;
          let pendingAppsCount = 0;
          let totalViews = 0;
          let totalSpend = 0;
          let activePackage = "Nema paketa";
          let premiumAdsCount = 0;
          let lastPaymentAmount = 0;
          let lastPaymentAt = null;

          let allAds: DashboardAdItemDTO[] = [];
          let recentApplications: ApplicationItemDTO[] = [];
          let trends: DashboardTrendDTO[] = [];
          let isFirestoreHealthy = true;

          try {
            const { userStatsLoader } = await import("../../utils/dataloader.ts");
            const [statsDoc, adsResult, appsResult, trendsResult] = await Promise.allSettled([
              // 1. User Stats (Optimized via DataLoader)
              userStatsLoader.load(uid),
              // 2. Latest Listings
              db.collection("listings")
                .where("authorId", "==", uid)
                .where("status", "!=", "deleted")
                .orderBy("status", "asc")
                .orderBy("createdAt", "desc")
                .limit(10)
                .get(),
              // 3. Pending Applications
              db.collection("applications")
                .where("employerId", "==", uid)
                .where("status", "==", "pending")
                .orderBy("createdAt", "desc")
                .limit(5)
                .get(),
              // 4. Employer Trends
              this.getEmployerTrends(uid)
            ]);

            // Handle user_stats (Surgical Loader Pattern)
            if (statsDoc.status === "fulfilled" && statsDoc.value) {
              const statsData = statsDoc.value;
              totalAds = statsData?.activeAds || 0;
              pendingAppsCount = statsData?.pendingApplications || 0;
              totalViews = statsData?.totalViews || 0;
              totalSpend = statsData?.totalSpend || 0;
              activePackage = statsData?.activePackage || "Nema paketa";
              premiumAdsCount = statsData?.premiumAdsCount || statsData?.totalPremiumPurchases || 0;
              lastPaymentAmount = statsData?.lastPaymentAmount || 0;
              lastPaymentAt = statsData?.lastPaymentAt || null;
            } else if (statsDoc.status === "rejected") {
              logger.warn("[DashboardService] user_stats read failed:", (statsDoc as PromiseRejectedResult).reason?.message);
              isFirestoreHealthy = false;
            }

            if (adsResult.status === "fulfilled") {
              const adsDocs = adsResult.value.docs;
              
              allAds = adsDocs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  collType: data.type,
                  ...data,
                } as DashboardAdItemDTO;
              }).filter((ad) => ad.status !== "deleted").slice(0, 10);
            }

            // Handle applications
            if (appsResult.status === "fulfilled") {
              recentApplications = appsResult.value.docs.map((d) => {
                const data = d.data();
                return {
                  id: d.id,
                  ...data,
                } as ApplicationItemDTO;
              }).filter((a) => a.status === "pending").slice(0, 5);
            } else if (appsResult.status === "rejected") {
              logger.warn("[DashboardService] applications query failed:", appsResult.reason?.message);
            }

            // Handle trends
            if (trendsResult.status === "fulfilled") {
              trends = trendsResult.value as DashboardTrendDTO[];
            } else if (trendsResult.status === "rejected") {
              logger.warn("[DashboardService] trends load failed:", trendsResult.reason?.message);
            }
            
          } catch (err: unknown) {
            logger.warn("[DashboardService] Aggregate fetch failed critically:", err instanceof Error ? err.message : String(err));
            isFirestoreHealthy = false;
          }

          if (!isFirestoreHealthy) {
            logger.warn("[DashboardService] Firestore unhealthy, returning empty state.");
          }

          const res = {
            totalAds,
            pendingApplications: pendingAppsCount,
            totalViews,
            totalSpend,
            activePackage,
            premiumAdsCount,
            lastPaymentAmount,
            lastPaymentAt,
            recentAds: allAds
              .sort(
                (a, b) =>
                  ((b.createdAt as { _seconds?: number })?._seconds || 0) - ((a.createdAt as { _seconds?: number })?._seconds || 0),
              )
              .slice(0, 10),
            recentApplications,
            trends,
          };

          employerStatsMemoryCache.set(uid, res);
          return res;
        },
        EMPLOYER_STATS_TTL
      );

      return result;
    } catch (err) {
      console.error("Critical error in getEmployerStats:", err);
      return {
        totalAds: 0,
        pendingApplications: 0,
        totalViews: 0,
        recentAds: [],
        recentApplications: [],
        trends: []
      };
    }
  }

  static async getEmployerTrends(uid: string) {
    const cacheKey = CacheKeys.employerTrends(uid);
    const devTtl = env.NODE_ENV === "production" ? 15 * 60 * 1000 : 30 * 60 * 1000;

    try {
      const result = await CacheService.getOrSetSWR(
        cacheKey,
        async () => {
          // Optimization from PROMPT 7: Use profile metadata to skip sub-doc reads if trends are stable
          const memoryCached = employerTrendsMemoryCache.get(uid);
          
          const { userStatsLoader } = await import("../../utils/dataloader.ts");
          const stats = await userStatsLoader.load(uid);
          const lastUpdateRaw = (stats?.trendsLastUpdated || stats?.lastUpdated) as any;

          if (memoryCached && memoryCached.length > 0 && lastUpdateRaw) {
            const lastUpdateTime = typeof lastUpdateRaw === 'object' 
              ? (lastUpdateRaw.toMillis?.() || (lastUpdateRaw as any)._seconds * 1000) 
              : new Date(lastUpdateRaw as string | number).getTime();
            
            // Ako se trendovi nisu menjali u zadnja 24h, vraćamo keširanu verziju bez čitanja dokumenta
            if (Date.now() - lastUpdateTime > 24 * 60 * 60 * 1000) {
              return memoryCached;
            }
          }

          let history: Record<string, { prijave: number; pregledi: number }> = {};
          let isFirestoreHealthy = true;
          try {
            const historyDoc = await db.doc(`user_stats/${uid}/private/trends`).get();
            if (historyDoc.exists) {
              history = historyDoc.data()?.trend || {};
            }
          } catch (err: unknown) {
            logger.warn("[DashboardService] trends doc failed:", err instanceof Error ? err.message : String(err));
            isFirestoreHealthy = false;
          }

          const trend: Record<string, { prijave: number; pregledi: number }> = {
            ...history,
          };

          for (let i = 0; i < 14; i++) {
            const dStart = new Date();
            dStart.setDate(dStart.getDate() - (13 - i));
            const dateStr = dStart.toISOString().split("T")[0];

            if (!trend[dateStr]) {
              trend[dateStr] = {
                prijave: 0,
                pregledi: 0,
              };
            }
          }

          const sortedTrend = Object.keys(trend)
            .sort()
            .slice(-14)
            .map((date) => ({
              name: new Date(date).toLocaleDateString("sr-RS", {
                day: "2-digit",
                month: "2-digit",
              }),
              prijave: trend[date].prijave,
              pregledi: trend[date].pregledi,
            }));

          employerTrendsMemoryCache.set(uid, sortedTrend);
          return sortedTrend;
        },
        devTtl
      );

      return result;
    } catch (err) {
      console.error("Error in getEmployerTrends:", err);
      return [];
    }
  }
}
