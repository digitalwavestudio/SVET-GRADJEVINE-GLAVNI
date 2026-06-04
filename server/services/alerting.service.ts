import { env } from "../config/env.ts";
import { LoggerService } from "./logger.service.ts";

/**
 * Service for sending real-time alerts to Discord/Slack webhooks.
 */
export class AlertingService {
  private static webhookUrl = env.SLACK_WEBHOOK_URL || env.DISCORD_WEBHOOK_URL;
  private static lastAlertTime: Record<string, number> = {};
  private static ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min cooldown per alert type

  private static async sendWebhook(payload: any) {
    if (!this.webhookUrl) {
      LoggerService.debug(
        "[AlertingService] Warning: Discord/Slack webhook URL not configured. Dropping alert.",
      );
      return;
    }

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      LoggerService.error(`[AlertingService] Failed to send webhook:`, err);
    }
  }

  private static applyCooldown(alertKey: string): boolean {
    const now = Date.now();
    const lastTime = this.lastAlertTime[alertKey];
    if (lastTime && now - lastTime < this.ALERT_COOLDOWN_MS) {
      return false; // In cooldown, skip
    }
    this.lastAlertTime[alertKey] = now;
    return true;
  }

  static async sendSlowRenderAlert(url: string, durationMs: number) {
    if (!this.applyCooldown("slow_render")) return;

    await this.sendWebhook({
      content: `⚠️ **SLOW RENDER DETECTED**\nRoute: \`${url}\` took **${durationMs}ms** to render! Bot crawl budget at risk.`,
    });
  }

  static async sendRedisFragmentationAlert(ratio: number) {
    if (!this.applyCooldown("redis_frag")) return;

    await this.sendWebhook({
      content: `🔥 **REDIS MEMORY WARNING**\nFragmentation ratio is at **${ratio}**. Eviction policy might be struggling.`,
    });
  }

  static async sendCrawlExplosionAlert(botOrIp: string, reqCount: number) {
    if (!this.applyCooldown(`crawl_${botOrIp}`)) return;

    await this.sendWebhook({
      content: `🛑 **CRAWL EXPLOSION**\nAggressive scraper/bot detected: \`${botOrIp}\` with **${reqCount}** reqs/min.\nRate limiter engaged.`,
    });
  }

  static async sendCacheHitDropAlert(ratio: string) {
    if (!this.applyCooldown("cache_drop")) return;

    await this.sendWebhook({
      content: `📉 **CACHE HIT RATIO DROP**\nCache hit ratio fell to **${ratio}**. Check for cache thrashing.`,
    });
  }

  static async sendGeneralAlert(message: string) {
    if (!this.applyCooldown(`general_${message.slice(0, 50)}`)) return;

    await this.sendWebhook({
      content: `🔔 **SYSTEM ALERT**\n${message}`,
    });
  }
}
