// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { env } from "../config/env.ts";
import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { CACHE_PREFIXES } from "../constants/cache-keys.ts";

const REDIS_KEY_PENDING_VIEWS = CACHE_PREFIXES.METRICS_VIEW_BUFFER;
const FLUSH_DELAY_MS = 2 * 60 * 60 * 1000; // 2 sata između upisa u bazu

export class ViewStatsService {
  private static redis = getRedis();
  private static flushInterval: NodeJS.Timeout | null = null;
  private static localFallbackMap = new Map<string, number>();

  /**
   * Puni i sabira preglede oglasa u ultra-brzi Redis ključ (HINCRBY)
   * Ukoliko je Redis nedostupan, koristi se in-memory Map fallback
   */
  static async incrementView(collectionName: string, docId: string): Promise<void> {
    if (!collectionName || !docId) return;

    const key = `${collectionName}:${docId}`;

    // 1. Pokušaj Redis (globalni bafer)
    try {
      if (this.redis) {
        await this.redis.hincrby(REDIS_KEY_PENDING_VIEWS, key, 1);
        return;
      }
    } catch (err) {
      console.error("[ViewStatsService] Redis hincrby failed, falling back to local:", err);
    }

    // 2. Lokalni fallback
    this.localIncrement(collectionName, docId, 1);
  }

  private static localIncrement(collectionName: string, docId: string, val: number) {
    const key = `${collectionName}:${docId}`;
    const current = this.localFallbackMap.get(key) || 0;
    this.localFallbackMap.set(key, current + val);
  }

  /**
   * Periodično sakuplja sve pre-kalkulisane preglede i flush-uje ih u Firestore kroz optimizovani batch upis.
   * Time smanjujemo broj pisanja u Firestore za više od 95%.
   */
  static async flush(): Promise<void> {
    const redisClient = this.redis;
    const viewsToFlush: Record<string, string> = {};

    const lockKey = "lock:view_stats_flush_cron";
    const lockId = await LockManager.acquire(lockKey, 50000);
    if (!lockId) {
      return;
    }

    try {
      // 1. Preuzmi trenutne skupljene preglede iz Redisa
      if (redisClient) {
        try {
          const redisStats = await redisClient.hgetall(REDIS_KEY_PENDING_VIEWS);
          if (redisStats) {
            Object.assign(viewsToFlush, redisStats);
          }
        } catch (err) {
          console.error("[ViewStatsService] Error hgetall pending views:", err);
        }
      }

      // 2. Snapshot-ujemo lokalne klikove pre asinhronog rada
      const localSnapshot = new Map<string, number>();
      for (const [key, count] of this.localFallbackMap.entries()) {
        localSnapshot.set(key, count);
        const currentVal = parseInt(viewsToFlush[key] || "0", 10);
        viewsToFlush[key] = String(currentVal + count);
      }

      const entries = Object.entries(viewsToFlush);
      if (entries.length === 0) {
        return;
      }

      const chunkSize = 400;
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        let countInBatch = 0;
        const processedKeys: string[] = [];

        for (const [key, countStr] of chunk) {
          const count = parseInt(countStr, 10);
          if (isNaN(count) || count <= 0) continue;

          const [collectionName, docId] = key.split(":");
          if (!collectionName || !docId) continue;

          const docRef = db.collection(collectionName).doc(docId);
          batch.set(
            docRef,
            { viewsCount: firebaseAdmin.firestore.FieldValue.increment(count) },
            { merge: true }
          );

          processedKeys.push(key);
          countInBatch++;
        }

        if (countInBatch > 0) {
          await batch.commit();

          // 3. Po uspešnom commit-u, brišemo procesuirane ključeve iz Redisa
          if (redisClient && processedKeys.length > 0) {
            try {
              await redisClient.hdel(REDIS_KEY_PENDING_VIEWS, ...processedKeys);
            } catch (err) {
              console.error("[ViewStatsService] Redis hdel clear failed:", err);
            }
          }

          // 4. Umanjujemo samo snapshotovane procesuirane ključeve iz lokalne memorijske mape kako ne bismo izgubili nove klikove nastale tokom samog flush-evanja
          for (const key of processedKeys) {
            const snapCount = localSnapshot.get(key) || 0;
            if (snapCount > 0) {
              const current = this.localFallbackMap.get(key) || 0;
              const diff = current - snapCount;
              if (diff <= 0) {
                this.localFallbackMap.delete(key);
              } else {
                this.localFallbackMap.set(key, diff);
              }
            }
          }

          console.info(`[ViewStatsService] Uspešno upisano ${countInBatch} agregiranih pregleda u Firestore.`);
        }
      }
    } catch (err) {
      console.error("[ViewStatsService] Globalni propust pri flush-ovanju pregleda:", err);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static init() {
    // PROMPT 7: Backend lokalni timer za batch na svaki 5 minuta
    if (env.NODE_ENV === "production") {
      if (!this.flushInterval) {
        this.flushInterval = setInterval(() => this.flush(), FLUSH_DELAY_MS);
        console.info(`[ViewStatsService] Pokrenut periodični flush planer (${FLUSH_DELAY_MS} ms) za in-memory batched page views.`);
      }
    }
  }

  static async shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// PROMPT 7: Pokrećemo in-memory init za flush
ViewStatsService.init();
