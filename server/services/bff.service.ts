import { 
  Job, 
  Machine, 
  RealEstatePlot, 
  Accommodation, 
  CateringOffer 
} from "@svet-gradjevine/shared";
import { 
  HomepageStats, 
  AuthorSnapshot, 
  RawAdData, 
  MappedAdData, 
  HomepageDataResult,
  DashboardQuickMetrics,
  DashboardDataResult
} from "../types/bff.ts";
import { AuthUser } from "../types/auth.ts";
import { db, checkQuotaStatus } from "../config/firebase.ts";
import { AdminStatsService } from "./admin-stats.service.ts";
import { UnifiedAdsService } from "./unified-ads.service.ts";
import { UnifiedSearchService } from "./unified-search.service.ts";
import { DashboardService } from "./dashboard.service.ts";
import { JobTransformer, RawJobInput } from "../bff/job.transformer.ts";

const l1HomepageCache = new Map<string, { data: HomepageDataResult; expiry: number }>();
const L1_HOMEPAGE_TTL = 15 * 1000; // 15s in-memory Shield cache

const l1DashboardPrewarmCache = new Map<string, { data: any; expiry: number }>();
const L1_DASHBOARD_PREWARM_TTL = 15 * 1000; // 15s in-memory Shield cache

const withHomepageQueryTimeout = async <T>(
  promise: Promise<T> | T,
  ms: number,
  fallback: T,
): Promise<T> => {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      resolve(fallback);
    }, ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise])
    .catch((err) => {
      console.warn(`[BFF] Query failed or timeout: ${err.message}`);
      return fallback;
    })
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
    });
};

export const bffSingleFlightMap = new Map<string, Promise<DashboardDataResult>>();
const homepageSingleFlightMap = new Map<string, Promise<HomepageDataResult>>();

