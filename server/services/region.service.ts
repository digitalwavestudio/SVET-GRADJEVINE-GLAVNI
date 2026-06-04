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
    if (process.env.NODE_ENV !== "production") {
      return false;
    }
    // Obično Frankfurt smatramo primarnim za write-heavy taskove koji se ne kloniraju
    return this.currentRegion === "europe-west3";
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
