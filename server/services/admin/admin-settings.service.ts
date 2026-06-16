import { db } from "../../config/firebase.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { DynamicConfigService } from "../dynamic-config.service.ts";
import { QueueService, JobType, JobPriority } from "../queue.service.ts";
import { CacheService } from "../cache.service.ts";
import { runPendingMigrations } from "../migration.service.ts";

export class AdminSettingsService {
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
    console.log("🔥 [AdminSettingsService] Pre-warming branding and global settings...");
    try {
      await Promise.allSettled([
        this.getSettings("branding"),
        this.getSettings("global"),
        this.getSettings("platform")
      ]);
      console.log("✅ [AdminSettingsService] Pre-warm complete.");
    } catch (err) {
      console.error("❌ [AdminSettingsService] Pre-warm failed (non-blocking):", err);
    }
  }

  static async getSettings(type: string) {
    const cacheKey = `settings_swr_${type}`;
    const timeoutMs = type === "branding" ? 2000 : 10000;

    return await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        try {
          if (type === "branding") {
            const doc = await db.collection("settings").doc("branding").get();
            if (doc.exists) return doc.data();
            return {
              heroTitle: "OSNAŽUJEMO GRAĐEVINSKU INDUSTRIJU",
              heroSubtitle: "Povezujemo profesionalce i klijente širom regiona.",
              primaryColor: "#0f172a",
              secondaryColor: "#3b82f6"
            };
          }

          const doc = await db.collection("settings").doc(type).get();
          console.log("AdminSettings doc:", type, "exists:", doc.exists, "data:", doc.data?.());
          if (doc.exists && doc.data && doc.data()) {
             const data = doc.data();
               if (type === "global") {
                  return {
                     pricing: {
                        jobs: { standard: 500, premium: 1000, urgent: 1500 },
                        accommodations: { standard: 500, premium: 1000, urgent: 1500 },
                        caterings: { standard: 500, premium: 1000, urgent: 1500 },
                        marketplace: { standard: 500, premium: 1000, urgent: 1500 },
                        machines: { standard: 500, premium: 1000, urgent: 1500 },
                        plots: { standard: 500, premium: 1000, urgent: 1500 },
                        professional_monthly: 6000,
                        ...data?.pricing
                     },
                    limits: { free_listings_per_month: 3, max_images_per_ad: 10, ...data?.limits },
                    messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false, ...data?.messages },
                    globalRateLimit: data?.globalRateLimit || 100,
                    initialCredits: data?.initialCredits !== undefined ? data.initialCredits : 1500
                 };
              }
              return data;
           }
           if (type === "branding") return { 
             heroTitle: "OSNAŽUJEMO GRAĐEVINSKU INDUSTRIJU",
             heroSubtitle: "Povezujemo profesionalce i klijente širom regiona.",
             primaryColor: "#0f172a",
             secondaryColor: "#3b82f6" 
           };
            if (type === "global") return {
              pricing: {
                 jobs: { standard: 500, premium: 1000, urgent: 1500 },
                 accommodations: { standard: 500, premium: 1000, urgent: 1500 },
                 caterings: { standard: 500, premium: 1000, urgent: 1500 },
                 marketplace: { standard: 500, premium: 1000, urgent: 1500 },
                 machines: { standard: 500, premium: 1000, urgent: 1500 },
                 plots: { standard: 500, premium: 1000, urgent: 1500 },
                 professional_monthly: 6000
              },
             limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
             messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
             globalRateLimit: 100,
             initialCredits: 1500
           };
           return null;
         } catch (error: any) {
           const err = error as Error & { details?: string; code?: number };
           if (
             err?.message?.includes("Quota limit exceeded") ||
             err?.details?.includes("Quota limit exceeded") ||
             err?.message?.includes("Trip Circuit Breaker") ||
             err?.code === 4 || // DEADLINE_EXCEEDED
             err?.code === 8    // RESOURCE_EXHAUSTED
           ) {
             console.warn(`[AdminSettingsService] Quota/Timeout fetching settings ${type}. Returning fallback.`);
             throw new Error("QUOTA_EXHAUSTED");
           }
           throw error;
         }
       },
       15 * 60 * 1000,
       type === "branding" ? { 
         heroTitle: "OSNAŽUJEMO GRAĐEVINSKU INDUSTRIJU",
         heroSubtitle: "Povezujemo profesionalce i klijente širom regiona.",
         primaryColor: "#0f172a",
         secondaryColor: "#3b82f6" 
        } : (type === "global" ? {
          pricing: {
             jobs: { standard: 500, premium: 1000, urgent: 1500 },
             accommodations: { standard: 500, premium: 1000, urgent: 1500 },
             caterings: { standard: 500, premium: 1000, urgent: 1500 },
             marketplace: { standard: 500, premium: 1000, urgent: 1500 },
             machines: { standard: 500, premium: 1000, urgent: 1500 },
             plots: { standard: 500, premium: 1000, urgent: 1500 },
             professional_monthly: 6000
          },
         limits: { free_listings_per_month: 3, max_images_per_ad: 10 },
         messages: { welcome_text: 'Dobrodošli na Svet Građevine', maintenance_mode: false },
         globalRateLimit: 100,
         initialCredits: 1500
       } : null), // Fallback
       timeoutMs
    ); // 15 minutes cache with SWR
  }
}