export const bffService = {
  async getHomepageData(platform: string): Promise<HomepageDataResult> {
    const cacheKey = `homepage_bff_${platform}_v4`;

    // 1. L1 Process Shield (Hard RAM Cache)
    const now = Date.now();
    const l1Cached = l1HomepageCache.get(cacheKey);
    if (l1Cached && now < l1Cached.expiry) {
      return l1Cached.data;
    }

    // 2. SingleFlight Implementation for Homepage
    if (homepageSingleFlightMap.has(cacheKey)) {
      console.log(`✈️ [SingleFlight] Coalescing concurrent homepage request: ${cacheKey}`);
      return homepageSingleFlightMap.get(cacheKey) as Promise<HomepageDataResult>;
    }

    const fetchTask = (async () => {
      const { CacheService } = await import("./cache.service.ts");
      return await CacheService.getOrSetSWR<HomepageDataResult>(
        cacheKey,
        async (): Promise<HomepageDataResult> => {
          const bffSubTimeoutMs = 3000;

          const [
            globalStats,
            premiumAdsData,
            urgentAdsData,
            machinesData,
            realEstateData,
            accommodationsData,
            cateringsData,
          ] = await Promise.allSettled([
            withHomepageQueryTimeout(
              AdminStatsService.getGlobalStats(),
              bffSubTimeoutMs,
              {},
            ),
            withHomepageQueryTimeout(
              UnifiedAdsService.getPromotedAds({ isPremium: true, limit: 12 }),
              bffSubTimeoutMs,
              [],
            ),
            withHomepageQueryTimeout(
              UnifiedAdsService.getPromotedAds({ isUrgent: true, limit: 12 }),
              bffSubTimeoutMs,
              [],
            ),
            withHomepageQueryTimeout(
              UnifiedSearchService.search(
                "machines",
                { status: "active", skipCount: true },
                2,
              ),
              bffSubTimeoutMs,
              { docs: [], lastVisibleId: null, hasMore: false },
            ),
            withHomepageQueryTimeout(
              UnifiedSearchService.search(
                "realEstate",
                { status: "active", skipCount: true },
                2,
              ),
              bffSubTimeoutMs,
              { docs: [], lastVisibleId: null, hasMore: false },
            ),
            withHomepageQueryTimeout(
              UnifiedSearchService.search(
                "accommodations",
                { status: "active", skipCount: true },
                3,
              ),
              bffSubTimeoutMs,
              { docs: [], lastVisibleId: null, hasMore: false },
            ),
            withHomepageQueryTimeout(
              UnifiedSearchService.search(
                "caterings",
                { status: "active", skipCount: true },
                3,
              ),
              bffSubTimeoutMs,
              { docs: [], lastVisibleId: null, hasMore: false },
            ),
          ]);

          const gStats = (
            globalStats.status === "fulfilled" ? globalStats.value : {}
          ) as {
            totalJobs?: number,
            machinesCount?: number,
            accommodationsCount?: number,
            cateringCount?: number,
            realEstateCount?: number,
            companiesCount?: number,
            premiumPartners?: number,
            urgentAds?: number
          };

          const totalJobs = gStats.totalJobs || 0;
          const totalMachines = gStats.machinesCount || 0;
          const totalAccommodations = gStats.accommodationsCount || 0;
          const totalCaterings = gStats.cateringCount || 0;

          const calculatedAdsCount =
            totalJobs +
            totalMachines +
            totalAccommodations +
            totalCaterings +
            120;

          const stats: HomepageStats = {
            totalJobs,
            totalMachines,
            totalAccommodations,
            totalCaterings,
            totalRealEstate: gStats.realEstateCount || 0,
            totalCompanies: gStats.companiesCount || 0,
            premiumJobs: gStats.premiumPartners || 150,
            urgentJobs: gStats.urgentAds || 45,
            totalAdsCount: calculatedAdsCount,
            dynamicFirmsCount: 450 + Math.floor(totalJobs / 2),
            dynamicWorkersCount: 12500 + totalJobs * 10,
            dynamicMachineryCount: 800 + totalMachines,
            dynamicRealEstateCount: 300 + totalAccommodations,
            dynamicViewsCount: 850000 + calculatedAdsCount * 12,
          };

          const premiumJobsRaw =
            premiumAdsData.status === "fulfilled" && premiumAdsData.value
              ? (premiumAdsData.value as RawAdData[])
              : [];
          const urgentJobsRaw =
            urgentAdsData.status === "fulfilled" && urgentAdsData.value
              ? (urgentAdsData.value as RawAdData[])
              : [];

          const urgentJobsMap = (ad: RawAdData): MappedAdData => ({
            ...ad,
            title: ad.title || ad.name || "Oglas",
            loc:
              ad.loc ||
              (ad.location && typeof ad.location === "object" && "address" in ad.location ? (ad.location as { address?: string }).address : undefined) ||
              (typeof ad.location === "string" ? ad.location : undefined) ||
              ad.grad ||
              "Srbija",
            salary: ad.salary || ad.price || ad.sal || null,
            comp:
              ad.comp ||
              ad.authorSnapshot?.companyName ||
              ad.authorSnapshot?.displayName ||
              "Korisnik",
            logo: ad.logo || ad.images?.[0] || ad.authorSnapshot?.photoURL || "",
          } as MappedAdData);

          let urgentJobs: MappedAdData[] = urgentJobsRaw.map(urgentJobsMap);
          let premiumJobs: MappedAdData[] = premiumJobsRaw.map(urgentJobsMap);

          if (platform === "mobile") {
            premiumJobs = premiumJobs.map((job) =>
              JobTransformer.toMobile(job as unknown as RawJobInput),
            ) as unknown as MappedAdData[];
            urgentJobs = urgentJobs.map((job) =>
              JobTransformer.toMobile(job as unknown as RawJobInput),
            ) as unknown as MappedAdData[];
          } else {
            premiumJobs = premiumJobs.map((job) =>
              JobTransformer.toWeb(job),
            ) as unknown as MappedAdData[];
            urgentJobs = urgentJobs.map((job) => JobTransformer.toWeb(job)) as unknown as MappedAdData[];
          }

          const buildMappedDocs = <T>(dataResult: PromiseSettledResult<unknown>): T[] => {
            if (dataResult.status === "fulfilled" && dataResult.value && typeof dataResult.value === "object" && "docs" in (dataResult.value as object)) {
              return (dataResult.value as { docs: T[] }).docs;
            }
            return [];
          };

          const latestMachines = buildMappedDocs<Machine>(machinesData);
          const latestRealEstate = buildMappedDocs<RealEstatePlot>(realEstateData);
          const latestAccommodations = buildMappedDocs<Accommodation>(accommodationsData);
          const latestCaterings = buildMappedDocs<CateringOffer>(cateringsData);
          const latestArticles: any[] = [];

          return {
            success: true,
            stats,
            premiumJobs,
            urgentJobs,
            latestMachines,
            latestRealEstate,
            latestAccommodations,
            latestCaterings,
            latestArticles,
          };
        },
        900000,
        {
          success: true,
          stats: {
            totalJobs: 0,
            totalMachines: 0,
            totalAccommodations: 0,
            totalCaterings: 0,
            totalRealEstate: 0,
            totalCompanies: 0,
            premiumJobs: 0,
            urgentJobs: 0,
            totalAdsCount: 0,
            dynamicFirmsCount: 0,
            dynamicWorkersCount: 0,
            dynamicMachineryCount: 0,
            dynamicRealEstateCount: 0,
            dynamicViewsCount: 0,
          },
          premiumJobs: [],
          urgentJobs: [],
          latestMachines: [],
          latestRealEstate: [],
          latestAccommodations: [],
          latestCaterings: [],
          latestArticles: [],
        },
      );
    })();

    homepageSingleFlightMap.set(cacheKey, fetchTask);
    try {
      const result = await fetchTask;
      if (result) {
        l1HomepageCache.set(cacheKey, {
          data: result,
          expiry: Date.now() + L1_HOMEPAGE_TTL,
        });
      }
      return result;
    } finally {
      homepageSingleFlightMap.delete(cacheKey);
    }
  },

  async getDashboardMetrics(userId: string): Promise<DashboardQuickMetrics> {
    const { CacheService } = await import("./cache.service.ts");
    const cacheKey = `dashboard_metrics:${userId}`;

    return await CacheService.getOrSetSWR<DashboardQuickMetrics>(
      cacheKey,
      async (): Promise<DashboardQuickMetrics> => {
        if (checkQuotaStatus()) {
          throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
        }

        const { internalUserLoader } = await import("../utils/dataloader.ts");
        const fetchLogicPromise = Promise.all([
          internalUserLoader.load(userId)
        ]);

        const walletCacheKey = `wallet_dashboard:${userId}`;
        let walletData: { balance: number; lastAuditPassed: boolean; activeRoles?: string[] } | null = await CacheService.get(walletCacheKey);

        if (!walletData) {
          const walletUserCacheKey = `bff_wallet_user:${userId}`;
          const cachedWalletUser = await CacheService.getOrSet<{ wallet: any; user: any }>(
            walletUserCacheKey,
            async () => {
              const [walletDoc, userDoc] = await Promise.all([
                db.collection("wallets").doc(userId).get(),
                internalUserLoader.load(userId),
              ]);
              return {
                wallet: walletDoc.exists ? walletDoc.data() : null,
                user: userDoc || null,
              };
            },
            5 * 60 * 1000 // 5 minuta TTL
          );

          const { wallet, user } = cachedWalletUser || { wallet: null, user: null };
          const uData = user || {};
          let fetchedRoles: string[] = [];
          if (uData.roles && Array.isArray(uData.roles)) {
             fetchedRoles = uData.roles;
          } else if (uData.role) {
             fetchedRoles = [uData.role];
          }
          
          walletData = {
            balance: wallet ? (wallet.balance || 0) : 0,
            lastAuditPassed: wallet ? (wallet.lastAuditPassed === true) : false,
            activeRoles: fetchedRoles
          };
          await CacheService.set(walletCacheKey, walletData, 86400000); // 24h fallback cache
        }
        
        let userData: { totalUnreadMessages?: number; stats?: { totalMyAds?: number; unreadMessages?: number; unreadActivities?: number } } | null = null;
        
        const result = await fetchLogicPromise;
        userData = result[0] as { totalUnreadMessages?: number; stats?: { totalMyAds?: number; unreadMessages?: number; unreadActivities?: number } } | null;

        let myAdsCount = 0;
        let unreadMessagesCount = 0;
        let unreadActivitiesCount = 0;
        let walletBalance = walletData.balance;
        let walletVerified = walletData.lastAuditPassed;
        let activeRoles: string[] = walletData.activeRoles || [];

        if (userData) {
          const stats = userData.stats || {};
          myAdsCount = stats.totalMyAds || 0;
          unreadMessagesCount = userData.totalUnreadMessages ?? stats.unreadMessages ?? 0;
          unreadActivitiesCount = stats.unreadActivities || 0;
        }

        // Wallet data already loaded via cache above

        return {
          myAdsCount,
          unreadMessagesCount,
          unreadActivitiesCount,
          walletBalance,
          walletVerified,
          activeRoles,
          serverTime: new Date().toISOString(),
        } as DashboardQuickMetrics & { activeRoles?: string[] };
      },
      300000,
      {
        myAdsCount: 0,
        unreadMessagesCount: 0,
        unreadActivitiesCount: 0,
        walletBalance: 0,
        walletVerified: false,
        serverTime: new Date().toISOString(),
        _circuit: "OPEN"
      }
    );
  },

  async getDashboardData(
    userId: string,
    role: string,
    isAdmin: boolean,
    reqUser: AuthUser,
    cacheControlHeader?: string
  ): Promise<DashboardDataResult> {
    const cacheKey = `bff_cache_tiered:${userId}:${role}`;
    const flightKey = `${userId}:${role}`;

    const { checkQuotaStatus } = await import("../config/firebase.ts");
    if (checkQuotaStatus()) {
      return {
        success: true,
        _degraded: true,
        stats: {
          activeAds: 0,
          pendingAds: 0,
          totalViews: 0,
          applicationsCount: 0,
          recentAds: [],
          recentApplications: [],
          totalAdsCount: 0,
          totalUsers: 0
        },
        recentActivities: [],
        myAds: [],
        trends: []
      };
    }

    if (bffSingleFlightMap.has(flightKey)) {
      return bffSingleFlightMap.get(flightKey) as Promise<DashboardDataResult>;
    }

    const logicPromise = (async () => {
      const { CacheService } = await import("./cache.service.ts");
      const walletUserCacheKey = `bff_wallet_user:${userId}`;
      const walletUserData = await CacheService.getOrSet<{ wallet: any; user: any }>(
        walletUserCacheKey,
        async () => {
          const { internalUserLoader } = await import("../utils/dataloader.ts");
          const [walletDoc, userDoc] = await Promise.all([
            db.collection("wallets").doc(userId).get(),
            internalUserLoader.load(userId),
          ]);
          return {
            wallet: walletDoc.exists ? walletDoc.data() : null,
            user: userDoc || null,
          };
        },
        5 * 60 * 1000 // 5 minuta TTL
      );

      const fetchLogic = async (): Promise<DashboardDataResult> => {
        if (checkQuotaStatus()) throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");

        try {
          const matchedProfile = walletUserData?.user
            ? { uid: userId, location: walletUserData.user.location || "Beograd", profession: walletUserData.user.profession || "Sve" }
            : reqUser;

          const { getRedis } = await import("../utils/redis.ts");
          const redis = getRedis();
          const prewarmKey = `dashboard_stats_prewarm:${userId}:${role}`;
          let baseData: any = null;

          // 1. Check L1 Memory Cache first
          const now = Date.now();
          const l1PrewarmCached = l1DashboardPrewarmCache.get(prewarmKey);
          if (l1PrewarmCached && now < l1PrewarmCached.expiry) {
            baseData = l1PrewarmCached.data;
            console.log(`[BFF L1 Prewarm] Served pre-calculated stats from L1 RAM cache: ${prewarmKey}`);
          }

          if (!baseData && redis) {
            try {
              const cachedStr = await redis.get(prewarmKey);
              if (cachedStr) {
                baseData = JSON.parse(cachedStr);
                console.log(`[BFF Prewarm] Served pre-calculated dashboard stats from ${prewarmKey}`);
                
                // Write into L1 cache for extremely fast subsequent reads
                l1DashboardPrewarmCache.set(prewarmKey, {
                  data: baseData,
                  expiry: Date.now() + L1_DASHBOARD_PREWARM_TTL,
                });
              }
            } catch (err) {
              console.warn("[BFF Prewarm] Failed to read prewarm stats from Redis:", err);
            }
          }

          if (!baseData) {
            baseData = await DashboardService.aggregateDashboardData(
              userId,
              role,
              isAdmin,
              matchedProfile,
            );

            if (redis) {
              try {
                await redis.set(prewarmKey, JSON.stringify(baseData), "EX", 10 * 60); // 10 minutes TTL
              } catch (err) {
                console.warn("[BFF Prewarm] Failed to write prewarm stats to Redis:", err);
              }
            }

            // Write into L1 cache
            l1DashboardPrewarmCache.set(prewarmKey, {
              data: baseData,
              expiry: Date.now() + L1_DASHBOARD_PREWARM_TTL,
            });
          }

          if (baseData && typeof baseData === "object" && "stats" in baseData && baseData.stats) {
            const statsObj = baseData.stats as Record<string, unknown>;
            delete statsObj.unreadActivities;
            delete statsObj.walletBalance;
            if (walletUserData?.wallet) {
              statsObj.walletBalance = walletUserData.wallet.balance || 0;
            }
          }

          return baseData as DashboardDataResult;
        } catch (dbErr: unknown) {
          const { triggerQuotaProtection } = await import("../config/firebase.ts");
          triggerQuotaProtection(dbErr as Error);
          throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
        }
      };

      if (cacheControlHeader === "no-cache") {
        const newData = await fetchLogic();
        await CacheService.set(cacheKey, newData, 300000);
        return newData;
      }

      return await CacheService.getOrSetSWR<DashboardDataResult>(
        cacheKey,
        fetchLogic,
        300000
      );
    })();

    bffSingleFlightMap.set(flightKey, logicPromise);
    try {
      return await logicPromise;
    } finally {
      bffSingleFlightMap.delete(flightKey);
    }
  }
};
