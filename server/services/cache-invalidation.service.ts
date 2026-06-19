import { CacheService } from "./cache.service.ts";
import { CACHE_PREFIXES } from "../constants/cache-keys.ts";

/**
 * Centralizovani servis za cache invalidation.
 * Business logika ne zna za Redis ključeve — samo kaže "oglas je promenjen".
 * Ova klasa mapira domenske dogadjaje u konkretne cache prefikse.
 */
export class CacheInvalidationService {

  static async onAdChange(category: string, uid: string): Promise<void> {
    const prefixes = [
      CACHE_PREFIXES.MY_ADS + uid,
      CACHE_PREFIXES.PUBLIC_PROFILE_ADS + uid,
      CACHE_PREFIXES.PROMOTED,
      CACHE_PREFIXES.PUBLIC_ADS,
      CACHE_PREFIXES.SEARCH_ADS,
      CACHE_PREFIXES.ADMIN_MODERATION_QUEUE,
      CACHE_PREFIXES.ADMIN_GLOBAL_STATS,
      CACHE_PREFIXES.ADMIN_CHART_DATA,
    ];

    if (category === "jobs") {
      prefixes.push(
        CACHE_PREFIXES.PUBLIC_JOBS,
        CACHE_PREFIXES.HOMEPAGE_PREMIUM_JOBS,
        CACHE_PREFIXES.HOMEPAGE_URGENT_JOBS,
        CACHE_PREFIXES.UNIFIED_SEARCH_JOB,
      );
    }

    prefixes.push(CACHE_PREFIXES.UNIFIED_SEARCH);
    prefixes.push(CACHE_PREFIXES.FALLBACK_SEARCH);

    await CacheService.invalidateByPrefixes(prefixes).catch((err) =>
      console.error("[CacheInvalidation] onAdChange error:", err)
    );

    // Also clear employer stats for this user in background
    try {
      const { DashboardService } = await import("../services/dashboard.service.ts");
      DashboardService.clearEmployerStatsCache(uid).catch(() => {});
    } catch {
      // ignore dynamic import error
    }
  }

  static async onJobChange(uid: string): Promise<void> {
    const prefixes = [
      CACHE_PREFIXES.PUBLIC_JOBS,
      CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.PUBLIC_JOBS,
      CACHE_PREFIXES.HOMEPAGE_PREMIUM_JOBS,
      CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.HOMEPAGE_PREMIUM_JOBS,
      CACHE_PREFIXES.HOMEPAGE_URGENT_JOBS,
      CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.HOMEPAGE_URGENT_JOBS,
      CACHE_PREFIXES.MY_ADS + uid,
      CACHE_PREFIXES.PUBLIC_PROFILE_ADS + uid,
      CACHE_PREFIXES.ADMIN_GLOBAL_STATS,
      CACHE_PREFIXES.ADMIN_CHART_DATA,
    ];

    await CacheService.invalidateByPrefixes(prefixes).catch((err) =>
      console.error("[CacheInvalidation] onJobChange error:", err)
    );
  }

  static async onAdminAdModeration(category: string): Promise<void> {
    const prefixes = [
      CACHE_PREFIXES.ADMIN_MODERATION_QUEUE,
      CACHE_PREFIXES.PUBLIC_ADS,
      CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.PUBLIC_ADS,
      CACHE_PREFIXES.ADMIN_GLOBAL_STATS,
      CACHE_PREFIXES.ADMIN_CHART_DATA,
    ];

    if (category === "jobs") {
      prefixes.push(
        CACHE_PREFIXES.PUBLIC_JOBS,
        CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.PUBLIC_JOBS,
        CACHE_PREFIXES.HOMEPAGE_PREMIUM_JOBS,
        CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.HOMEPAGE_PREMIUM_JOBS,
        CACHE_PREFIXES.HOMEPAGE_URGENT_JOBS,
        CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.HOMEPAGE_URGENT_JOBS,
        CACHE_PREFIXES.UNIFIED_SEARCH,
        CACHE_PREFIXES.FALLBACK_SEARCH,
      );
    }

    await CacheService.invalidateByPrefixes(prefixes).catch((err) =>
      console.error("[CacheInvalidation] onAdminAdModeration error:", err)
    );
  }

  static async onUserProfileChange(uid: string): Promise<void> {
    await CacheService.invalidateByPrefixes([
      CACHE_PREFIXES.USER_PROFILE_CACHE + uid,
      CACHE_PREFIXES.AUTH_SESSION + uid,
    ]).catch((err) =>
      console.error("[CacheInvalidation] onUserProfileChange error:", err)
    );
  }

  static async onSettingsChange(): Promise<void> {
    await CacheService.invalidateByPrefix(CACHE_PREFIXES.SETTINGS_SWR).catch((err) =>
      console.error("[CacheInvalidation] onSettingsChange error:", err)
    );
  }

  static async onMagazineChange(): Promise<void> {
    await CacheService.invalidateByPrefix(CACHE_PREFIXES.MAGAZINE_LIST).catch((err) =>
      console.error("[CacheInvalidation] onMagazineChange error:", err)
    );
  }
}
