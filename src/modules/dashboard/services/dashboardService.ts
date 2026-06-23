import { getLazyAuth } from '@/src/lib/firebase';
import { apiClient } from '@/src/lib/apiClient';

export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 500, code = 'DASHBOARD_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export interface AdminStats {
  activeAds?: number;
  pendingAds?: number;
  premiumPartners?: number;
  totalUsers?: number;
  verifiedCompanies?: number;
  jobsCount?: number;
  machinesCount?: number;
  companiesCount?: number;
  estimatedRevenue?: number;
}

export interface ChartItem {
  name: string;
  prihodi: number;
}

export interface ChartData {
  registrationData?: ChartItem[];
  sectorData?: Record<string, unknown>[];
}

export interface HousekeepingTaskStatus {
  lastRun?: {
    _seconds: number;
    _nanoseconds: number;
  };
  status?: string;
  result?: Record<string, unknown>;
}

export interface ServerStats extends AdminStats {
  chartData?: ChartData;
  recentAds?: Record<string, unknown>[];
  smartMatches?: Record<string, unknown>[];
  totalAds?: number;
  growthActiveAds?: string;
  growthPremiumPartners?: string;
  growthCompanies?: string;
  housekeeping?: Record<string, HousekeepingTaskStatus>;
}

const REVENUE_ESTIMATES = {
  STARDARD_AD: 15,
  PREMIUM_AD: 50
};

export const dashboardService = {
  async fetchServerStats(): Promise<ServerStats> {
    try {
      return await apiClient.get<ServerStats>('/dashboard/stats');
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      throw new AppError(
        err.message || "Failed to fetch server dashboard stats",
        err.status || 500,
        "FETCH_SERVER_STATS_FAILED"
      );
    }
  },

  async fetchAdsMetrics(
    userId: string,
    currentMetrics?: unknown,
    force = false,
    serverStats?: ServerStats
  ): Promise<{ totalAds: number; allAds: Record<string, unknown>[]; countsCalculated: boolean }> {
    try {
      // Ako imamo serverStats, koristimo ih (iz fetchServerStats poziva)
      if (serverStats && !force) {
        return { 
          totalAds: serverStats.totalAds || 0, 
          allAds: serverStats.recentAds || [], 
          countsCalculated: true 
        };
      }

      // Fallback ako serverStats nije dostupan (npr. direktan poziv metrike)
      const stats = await this.fetchServerStats();
      if (stats) {
         return {
            totalAds: stats.totalAds || 0,
            allAds: stats.recentAds || [],
            countsCalculated: true
         };
      }

      return { totalAds: 0, allAds: [], countsCalculated: false };
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; statusCode?: number };
      throw new AppError(
        err.message || "Failed to fetch ads metrics", 
        err.status || err.statusCode || 500, 
        "FETCH_ADS_METRICS_FAILED"
      );
    }
  },

  async fetchMasterSmartMatches(): Promise<Record<string, unknown>[]> {
    try {
      const data = await apiClient.get<ServerStats>('/dashboard/stats');
      return data.smartMatches || [];
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number; statusCode?: number };
      throw new AppError(
        err.message || "Failed to fetch master smart matches",
        err.status || err.statusCode || 500,
        "FETCH_SMART_MATCHES_FAILED"
      );
    }
  }
};
