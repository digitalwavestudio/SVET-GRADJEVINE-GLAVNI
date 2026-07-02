export class MonitoringService {
  static init() {}
  static recordError(..._args: unknown[]) {}
  static recordRouteMetric(..._args: unknown[]) {}
  static recordResponseTime(..._args: unknown[]) {}
  static recordBotHit(..._args: unknown[]) {}
  static recordEvent(..._args: unknown[]) {}
  static recordSyncSuccess() {}
  static recordSyncFail() {}
  static getMetrics() { return {}; }
  static getStats() { return {
    instanceUptimeSeconds: 0,
    outbox: { pending: 0, dlq: 0 },
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRatio: "0",
    redisHealth: null,
    avgResponseTime: 0,
    botStats: {},
  }; }
  static getRouteMetrics() { return []; }
  static getCachePartitionStats() { return {}; }
  static gracefulShutdown() {}
}
