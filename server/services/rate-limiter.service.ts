import { getRedis } from "../utils/redis.ts";

export class RateLimiterService {
  private static redis = getRedis();
  private static localMap = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private static localBlockedCache = new Map<string, number>(); // IP -> ExpiryTs

  /**
   * Trajno blokira IP adresu sa sinhronizacijom u Redis.
   */
  static async blockIp(ip: string, days = 30): Promise<void> {
    const blockKey = `blocked:${ip}`;
    const expiry = 60 * 60 * 24 * days;

    if (this.redis) {
      try {
        await this.redis.set(blockKey, "1", "EX", expiry);
      } catch (err) {
        console.error("[RateLimiter] Redis block error:", err);
      }
    }

    // Local cache for Performance (expires after 1 hour locally, then re-checks redis)
    this.localBlockedCache.set(ip, Date.now() + 3600 * 1000);
  }

  /**
   * Proverava da li je IP blokiran.
   */
  static async isBlocked(ip: string): Promise<boolean> {
    const now = Date.now();
    const localExpiry = this.localBlockedCache.get(ip);

    if (localExpiry && now < localExpiry) {
      return true;
    }

    if (this.redis) {
      try {
        const isBlocked = await this.redis.get(`blocked:${ip}`);
        if (isBlocked) {
          this.localBlockedCache.set(ip, now + 3600 * 1000);
          return true;
        }
      } catch (e) {
        // Fallback to allowing if redis is down? Or keep local blocking?
      }
    }

    return false;
  }

  /**
   * Proverava da li je klijent premašio limit.
   */
  static async isAllowed(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const ipToBlock = key.includes(":")
      ? key.split(":").pop()
      : key.includes(".")
        ? key
        : null;

    if (ipToBlock && (await this.isBlocked(ipToBlock))) {
      return false;
    }

    const fullKey = `ratelimit:${key}`;

    if (this.redis) {
      try {
        const count = await this.redis.incr(fullKey);
        if (count === 1) {
          await this.redis.expire(fullKey, windowSeconds);
        }

        // Strict Penalty: if they hit limit * 10, autoblock for 30 days
        if (count > limit * 10 && ipToBlock) {
          console.warn(
            `[RateLimiter] AUTOBLOCKING IP ${ipToBlock} due to excessive spam (${count}/${limit})`,
          );
          await this.blockIp(ipToBlock);
          return false;
        }

        return count <= limit;
      } catch (err) {
        console.error("[RateLimiter] Redis error:", err);
      }
    }

    // Local Fallback
    const now = Date.now();
    const data = this.localMap.get(fullKey) || {
      count: 0,
      resetAt: now + windowSeconds * 1000,
    };

    if (now > data.resetAt) {
      data.count = 1;
      data.resetAt = now + windowSeconds * 1000;
    } else {
      data.count++;
      if (data.count > limit * 5 && ipToBlock) {
        this.blockIp(ipToBlock);
      }
    }

    this.localMap.set(fullKey, data);

    // Cleanup old keys occasionally
    if (this.localMap.size > 5000) {
      for (const [k, v] of this.localMap.entries()) {
        if (now > v.resetAt) this.localMap.delete(k);
      }
    }

    return data.count <= limit;
  }
}
