import { BigQueryService } from './bigquery.service';
import { db } from '../config/firebase';
import { Logger } from '../utils/logger';
import { CacheService } from './cache.service';

const logger = new Logger({ service: "CostAnalyticsService" });

export class CostAnalyticsService {
  /**
   * Initializes the daily cost analytics via SystemCron
   */
  static async start() {
    logger.info("Initializing Cost Analytics Export Worker (runs daily via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        SystemCron.register("daily_cost_analytics_cron", { pattern: "0 1 * * *" }, async () => {
          await this.runDailyExport();
        }).catch(err => logger.error("Failed to register Cost Analytics cron", err));
      }).catch(err => logger.error("Failed to import SystemCron", err));
  }
  /**
   * Aggregates previous day's Firestore usage from metadata or BigQuery 
   * (if we were using BQ to query back, but here we'll just simulate a daily roll-up)
   */
  static async runDailyExport() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // In a real system, we might query our BigQuery firestore_usage table for the totals
      // For this demo, we'll fetch from our operational 'metadata' or 'metrics' collection if it exists
      
      const stats = await CacheService.getOrSetSWR(
        'global_stats_metadata',
        async () => {
          const statsRef = db.collection('metadata').doc('global_stats');
          const statsSnap = await statsRef.get();
          return statsSnap.data() || {};
        },
        3600000,
        {}
      );

      const safeStats = stats || {};
      const dailyReads = safeStats.reads_yesterday || 0;
      const dailyWrites = safeStats.writes_yesterday || 0;

      // Pricing (Google Cloud Firestore Pricing)
      const COST_PER_READ = 0.06 / 100000;
      const COST_PER_WRITE = 0.18 / 100000;

      const estimatedCost = (dailyReads * COST_PER_READ) + (dailyWrites * COST_PER_WRITE);

      BigQueryService.export('cost_analytics', [{
        timestamp: new Date().toISOString(),
        category: 'firestore',
        unit_count: dailyReads + dailyWrites,
        estimated_cost: parseFloat(estimatedCost.toFixed(6)),
        details: {
            reads: dailyReads,
            writes: dailyWrites,
            date: dateStr
        }
      }]).catch(err => logger.error("Async BigQuery export failed", err));

      logger.info(`Queued daily cost analytics for ${dateStr}: $${estimatedCost.toFixed(4)}`);
    } catch (error) {
      logger.error("Failed to run daily cost export:", error);
    }
  }
}
