/**
 * Svet Građevine - Enterprise FinOps Service
 * Real-time cost estimation based on Google Cloud & Firebase Pricing models.
 */

export interface UsageMetrics {
  firestore_reads: number;
  firestore_writes: number;
  firestore_deletes: number;
  storage_bytes_stored: number;
  egress_bytes: number;
  api_invocations: number;
}

// Current GCP / Firebase Pricing (Approximate USD)
const PRICING = {
  FIRESTORE_READ: 0.036 / 100000,   // $0.036 per 100k
  FIRESTORE_WRITE: 0.108 / 100000,  // $0.108 per 100k
  FIRESTORE_DELETE: 0.012 / 100000, // $0.012 per 100k
  STORAGE_GB_MONTH: 0.026,          // $0.026 per GB/month
  NETWORK_EGRESS_GB: 0.12,          // $0.12 per GB (standard internet)
  API_INVOCATION: 0.000001,         // $1 per million
};

export class CostService {
  /**
   * Estimates current session cost in USD
   */
  static estimateCost(metrics: Partial<UsageMetrics>): number {
    let total = 0;
    
    if (metrics.firestore_reads) total += metrics.firestore_reads * PRICING.FIRESTORE_READ;
    if (metrics.firestore_writes) total += metrics.firestore_writes * PRICING.FIRESTORE_WRITE;
    if (metrics.firestore_deletes) total += metrics.firestore_deletes * PRICING.FIRESTORE_DELETE;
    
    if (metrics.egress_bytes) {
      const egressGB = metrics.egress_bytes / (1024 * 1024 * 1024);
      total += egressGB * PRICING.NETWORK_EGRESS_GB;
    }
    
    if (metrics.api_invocations) total += metrics.api_invocations * PRICING.API_INVOCATION;

    return total;
  }

  /**
   * Forecasts monthly cost based on a time slice usage
   * @param sessionCost The cost accumulated in the current session
   * @param durationMs The duration of the session in milliseconds
   */
  static forecastMonthly(sessionCost: number, durationMs: number): number {
    if (durationMs <= 0 || sessionCost === 0) return 35; // Default "base" cost for a low-traffic enterprise project
    
    const costPerMinute = sessionCost / (durationMs / 60000);
    const costPerDay = costPerMinute * 60 * 24;
    return costPerDay * 30; // 30-day projection
  }

  /**
   * Formats USD values nicely
   */
  static formatUSD(value: number): string {
    if (value < 0.0001) return '< $0.0001';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(value);
  }
}
