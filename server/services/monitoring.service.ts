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
  static gracefulShutdown() {}
}
