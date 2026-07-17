import { db } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { DynamicConfigService } from "../dynamic-config.service.ts";
import { QueueService, JobType, JobPriority } from "../queue.service.ts";
import { CacheService } from "../cache.service.ts";
import { runPendingMigrations } from "../migration.service.ts";
import { logger } from "../../utils/logger.ts";

export class AdminSettingsService {
  private static readonly DEFAULTS: Record<string, any> = {
    branding: {
      heroTitle: "OSNAŽUJEMO GRAĐEVINSKU INDUSTRIJU",
      heroSubtitle: "Povezujemo profesionalce i klijente širom regiona.",
      primaryColor: "#0f172a",
      secondaryColor: "#3b82f6"
    },
    global: {
      pricing: {
        jobs: { standard: 1000, premium: 2000, urgent: 4000 },
        marketplace: { standard: 1000, premium: 2000, urgent: 4000 },
        machines: { standard: 1000, premium: 2000, urgent: 4000 }
      },
      limits: { max_images_per_ad: 10 },
      messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
      globalRateLimit: 100
    },
    platform: {}
  };

  static async runMigrations() {
    return runPendingMigrations();
  }

  static async reindexAll(adminId: string) {
    const collections = [
      "jobs",
      "machines",
      "accommodations",
      "caterings",
      "plots",
      "companies",
      "masters",
    ];

    for (const coll of collections) {
      await QueueService.addJob(
        JobType.SYNC_COLLECTION,
        {
          targetId: "ALL",
          collection: coll,
          type: "FULL_REINDEX",
        },
        { priority: JobPriority.LOW },
      );
    }

    await AuditService.logAction(
      adminId,
      AuditAction.CONFIG_CHANGED,
      "system",
      "algolia",
      { action: "FULL_REINDEX" },
    );

    return { success: true, message: "Re-index triggered in background" };
  }

  static async updateSettings(type: string, updates: any, adminId: string) {
    await db.collection("settings").doc(type).set(updates, { merge: true });

    // Invalidate Cache for this setting
    await CacheService.delete(`settings_swr_${type}`);

    // Sync with DynamicConfigService if global settings changed
    if (type === "global") {
      try {
        if (updates.globalRateLimit !== undefined) {
          await DynamicConfigService.set(
            "globalRateLimit",
            updates.globalRateLimit,
          );
        }

        if ((updates.messages as { maintenance_mode?: boolean })?.maintenance_mode !== undefined) {
          await DynamicConfigService.set(
            "isMaintenanceMode",
            (updates.messages as { maintenance_mode: boolean }).maintenance_mode,
          );
        }
      } catch (err) {
        console.error("[AdminSettingsService] DynamicConfigService sync failed (non-blocking):", err);
      }
    }

    await AuditService.logAction(
      adminId,
      AuditAction.CONFIG_CHANGED,
      "settings",
      type,
      { updates },
    );

    return { success: true };
  }

  static async prewarm() {
    console.info("🔥 [AdminSettingsService] Pre-warming branding and global settings...");
    const types = ["branding", "global", "platform"];
    for (const type of types) {
      const cacheKey = `settings_swr_${type}`;
      const cached = await CacheService.get(cacheKey).catch(() => null);
      if (!cached) {
        await CacheService.set(cacheKey, this.DEFAULTS[type] || {}, 15 * 60 * 1000).catch(() => {});
      }
    }
    // Background refresh — ne blokira startup
    Promise.allSettled(
      types.map(type => this.getSettings(type).catch(() => {}))
    ).then(() => console.info("✅ [AdminSettingsService] Pre-warm complete."));
  }

  static async getSettings(type: string) {
    const cacheKey = `settings_swr_${type}`;

    return await CacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          const doc = await db.collection("settings").doc(type).get();
          if (doc.exists && doc.data && doc.data()) {
            const data = doc.data();
            if (type === "global") {
              return {
                ...this.DEFAULTS.global,
                pricing: { ...this.DEFAULTS.global.pricing, ...data?.pricing },
                limits: { ...this.DEFAULTS.global.limits, ...data?.limits },
                messages: { ...this.DEFAULTS.global.messages, ...data?.messages },
                globalRateLimit: data?.globalRateLimit ?? this.DEFAULTS.global.globalRateLimit
              };
            }
            if (type === "branding") {
              return { ...this.DEFAULTS.branding, ...data };
            }
            return data;
          }
          return this.DEFAULTS[type] || {};
        } catch (error: any) {
          const err = error as Error & { details?: string; code?: number };
          if (
            err?.message?.includes("Quota limit exceeded") ||
            err?.details?.includes("Quota limit exceeded") ||
            err?.message?.includes("Trip Circuit Breaker") ||
            err?.code === 4 ||
            err?.code === 8
          ) {
            logger.warn(`[AdminSettingsService] Quota/Timeout fetching settings ${type}. Returning fallback.`);
            throw new Error("QUOTA_EXHAUSTED");
          }
          throw error;
        }
      },
      15 * 60 * 1000
    );
  }
}
