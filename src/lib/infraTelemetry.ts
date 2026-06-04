/**
 * Svet Građevine - Enterprise Infrastructure & Cloud Cost Monitoring
 * Aggregates multi-dimensional usage data for real-time FinOps analysis.
 */
import { firestoreTelemetry } from './firestoreTelemetry';
import { CostService, UsageMetrics } from './costService';
import { exportService } from './exportService';

class InfraTelemetry {
  private sessionStart: number = Date.now();
  private metrics: UsageMetrics = {
    firestore_reads: 0,
    firestore_writes: 0,
    firestore_deletes: 0,
    storage_bytes_stored: 0,
    egress_bytes: 0,
    api_invocations: 0
  };

  private static instance: InfraTelemetry;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Periodic reporting to BigQuery
      setInterval(() => this.reportCostMetrics(), 30000);
    }
  }

  public static getInstance(): InfraTelemetry {
    if (!InfraTelemetry.instance) {
      InfraTelemetry.instance = new InfraTelemetry();
    }
    return InfraTelemetry.instance;
  }

  /**
   * Tracks network egress
   * In a real enterprise app, this would be intercepted by a service worker or global fetch wrapper
   */
  recordEgress(bytes: number) {
    this.metrics.egress_bytes += bytes;
  }

  /**
   * Tracks an API call
   */
  recordApiCall() {
    this.metrics.api_invocations++;
  }

  /**
   * Calculates real-time session cost state
   */
  getSessionCostAudit() {
    const fsSnapshot = firestoreTelemetry.getSnapshot();
    
    // Sync shared metrics
    this.metrics.firestore_reads += fsSnapshot.serverReads;
    this.metrics.firestore_writes += fsSnapshot.writes;
    
    const currentCost = CostService.estimateCost(this.metrics);
    const duration = Date.now() - this.sessionStart;
    const forecast = CostService.forecastMonthly(currentCost, duration);

    return {
      metrics: { ...this.metrics },
      currentCost,
      forecast,
      durationMs: duration,
      formattedCost: CostService.formatUSD(currentCost),
      formattedForecast: CostService.formatUSD(forecast)
    };
  }

  private async reportCostMetrics() {
    const audit = this.getSessionCostAudit();
    
    // Export to BigQuery for AI forecasting models
    exportService.enqueue({
      type: 'cost_telemetry',
      cost_usd: audit.currentCost,
      forecast_usd: audit.forecast,
      metrics: audit.metrics,
      timestamp: new Date().toISOString()
    });
  }
}

export const infraTelemetry = InfraTelemetry.getInstance();
