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
import { db } from "../config/firebase.ts";
import { AdminStatsService } from "./admin/admin-stats.service.ts";
import { UnifiedAdsService } from "./unified-ads.service.ts";
import { UnifiedSearchService } from "./unified-search.service.ts";
import { DashboardService } from "./dashboard/dashboard.service.ts";
import { JobTransformer, RawJobInput } from "../bff/job.transformer.ts";


const l1HomepageCache = new Map<string, { data: HomepageDataResult; expiry: number }>();
const L1_HOMEPAGE_TTL = 30_000; // 30s in-memory cache

export function clearL1HomepageCache() {
  l1HomepageCache.clear();
}

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

export const bffService = {
  async getHomepageData(platform: string): Promise<HomepageDataResult> {
    const cacheKey = `homepage_bff_${platform}_v8`;

    const now = Date.now();
    const l1Cached = l1HomepageCache.get(cacheKey);
    if (l1Cached && now < l1Cached.expiry) {
      return l1Cached.data;
    }

    // Redis keš (5 min) — instant posle prvog učitavanja
    try {
      const { CacheService } = await import("./cache.service.ts");
      const redisCached = await CacheService.get<HomepageDataResult>(cacheKey);
      if (redisCached) {
        l1HomepageCache.set(cacheKey, { data: redisCached, expiry: Date.now() + L1_HOMEPAGE_TTL });
        return redisCached;
      }
    } catch {}

    const [
      globalStats,
      premiumAdsData,
      urgentAdsData,
      machinesData,
      realEstateData,
      accommodationsData,
      cateringsData,
      jobsData,
    ] = await Promise.allSettled([
      withTimeout(AdminStatsService.getGlobalStats(), 120000, {}),
      withTimeout(UnifiedAdsService.getPromotedAds({ isPremium: true, limit: 12 }), 120000, []),
      withTimeout(UnifiedAdsService.getPromotedAds({ isUrgent: true, limit: 12 }), 120000, []),
      withTimeout(UnifiedSearchService.search("machines", { status: "active", skipCount: true }, 2), 120000, { docs: [], lastVisibleId: null, hasMore: false }),
      withTimeout(UnifiedSearchService.search("realEstate", { status: "active", skipCount: true }, 2), 120000, { docs: [], lastVisibleId: null, hasMore: false }),
      withTimeout(UnifiedSearchService.search("accommodations", { status: "active", skipCount: true }, 3), 120000, { docs: [], lastVisibleId: null, hasMore: false }),
      withTimeout(UnifiedSearchService.search("caterings", { status: "active", skipCount: true }, 3), 120000, { docs: [], lastVisibleId: null, hasMore: false }),
      withTimeout(UnifiedSearchService.search("jobs", { status: "active", skipCount: true }, 5), 120000, { docs: [], lastVisibleId: null, hasMore: false }),
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
      totalUsers?: number,
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
      totalCaterings;

    const stats: HomepageStats = {
      totalJobs,
      totalMachines,
      totalAccommodations,
      totalCaterings,
      totalRealEstate: gStats.realEstateCount || 0,
      totalCompanies: gStats.companiesCount || 0,
      totalUsers: gStats.totalUsers || 0,
      premiumJobs: gStats.premiumPartners || 0,
      urgentJobs: gStats.urgentAds || 0,
      totalAdsCount: calculatedAdsCount,
      dynamicFirmsCount: gStats.companiesCount || 0,
      dynamicWorkersCount: gStats.totalUsers || 0,
      dynamicMachineryCount: gStats.machinesCount || 0,
      dynamicRealEstateCount: gStats.realEstateCount || 0,
      dynamicViewsCount: 0,
    };

    let premiumJobsRaw: RawAdData[] =
      premiumAdsData.status === "fulfilled" && premiumAdsData.value
        ? (premiumAdsData.value as RawAdData[])
        : [];

    if (!premiumJobsRaw.length) {
      try {
        const snap = await db.collectionGroup("listings")
          .where("status", "==", "active")
          .where("isPremium", "==", true)
          .orderBy("createdAt", "desc")
          .limit(12)
          .get();
        if (!snap.empty) {
          premiumJobsRaw = snap.docs.map((doc) => {
            const d = doc.data();
            return { id: doc.id, ...d, createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt };
          }) as RawAdData[];
        }
      } catch {}
    }

    let urgentJobsRaw: RawAdData[] =
      urgentAdsData.status === "fulfilled" && urgentAdsData.value
        ? (urgentAdsData.value as RawAdData[])
        : [];

    if (!urgentJobsRaw.length) {
      try {
        const snap = await db.collectionGroup("listings")
          .where("status", "==", "active")
          .where("isUrgent", "==", true)
          .orderBy("createdAt", "desc")
          .limit(12)
          .get();
        if (!snap.empty) {
          urgentJobsRaw = snap.docs.map((doc) => {
            const d = doc.data();
            return { id: doc.id, ...d, createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt };
          }) as RawAdData[];
        }
      } catch {}
    }

    const urgentJobsMap = (ad: RawAdData): MappedAdData => ({
      ...(ad as any),
      id: ad.id,
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

    const snippet = <T extends Record<string, unknown>>(entity: T, fields: (keyof T)[]): Record<string, unknown> => {
      const s: Record<string, unknown> = {};
      for (const f of fields) {
        if (f in entity) s[f as string] = entity[f];
      }
      return s;
    };

    const latestMachines = buildMappedDocs<Record<string, unknown>>(machinesData).map((m) =>
      snippet(m, ["id", "title", "images", "listingType", "yearOfManufacture", "workingHours", "location", "price"])
    );
    const latestRealEstate = buildMappedDocs<Record<string, unknown>>(realEstateData).map((p) =>
      snippet(p, ["id", "title", "images", "listingType", "isPremium", "location", "area", "price"])
    );
    const latestAccommodations = buildMappedDocs<Record<string, unknown>>(accommodationsData).map((a) =>
      snippet(a, ["id", "title", "images", "location", "capacity", "rooms", "bathrooms", "hasKitchen", "price"])
    );
    const latestCaterings = buildMappedDocs<Record<string, unknown>>(cateringsData).map((c) =>
      snippet(c, ["id", "title", "companyName", "images", "imagePlaceholders", "location", "price", "mealPrice", "deliveryRadius", "minOrderValue", "maxMealsPerDay"])
    );
    const latestJobs = buildMappedDocs<Record<string, unknown>>(jobsData).map((j) =>
      snippet(j, [
        "id", "title", "images", "createdAt", "typeSlug", "isPremium", "isUrgent",
        "loc", "location",
        "sal", "salary", "plataMin", "plataMax", "salaryType",
        "comp", "company", "companyName", "companyId", "isCompanyVerified",
        "logo", "logoPlaceholder", "authorName",
        "benefits", "benefiti", "rawBenefits",
        "smestaj", "prevoz", "hrana", "housing", "transport", "food", "topliObrok",
        "viewsCount", "cat", "status"
      ])
    );
    const latestArticles: any[] = [];

    const result: HomepageDataResult = {
      success: true,
      stats,
      premiumJobs,
      urgentJobs,
      latestMachines,
      latestRealEstate,
      latestAccommodations,
      latestCaterings,
      latestJobs,
      latestArticles,
    };

    if (result.latestJobs && result.latestJobs.length > 0) {
      l1HomepageCache.set(cacheKey, {
        data: result,
        expiry: Date.now() + L1_HOMEPAGE_TTL,
      });
      try {
        const { CacheService } = await import("./cache.service.ts");
        await CacheService.set(cacheKey, result, 300000).catch(() => {});
      } catch {}
    }

    return result;
  },

  async getDashboardMetrics(userId: string): Promise<DashboardQuickMetrics> {
    const { CacheService } = await import("./cache.service.ts");
    const cacheKey = `dashboard_metrics:${userId}`;

    return await CacheService.getOrSetSWR<DashboardQuickMetrics>(
      cacheKey,
      async (): Promise<DashboardQuickMetrics> => {
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
            balance: wallet ? (wallet.balance || 0) : (uData.walletBalance || 0),
            lastAuditPassed: wallet ? (wallet.lastAuditPassed === true) : false,
            activeRoles: fetchedRoles
          };
          await CacheService.set(walletCacheKey, walletData, 300000); // 5min fallback cache
        }
        
        let userData: { totalUnreadMessages?: number; stats?: { totalMyAds?: number; unreadMessages?: number; unreadActivities?: number } } | null = null;
        
        const result = await fetchLogicPromise;
        userData = result[0] as { totalUnreadMessages?: number; stats?: { totalMyAds?: number; unreadMessages?: number; unreadActivities?: number } } | null;

        let myAdsCount = 0;
        let unreadMessagesCount = 0;
        let unreadActivitiesCount = 0;
        const walletBalance = walletData.balance;
        const walletVerified = walletData.lastAuditPassed;
        const activeRoles: string[] = walletData.activeRoles || [];

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
      5 * 60 * 1000
    );

    const fetchLogic = async (): Promise<DashboardDataResult> => {
      try {
        const matchedProfile = walletUserData?.user
          ? { uid: userId, location: walletUserData.user.location || "Beograd", profession: walletUserData.user.profession || "Sve" }
          : reqUser;

        const baseData = await DashboardService.aggregateDashboardData(
          userId,
          role,
          isAdmin,
          matchedProfile,
        );

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
  }
};
