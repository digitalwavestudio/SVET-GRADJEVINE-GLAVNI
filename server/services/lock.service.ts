import { getRedis } from "../utils/redis.ts";
import { v4 as uuidv4 } from "uuid";
import { CacheKeys } from "../constants/cache-keys.ts";
import { Logger, logger } from "../utils/logger.ts";

export class LockManager {
  private static activeLocks: Map<string, string> = new Map(); // ResourceId -> LockId
  private static memoryLocks = new Map<string, { expiresAt: number; lockId: string }>();

  private static get redis() {
    return getRedis();
  }

  /**
   * Acquires a distributed lock.
   * @returns LockId string if successful, null otherwise
   * @param ttlMs Time-to-live in milliseconds (default: 120000ms = 2 minutes for long-running jobs)
   */
  static async acquire(
    resourceId: string,
    ttlMs: number = 120000,
  ): Promise<string | null> {
    const lockId = uuidv4();
    const lockKey = CacheKeys.lock(resourceId);

    if (this.redis) {
      try {
        const result = await this.redis.set(lockKey, lockId, "PX", ttlMs, "NX");
        if (result === "OK") {
          this.activeLocks.set(resourceId, lockId);
          return lockId;
        }
        return null;
      } catch (error: any) {
        const msg = error.message.toLowerCase();
        const isNetwork = msg.includes("stream") || msg.includes("epipe") || msg.includes("closed") || msg.includes("connection");
        if (!isNetwork) {
          console.error(`[LockManager] Redis error for ${resourceId}:`, error);
        }
      }
    }

    // Memory Fallback
    const now = Date.now();
    const existing = this.memoryLocks.get(resourceId);
    if (existing && existing.expiresAt > now) return null;

    this.memoryLocks.set(resourceId, { expiresAt: now + ttlMs, lockId });
    this.activeLocks.set(resourceId, lockId);
    return lockId;
  }

  /**
   * Releases the lock safely using atomic check
   */
  static async release(resourceId: string, lockId: string): Promise<boolean> {
    if (this.redis) {
      try {
        const lockKey = CacheKeys.lock(resourceId);
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const result = await this.redis.eval(script, 1, lockKey, lockId);
        if (result === 1) {
          this.activeLocks.delete(resourceId);
          return true;
        }
        return false;
      } catch (error: any) {
        const msg = error.message.toLowerCase();
        const isNetwork = msg.includes("stream") || msg.includes("epipe") || msg.includes("closed") || msg.includes("connection");
        if (!isNetwork) {
          console.error(`[LockManager] Redis release error for ${resourceId}:`, error);
        }
      }
    }

    const existing = this.memoryLocks.get(resourceId);
    if (existing && existing.lockId === lockId) {
      this.memoryLocks.delete(resourceId);
      this.activeLocks.delete(resourceId);
      return true;
    }
    return false;
  }

  /**
   * Renews an existing lock by extending its TTL.
   * Used for long-running jobs that need heartbeat renewal.
   * @returns true if renewal successful, false if lock doesn't exist or lockId doesn't match
   */
  static async renew(
    resourceId: string,
    lockId: string,
    ttlMs: number = 120000,
  ): Promise<boolean> {
    if (this.redis) {
      try {
        const lockKey = CacheKeys.lock(resourceId);
        // Only renew if the lock still exists and lockId matches (atomic check)
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("pexpire", KEYS[1], ARGV[2])
          else
            return 0
          end
        `;
        const result = await this.redis.eval(script, 1, lockKey, lockId, ttlMs);
        return result === 1;
      } catch (error: any) {
        const msg = error.message.toLowerCase();
        const isNetwork = msg.includes("stream") || msg.includes("epipe") || msg.includes("closed") || msg.includes("connection");
        if (!isNetwork) {
          console.error(`[LockManager] Redis renew error for ${resourceId}:`, error);
        }
      }
    }

    // Memory Fallback
    const existing = this.memoryLocks.get(resourceId);
    if (existing && existing.lockId === lockId) {
      existing.expiresAt = Date.now() + ttlMs;
      return true;
    }
    return false;
  }

  static async gracefulCleanup(): Promise<void> {
    if (this.activeLocks.size === 0) return;
    logger.debug(`[LockManager] Shutdown cleanup: Releasing ${this.activeLocks.size} locks...`);

    for (const [id, lockId] of this.activeLocks.entries()) {
      await this.release(id, lockId);
    }
    this.memoryLocks.clear();
    this.activeLocks.clear();
  }
}
