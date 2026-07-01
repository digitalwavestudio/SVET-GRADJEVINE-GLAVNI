import { getRedis } from "../utils/redis.ts";
import { logger } from "../utils/logger.ts";

const REDIS_CONFIG_KEY = "app:config:dynamic";
const POLL_INTERVAL = 60000;

export class DynamicConfigService {
  private static config: Record<string, unknown> = {};
  private static redis = getRedis();
  private static pollTimer: ReturnType<typeof setInterval> | null = null;

  static async init() {
    await this.loadFromRedis();

    this.pollTimer = setInterval(() => {
      this.loadFromRedis().catch(err =>
        logger.error("[DynamicConfig] Poll failed", err)
      );
    }, POLL_INTERVAL);
  }

  private static async loadFromRedis() {
    if (!this.redis) return;
    try {
      const stored = await this.redis.get(REDIS_CONFIG_KEY);
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (err) {
      logger.error("[DynamicConfig] Load failed", err);
    }
  }

  static get<T>(key: string, defaultValue: T): T {
    return this.config[key] !== undefined
      ? (this.config[key] as T)
      : defaultValue;
  }

  static async set(key: string, value: unknown) {
    if (!this.redis) return;

    this.config[key] = value;
    await this.redis.set(REDIS_CONFIG_KEY, JSON.stringify(this.config));
  }

  static getAll() {
    return { ...this.config };
  }

  static gracefulShutdown() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
