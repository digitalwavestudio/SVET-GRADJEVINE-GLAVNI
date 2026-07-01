import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { CACHE_PREFIXES } from "../constants/cache-keys.ts";
import { Logger } from "../utils/logger.ts";

const REDIS_KEY_BOT_HITS = CACHE_PREFIXES.METRICS_BOT_HITS;
const REDIS_KEY_BOT_PATHS = CACHE_PREFIXES.METRICS_BOT_PATHS;
const FLUSH_DELAY_MS = env.NODE_ENV === "production" ? 2 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;

export class SystemMetricsService {
  private static redis = getRedis();
  private static flushTimer: NodeJS.Timeout | null = null;

  static async recordBotTelemetry(
    botType: string,
    botName: string,
    path: string,
    status: number,
    durationMs: number
  ) {
    if (this.redis) {
      try {
        const rounded = Math.round(durationMs);
        const safeDuration = isNaN(rounded) || !isFinite(rounded) ? 0 : rounded;
        const pipeline = this.redis.pipeline();

        pipeline.hincrby(REDIS_KEY_BOT_HITS, `total:${botType}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_HITS, `bot:${botName}`, 1);

        const dateKey = new Date().toISOString().split("T")[0];
        const safePath = path.replace(/\//g, "_").substring(0, 50);
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:path:${safePath}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:status:${status}`, 1);
        pipeline.hincrby(REDIS_KEY_BOT_PATHS, `${dateKey}:${botName}:duration`, safeDuration);

        if (status === 404 || status === 410) {
          const longSafePath = path.replace(/\//g, "_").substring(0, 100);
          pipeline.hincrby(REDIS_KEY_BOT_PATHS, `telemetry_404:${longSafePath}`, 1);
        }

        await pipeline.exec();
      } catch (err) {
        console.error("[SystemMetrics] recordBotTelemetry error:", err);
      }
    }
  }

  static async flushBotMetrics() {
    if (!this.redis) return;

    const lockKey = "lock:bot_metrics_flush";
    const lockId = await LockManager.acquire(lockKey, 55000);
    if (!lockId) return;

    try {
      const [pendingBotHits, pendingBotPaths] = await Promise.all([
        this.redis.hgetall(REDIS_KEY_BOT_HITS),
        this.redis.hgetall(REDIS_KEY_BOT_PATHS),
      ]);

      const botHitsEntries = Object.entries(pendingBotHits || {});
      const botPathsEntries = Object.entries(pendingBotPaths || {});

      if (botHitsEntries.length === 0 && botPathsEntries.length === 0) return;

      const processInChunks = async (items: any[], redisKey: string, processor: (batch: any, key: string, count: number) => void) => {
        if (!items || items.length === 0) return;
        const chunkSize = 400;
        for (let i = 0; i < items.length; i += chunkSize) {
          const chunk = items.slice(i, i + chunkSize);
          const batch = db.batch();
          const processedKeys: string[] = [];
          for (const [key, countStr] of chunk) {
            const count = parseInt(countStr as string, 10);
            if (isNaN(count) || count === 0) continue;
            processor(batch, key, count);
            processedKeys.push(key as string);
          }
          if (processedKeys.length > 0) {
            try {
              await batch.commit();
              await this.redis!.hdel(redisKey, ...processedKeys);
            } catch (chunkErr) {
              console.error("[SystemMetrics] Flush chunk failed:", chunkErr);
            }
          }
        }
      };

      await processInChunks(botHitsEntries, REDIS_KEY_BOT_HITS, (batch: any, key: string, count: number) => {
        batch.set(db.collection("statistics").doc("bot_analytics"), {
          [key]: firebaseAdmin.firestore.FieldValue.increment(count),
          lastSeen: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await processInChunks(botPathsEntries, REDIS_KEY_BOT_PATHS, (batch: any, key: string, count: number) => {
        const parts = key.split(":");
        if (parts[0] === "telemetry_404") {
          const val = parts.slice(1).join(":");
          batch.set(db.collection("statistics").doc("bot_404_telemetry"), {
            [`paths.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count),
            lastHit: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          return;
        }
        const dateKey = parts[0];
        const botName = parts[1];
        const type = parts[2];
        const val = parts.slice(3).join(":");
        const dailyRef = db.collection("statistics").doc("bot_analytics").collection("daily").doc(dateKey);
        if (type === "path") {
          batch.set(dailyRef, { [`paths.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count), [botName]: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
        } else if (type === "status") {
          batch.set(dailyRef, { [`status_codes.${val}`]: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
        } else if (type === "duration") {
          batch.set(dailyRef, { totalDurationMs: firebaseAdmin.firestore.FieldValue.increment(count) }, { merge: true });
        }
      });
    } catch (err) {
      console.error("[SystemMetrics] Flush bot metrics failed:", err);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  static init() {
    if (env.NODE_ENV === "production") {
      if (!this.flushTimer) {
        this.flushTimer = setInterval(() => this.flushBotMetrics(), FLUSH_DELAY_MS);
      }
    }
  }

  static async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flushBotMetrics();
  }
}
