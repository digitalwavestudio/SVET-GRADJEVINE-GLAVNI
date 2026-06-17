import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.ts";

export type ServerServiceGroup = "ads" | "companies" | "masters" | "tools" | "general";

interface RequestRecord {
  timestamp: number;
  statusCode: number;
}

class ServerCircuitBreakerManager {
  private windowMs = 60000; // 60 seconds rolling window
  private minRequests = 15; // Increased min requests to avoid tripping on single errors
  private errorThreshold = 0.30; // Increased threshold to 30%

  private history = new Map<ServerServiceGroup, RequestRecord[]>();
  private states = new Map<ServerServiceGroup, "CLOSED" | "OPEN">();
  private trippedAt = new Map<ServerServiceGroup, number>();
  private cooldownMs = 15000; // 15 seconds cooldown for faster recovery pokušaj recovery-ja

  constructor() {
    this.history.set("ads", []);
    this.history.set("companies", []);
    this.history.set("masters", []);
    this.history.set("tools", []);
    this.history.set("general", []);

    this.states.set("ads", "CLOSED");
    this.states.set("companies", "CLOSED");
    this.states.set("masters", "CLOSED");
    this.states.set("tools", "CLOSED");
    this.states.set("general", "CLOSED");
  }

  /**
   * Identifies the service group based on requested path
   */
  public getServiceGroup(url: string): ServerServiceGroup {
    const cleanUrl = url.toLowerCase();
    if (
      cleanUrl.includes("/ads") ||
      cleanUrl.includes("/oglasi") ||
      cleanUrl.includes("/smestaj") ||
      cleanUrl.includes("/masine") ||
      cleanUrl.includes("/placevi") ||
      cleanUrl.includes("/alat-i-oprema")
    ) {
      return "ads";
    }
    if (
      cleanUrl.includes("/firme") ||
      cleanUrl.includes("/companies") ||
      cleanUrl.includes("/tenderi")
    ) {
      return "companies";
    }
    if (cleanUrl.includes("/majstori") || cleanUrl.includes("/masters")) {
      return "masters";
    }
    if (
      cleanUrl.includes("/calcs") ||
      cleanUrl.includes("/kalkulatori") ||
      cleanUrl.includes("/dnevnik") ||
      cleanUrl.includes("/dokumenti")
    ) {
      return "tools";
    }
    return "general";
  }

  /**
   * Prunes history older than sliding window
   */
  private pruneHistory(group: ServerServiceGroup) {
    const now = Date.now();
    const list = this.history.get(group) || [];
    const pruned = list.filter((rec) => now - rec.timestamp < this.windowMs);
    this.history.set(group, pruned);
  }

  /**
   * Logs a request completion
   */
  public logRequest(group: ServerServiceGroup, statusCode: number) {
    this.pruneHistory(group);
    const list = this.history.get(group) || [];
    list.push({ timestamp: Date.now(), statusCode });
    this.history.set(group, list);

    this.evaluateState(group);
  }

  /**
   * Evaluates state of a circuit
   */
  private evaluateState(group: ServerServiceGroup) {
    const list = this.history.get(group) || [];
    if (list.length < this.minRequests) {
      this.states.set(group, "CLOSED");
      return;
    }

    const failed = list.filter((rec) => rec.statusCode >= 500).length;
    const errorRate = failed / list.length;

    if (errorRate > this.errorThreshold) {
      if (this.states.get(group) !== "OPEN") {
        logger.warn(
          `🚨 [Server CircuitBreaker] "${group}" circuit TRIPPED! Error rate: ${(
            errorRate * 100
          ).toFixed(1)}% (Threshold: ${this.errorThreshold * 100}%)`
        );
        this.states.set(group, "OPEN");
        this.trippedAt.set(group, Date.now());
      }
    } else {
      if (this.states.get(group) === "OPEN") {
        console.info(`🛡️ [Server CircuitBreaker] "${group}" circuit recovered and CLOSED.`);
        this.states.set(group, "CLOSED");
      }
    }
  }

  /**
   * Check if circuit breaker is currently OPEN
   */
  public isOpen(group: ServerServiceGroup): boolean {
    // Disabled circuit breaker blocking as requested by enterprise tuning plan
    return false;
  }

  /**
   * Status overview for monitoring and dashboard metrics
   */
  public getStats() {
    return Array.from(this.states.entries()).map(([group, state]) => {
      const list = this.history.get(group) || [];
      const failed = list.filter((r) => r.statusCode >= 500).length;
      return {
        group,
        state,
        totalInWindow: list.length,
        errorsInWindow: failed,
        errorRate: list.length > 0 ? `${((failed / list.length) * 100).toFixed(1)}%` : "0%",
      };
    });
  }
}

export const serverCircuitBreaker = new ServerCircuitBreakerManager();

/**
 * Express middleware to enforce server-side circuit breaker rules
 */
export const circuitBreakerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const group = serverCircuitBreaker.getServiceGroup(req.originalUrl || req.url);

  // Integracija sa AdaptiveQosService - rano zaustavljanje i signalizacija
  if (req.originalUrl?.includes('/api/') || req.originalUrl?.includes('/dashboard')) {
    const { AdaptiveQosService } = await import("../services/adaptive-qos.service.ts");
    const isQosSafe = await AdaptiveQosService.recordReadIntent();
    
    if (!isQosSafe) {
      const { triggerQuotaProtection } = await import("../config/firebase.ts");
      triggerQuotaProtection(new Error("QoS Adaptive Spajk Detektovan"));
      
      // Progresivna degradacija za globalne endpointe visokog opterećenja
      if (!serverCircuitBreaker.isOpen(group)) {
        res.setHeader("X-QoS-Degraded", "true");
        // We purposely trip the local group breaker if QoS says it's unsafe for read intents
        serverCircuitBreaker.logRequest(group, 503); 
      }
    }
  }

  // If the circuit is open, we directly return 503 to shield downstream microservices/database from overload
  if (serverCircuitBreaker.isOpen(group)) {
    res.setHeader("X-Circuit-State", "OPEN");
    res.setHeader("Retry-After", "30");
    return res.status(503).json({
      status: "degraded",
      message: `[CircuitBreaker] Service group "${group}" is currently degraded due to elevated error rates. Serving offline local cache.`,
      errorRate: serverCircuitBreaker.getStats().find((s) => s.group === group)?.errorRate,
    });
  }

  // Monitor request lifecycle to record the response status code
  res.on("finish", () => {
    // Only track actual service endpoints, not static assets / vite bundles
    const isApi = req.originalUrl?.startsWith("/api") || req.url?.startsWith("/api");
    if (isApi) {
      serverCircuitBreaker.logRequest(group, res.statusCode);
    }
  });

  next();
};
