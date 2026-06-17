import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { logger } from "../../utils/logger.ts";

export class DashboardAdminService {
  static async getAdminStats() {
    const cacheKey = "admin_global_stats:v2";
    
    try {
      const stats = await CacheService.getOrSetSWR(
        cacheKey,
        async () => {
          const { AdminStatsService } = await import("../admin-stats.service.ts");
          const s = await AdminStatsService.getGlobalStats();

          s.housekeeping = await this.getHousekeepingStatus();
          
          const { PredictiveAnalyticsService } = await import("../predictive.service.ts");
          s.systemInternals = await PredictiveAnalyticsService.getSystemInternalStatus();
          
          return s;
        },
        3600000 // 1h cache
      );
      
      return stats;
    } catch (error) {
      console.error("Error aggregating admin stats:", error);
      return {
        activeAds: 0,
        pendingAds: 0,
        premiumPartners: 0,
        totalUsers: 0,
        verifiedCompanies: 0,
        jobsCount:  0,
        machinesCount: 0,
        companiesCount: 0,
        estimatedRevenue: 0,
        housekeeping: { status: "unknown", lastRun: new Date() }
      };
    }
  }

  static async getChartData() {
    const cacheKey = "admin_chart_data:v2";
    
    try {
      const result = await CacheService.getOrSetSWR(
        cacheKey,
        async () => {
          let history: Record<string, { korisnici: number; oglasi: number; prihodi: number; transakcije: number }> = {};
          let precalculatedSectors: Array<{ name: string; value: number }> = [];
          let isFirestoreHealthy = true;

          try {
            const historyDoc = await db.doc("metadata/admin_chart_history").get();
            if (historyDoc.exists) {
              const docData = historyDoc.data();
              history = docData?.trend || {};
              precalculatedSectors = docData?.sectors || docData?.sectorData || [];
            }
          } catch (err: unknown) {
            logger.warn("[DashboardService] Failed to load pre-aggregated metadata document:", err instanceof Error ? err.message : String(err));
            isFirestoreHealthy = false;
          }

          if (!isFirestoreHealthy || Object.keys(history).length === 0) {
            return { registrationData: [], sectorData: [] };
          }

          const trend: Record<
            string,
            {
              korisnici: number;
              oglasi: number;
              prihodi: number;
              transakcije: number;
            }
          > = { ...history };
          const dates = [];

          for (let i = 0; i < 14; i++) {
            const dStart = new Date();
            dStart.setDate(dStart.getDate() - (13 - i));
            const dateStr = dStart.toISOString().split("T")[0];
            dates.push(dateStr);
            if (!trend[dateStr]) {
              trend[dateStr] = {
                korisnici: 0,
                oglasi: 0,
                prihodi: 0,
                transakcije: 0,
              };
            }
          }

          const registrationData = dates.map((date) => ({
            name: new Date(date).toLocaleDateString("sr-RS", {
              day: "2-digit",
              month: "2-digit",
            }),
            korisnici: trend[date]?.korisnici || 0,
            oglasi: trend[date]?.oglasi || 0,
            prihodi: trend[date]?.prihodi || 0,
            transakcije: trend[date]?.transakcije || 0,
          }));

          let sectorData = precalculatedSectors;
          if (!sectorData || sectorData.length === 0) {
            sectorData = [
              { name: "ROBUSNI MAŠINSKI RADOVI", value: 35 },
              { name: "ZAVRŠNI UNUTRAŠNJI RADOVI", value: 28 },
              { name: "ELEKTRIČNE INSTALACIJE", value: 20 },
              { name: "ARHITEKTONSKO PROJEKTOVANJE", value: 17 },
            ];
          } else {
            sectorData = sectorData.map(item => ({
              name: String(item.name).toUpperCase(),
              value: Number(item.value) || 0
            })).sort((a, b) => b.value - a.value).slice(0, 4);
          }

          return { registrationData, sectorData };
        },
        3600000 // 1h cache
      );

      return result;
    } catch (err) {
      console.error("Error aggregating admin chart data:", err);
      return {
        registrationData: [],
        sectorData: []
      };
    }
  }

  static async getHousekeepingStatus() {
    try {
      const snap = await db.doc("metadata/housekeeping_status").get();
      return snap.exists ? snap.data() : null;
    } catch (err) {
      return null;
    }
  }
}
