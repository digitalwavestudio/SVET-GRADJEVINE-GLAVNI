import { env } from "../config/env.ts";
import { db } from "../config/firebase.ts";
import { CacheService } from "./cache.service.ts";
import { getRedis } from "../utils/redis.ts";
import { Logger, logger } from "../utils/logger.ts";

export class PresenceService {
  private static intervalId: NodeJS.Timeout | null = null;

  static async updatePresence(uid: string, status: "online" | "offline") {
    const now = new Date();

    // 1. Update active presence in Redis for fast read checks
    if (status === "online") {
      await CacheService.set(
        `presence:${uid}`,
        { state: "online", lastChanged: now.getTime() },
        300000 // 5 minutes TTL
      );
    } else {
      await CacheService.delete(`presence:${uid}`);
    }

    const hashKey = "presence:last_seen_buffer";
    const dataObj = { status, lastSeen: now.getTime() };

    // 2. Buffer the update in the local Redis hash for batch write-back
    const redis = getRedis();
    await redis.hset(hashKey, uid, JSON.stringify(dataObj));

    return { success: true };
  }

  static async flushPendingPresence(): Promise<void> {
    const redis = getRedis();
    const hashKey = "presence:last_seen_buffer";
    
    // Koristimo lock da samo jedna instanca u klasteru odradi flush
    const lockKey = "lock:presence_flush";
    const { LockManager } = await import("./lock.service.ts");
    const lockId = await LockManager.acquire(lockKey, 60000); // 1 minut lock
    if (!lockId) return;

    try {
      // 1. Preuzmi sve izmenjene korisnike iz Redis hash bafera
      const allBuffered = await redis.hgetall(hashKey);
      if (!allBuffered || Object.keys(allBuffered).length === 0) {
        return;
      }

      const entries = Object.entries(allBuffered);
      const chunkSize = 400; // Firestore batch limit je 500
      
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        const processedUids: string[] = [];

        for (const [uid, rawData] of chunk) {
          try {
            const { status, lastSeen } = JSON.parse(rawData);
            const lastSeenDate = new Date(lastSeen);
            
            const userRef = db.collection("users").doc(uid);
            batch.set(
              userRef,
              {
                isOnline: status === "online",
                lastSeen: lastSeenDate,
                updatedAt: lastSeenDate,
              },
              { merge: true }
            );
            processedUids.push(uid);
          } catch (e) {
            console.error(`[PresenceService] Fail to parse buffer for ${uid}:`, e);
          }
        }

        if (processedUids.length > 0) {
          await batch.commit();
          
          // Izbriši uspešno procesirane korisnike iz Redis hash bafera
          await redis.hdel(hashKey, ...processedUids).catch((err) => {
            console.error("[PresenceService] Failed to hdel from presence buffer:", err);
          });
        }
      }

      logger.debug(`[PresenceService] Uspešno upisan batch presence za ${entries.length} korisnika.`);
    } catch (error) {
      console.error("[PresenceService] Greška tokom flushPendingPresence:", error);
    } finally {
      await LockManager.release(lockKey, lockId);
    }
  }

  static async getPresence(uid: string) {
    const { userPresenceLoader } = await import("../utils/dataloader.ts");
    return userPresenceLoader.load(uid);
  }

  static init() {
    if (env.NODE_ENV === "production") {
      if (!this.intervalId) {
        // Svaka 5 minuta (5 * 60 * 1000 = 300000 ms)
        this.intervalId = setInterval(() => this.flushPendingPresence(), 300000);
        logger.debug("[PresenceService] Inicijalizovan periodični batch flush za prisustvo korisnika (svakih 5 minuta).");
      }
    }
  }

  static shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Pokrećemo inicijalizaciju planera
PresenceService.init();
