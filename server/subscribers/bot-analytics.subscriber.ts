import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { db } from "../config/firebase.ts";
import { LoggerService } from "../services/logger.service.ts";
import { getRedis } from "../utils/redis.ts";
import { AlertingService } from "../services/alerting.service.ts";
import { MetricsService } from "../services/metrics.service.ts";

export function setupBotAnalyticsSubscriber() {
  eventBus.on(
    DomainEvents.BOT_ANALYTICS,
    async (payload) => {
      const { botType, botName, path, ip, status, durationMs } = payload;
      try {
        await MetricsService.recordBotTelemetry(botType, botName, path, status, durationMs);
        
        // Track 404 & Dead-End Telemetry logger
        if (status === 404 || status === 410) {
          LoggerService.warn(
            `[Bot Analytics] ${botName} hit dead-end (${status}) on ${path}`,
          );
        }

        // Track Crawl Explosion & Trap Detection via Redis (e.g., >100 hits in 1 minute from same IP)
        const redis = getRedis();
        if (redis) {
          const rateKey = `bot_rate:${ip}`;
          const hits = await redis.incr(rateKey);
          if (hits === 1) {
            await redis.expire(rateKey, 60); // 1 minute window
          }

          if (hits > 150) {
            LoggerService.error(
              `[Crawl Trap Detected] IP ${ip} (${botName}) is hitting rates > 150/min. Possible spider trap or aggressive scraping. Path: ${path}`,
            );
            // Dodatna akcija: Alert NOC panel & Slack
            AlertingService.sendCrawlExplosionAlert(ip, hits);
          }
        }

        LoggerService.info(
          `[Bot Analytics] ${botType}:${botName} -> ${status} on ${path} in ${durationMs}ms`,
        );
      } catch (error) {
        LoggerService.error(
          `[BotAnalyticsSubscriber] Failed to track bot:`,
          error,
        );
      }
    },
  );
}
