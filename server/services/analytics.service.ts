import { db } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { MetricsService } from "./metrics.service.ts";
import { CacheService } from "./cache.service.ts";

export class AnalyticsService {
  private static logger = new Logger({ service: "AnalyticsService" });

  static async getAdViewTrend(adId: string, days: number = 7) {
    const cacheKey = `analytics_trend:${adId}:${days}`;

    const snapData = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split("T")[0];

        // We fetch from metrics_daily which is flushed by MetricsService
        const snap = await db
          .collection("metrics_daily")
          .where("adId", "==", adId)
          .where("date", ">=", startDateStr)
          .orderBy("date", "asc")
          .limit(365) // safeguard limit
          .get();

        const fetchedStats: Record<string, number> = {};
        snap.docs.forEach((doc) => {
          const data = doc.data();
          fetchedStats[data.date] = data.views || 0;
        });
        return fetchedStats;
      },
      300000
    );

    const stats: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const cd = new Date();
      cd.setDate(cd.getDate() - i);
      const dateStr = cd.toISOString().split("T")[0];
      stats[dateStr] = (snapData && snapData[dateStr]) || 0;
    }

    const pendingStats = await MetricsService.getPendingDailyStats(undefined, adId);

    Object.keys(pendingStats).forEach((date) => {
       if (stats[date] !== undefined) {
          stats[date] += (pendingStats[date].views || 0);
       }
    });

    return Object.entries(stats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  static async getUserTotalTrends(userId: string, days: number = 7) {
    const result = await MetricsService.getUserAnalytics(userId, days);
    return result.map((item) => ({ date: item.date, count: item.views }));
  }
}
