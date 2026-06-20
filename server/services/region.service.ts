import { env } from "../config/env.ts";
import { MonitoringService } from "./monitoring.service.ts";

export class RegionService {
  private static currentRegion = env.APP_REGION;

  /**
   * Vraća identifikator trenutnog regiona (npr. 'europe-west3').
   */
  static getRegion(): string {
    return this.currentRegion;
  }

  /**
   * Proverava da li je ovo primarni region za specifične pozadinske poslove (npr. Frankfurt).
   */
  static isLeaderRegion(): boolean {
    // In dev/sandbox environments, defer to SANDBOX_WORKERS_ENABLED outside this check, do not force leader
    if (env.NODE_ENV !== "production") {
      return false;
    }
    // Single-region deployment (us-west1): all instances can lead.
    // Redis locks provide mutual exclusion for background tasks.
    return true;
  }

  /**
   * Pomaže sistemu da odluči o ruti na osnovu blizine ili statusa regiona.
   */
  static getDeploymentMetadata() {
    return {
      region: this.currentRegion,
      isLeader: this.isLeaderRegion(),
      healthy: MonitoringService.getResourceUsage().isHealthy,
    };
  }
}
