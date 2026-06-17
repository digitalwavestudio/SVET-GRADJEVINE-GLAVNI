import { env } from "../config/env.ts";
import { DatabaseManager } from "./db-manager.ts";
import { randomUUID } from "crypto";
import { logger } from "../utils/logger.ts";

export class RedisLockManager {
  /**
   * Pokusava da preuzme ekskluzivni lock na zadati kljuc.
   * @returns lockId (string) koji se koristi za oslobadjanje locka, ili null ako je vec zauzet.
   */
  static async acquire(
    key: string,
    ttlMs: number = 5000,
  ): Promise<string | null> {
    const redis = DatabaseManager.getRegionalRedisConnection();
    if (!redis) return null; 

    const lockId = randomUUID();
    // NX: Set if Not eXists, PX: TTL u milisekundama
    // Koristimo standardni redosled argumenata za ioredis kompatibilnost
    const acquired = await redis.set(`lock:${key}`, lockId, "PX", ttlMs, "NX");

    if (acquired === "OK") {
      return lockId;
    }
    return null;
  }

  /**
   * Oslobadja lock samo ako lockId (uuid generatora) odgovara trenutnom vlasniku.
   */
  static async release(key: string, lockId: string): Promise<boolean> {
    const redis = DatabaseManager.getRegionalRedisConnection();
    if (!redis) return true;

    // Prilagođena optimalna inline LUA skripta sa "Lock Token Owner" validacijom
    const script = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;

    try {
      const result = await redis.eval(script, 1, `lock:${key}`, lockId);
      const success = result === 1 || result === "1" || Number(result) === 1;

      if (!success) {
        const currentOwner = await redis.get(`lock:${key}`);
        if (currentOwner) {
          logger.warn(
            `⚠️ [RedisLockManager] Lock Release Denied for key: "${key}". Current owner is "${currentOwner}", but process requested release with ID "${lockId}". This indicates a potential lock lease timeout/race condition!`
          );
        } else {
          if (env.NODE_ENV !== "production") console.info(`ℹ️ [RedisLockManager] Lock for key: "${key}" was already expired or released before.`);
        }
      }
      return success;
    } catch (err) {
      console.error("[RedisLockManager] Release failed", err);
      return false;
    }
  }

  /**
   * Pauzira izvrsenje odredjen broj milisekundi.
   */
  static async snooze(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
