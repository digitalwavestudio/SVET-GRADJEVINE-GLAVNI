import { env } from "../config/env.ts";
import { getRedis, getSubRedis, isClusterOffline } from "../utils/redis.ts";
import { logger } from "../utils/logger.ts";

const REDIS_CONFIG_KEY = "app:config:dynamic";
const REDIS_CONFIG_CHANNEL = "app:config:updates";

export class DynamicConfigService {
  private static config: any = {};
  private static redis = getRedis();
  private static subRedis = getSubRedis();

  /**
   * Inicijalizuje konfiguraciju i pretplatu na promene.
   */
  static async init() {
    if (isClusterOffline() || !this.redis) {
      logger.warn(
        "⚠️ DynamicConfig: Redis cluster is offline. Using local defaults only.",
      );
      return;
    }

    // 1. Initial Load with a strict 500ms timeout to prevent blocking server boot
    try {
      const getPromise = this.redis.get(REDIS_CONFIG_KEY);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 500));
      const stored = await Promise.race([getPromise, timeoutPromise]);
      if (stored) {
        this.config = JSON.parse(stored);
      } else {
        logger.warn("[DynamicConfig] Initial config load skipped or timed out. Operating with defaults.");
      }
    } catch (err) {
      console.error("[DynamicConfig] Initial load failed:", err);
    }

    // 2. Subscribe to updates (executed asynchronously without awaiting to shield boot cycle)
    if (this.subRedis) {
      const subscriber = this.subRedis;
      subscriber.subscribe(REDIS_CONFIG_CHANNEL)
        .then(() => {
          subscriber.on("message", (channel: string, message: string) => {
            if (channel === REDIS_CONFIG_CHANNEL) {
              try {
                this.config = JSON.parse(message);
                if (env.NODE_ENV !== "production") console.info(
                  "🔄 DynamicConfig: Updated across all instances in runtime",
                );
              } catch (err) {
                console.error("[DynamicConfig] Update parse error:", err);
              }
            }
          });
        })
        .catch((err: any) => {
          console.error("[DynamicConfig] Subscription registration failed:", err);
        });
    }
  }

  /**
   * Čita vrednost iz dinamičke konfiguracije.
   */
  static get<T>(key: string, defaultValue: T): T {
    return this.config[key] !== undefined
      ? (this.config[key] as T)
      : defaultValue;
  }

  /**
   * Postavlja vrednost i propagira promenu svim instancama.
   * (Ovo obično radi admin panel ili CLI alat)
   */
  static async set(key: string, value: unknown) {
    if (!this.redis) return;

    this.config[key] = value;
    await this.redis.set(REDIS_CONFIG_KEY, JSON.stringify(this.config));
    await this.redis.publish(REDIS_CONFIG_CHANNEL, JSON.stringify(this.config));
  }

  /**
   * Vraća ceo config radi monitoringa.
   */
  /**
   * Vraća ceo config radi monitoringa.
   */
  static getAll() {
    return { ...this.config };
  }

  static async gracefulShutdown() {
    if (this.subRedis) {
      await this.subRedis.unsubscribe(REDIS_CONFIG_CHANNEL);
    }
  }
}
