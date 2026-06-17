import { getRedis } from "../utils/redis.ts";
import { CacheKeys } from "../constants/cache-keys.ts";
import { logger } from "../utils/logger.ts";

/**
 * AdaptiveQosService - Pametna zastita Firestore kvota kroz asinhroni throughput monitoring.
 * (Mehanizam D - Circuit Breaker i Adaptive QoS)
 */
export class AdaptiveQosService {
  private static readonly MAX_READ_THROUGHPUT = 100000; // Massively relaxed limit to prevent artificial QoS throttling on clicks
  private static localBuckets = new Map<number, number>();

  private static lastRedisErrorTime = 0;
  private static readonly REDIS_BYPASS_DURATION_MS = 5000; // Skip Redis for 5s on error

  /**
   * Zapisuje nameru za Firestore operaciju.
   * Vraća TRUE ako smo u bezbednoj zoni (dozvoljeno).
   * Vraća FALSE ako padamo u Block/Degraded mode zbog throughputa (Stale-Cache Mod).
   */
  static async recordReadIntent(): Promise<boolean> {
    const redis = getRedis();
    const currentSecond = Math.floor(Date.now() / 1000);
    const key = CacheKeys.qosReadIntent(currentSecond);

    const now = Date.now();
    const isRedisBypassed = now - this.lastRedisErrorTime < this.REDIS_BYPASS_DURATION_MS;

    if (redis && !isRedisBypassed) {
      try {
        // Dodajemo race condition sa timeoutom da ne blokiramo request ako Redis kasni
        const redisOp = redis.incr(key);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Redis Timeout")), 400)
        );
        
        const count = await Promise.race([redisOp, timeoutPromise]) as number;
        
        // Ekspajrira kljuc nakon par sekundi da ne ostaje u memoriji
        if (count === 1) {
           await redis.expire(key, 10);
        }
        
        if (count > this.MAX_READ_THROUGHPUT) {
           logger.warn(`[AdaptiveQosService] ⚠️ Throughput spajk detektovan (${count} req/s). Aktiviranje Stale-Cache moda!`);
           return false;
        }
        return true;
      } catch (err: any) {
        this.lastRedisErrorTime = Date.now();
        if (err.message === "Redis Timeout") {
          logger.warn("[AdaptiveQosService] 🛡️ Redis Latency Warning (Timeout), prelazak na lokalni Qos limit na 5s...");
        } else {
          console.error("[AdaptiveQosService] Redis error, prelazak na lokalni limit", err);
        }
        return this.localBucketCheck(currentSecond);
      }
    }

    return this.localBucketCheck(currentSecond);
  }

  private static localBucketCheck(currentSecond: number): boolean {
    // Samo-čišćenje istorije (curenje memorije)
    for (const key of this.localBuckets.keys()) {
      if (key < currentSecond - 5) {
        this.localBuckets.delete(key);
      }
    }

    const currentCount = (this.localBuckets.get(currentSecond) || 0) + 1;
    this.localBuckets.set(currentSecond, currentCount);

    if (currentCount > this.MAX_READ_THROUGHPUT) {
       logger.warn(`[AdaptiveQosService] (Local) ⚠️ Throughput spajk detektovan (${currentCount} req/s). Aktiviranje Stale-Cache moda!`);
       return false;
    }
    return true;
  }
}
