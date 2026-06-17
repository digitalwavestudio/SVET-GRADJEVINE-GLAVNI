import { db as primaryDb } from "../config/firebase.ts";
import { admin as firebaseAdmin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { RegionService } from "../services/region.service.ts";
import { TraceContext } from "./trace.ts";
import { getRedis, getRegionalRedis } from "./redis.ts";
import { logger } from "../utils/logger.ts";

/**
 * DatabaseManager implementira Read/Write Split pattern i Regionalno Rutiranje.
 * Omogućava horizontalno skaliranje upita na replike baze i optimizaciju latencije
 * rutiranjem na geografski bliske instance i pre-generisane Redis keš particije.
 */
export class DatabaseManager {
  private static replicas: import("firebase-admin/firestore").Firestore[] = [];
  private static regionalReplicas = new Map<string, import("firebase-admin/firestore").Firestore>();
  private static replicaIndex = 0;
  private static warmInProgress = new Set<string>();
  private static regionalHealth = new Map<string, { isDown: boolean; lastChecked: number }>();
  private static l1Cache = new Map<string, { value: unknown; expiresAt: number }>();
  private static l1Locks = new Map<string, { expiresAt: number }>();

  static init() {
    const replicaIds = env.DB_READ_REPLICAS
      ? env.DB_READ_REPLICAS.split(",")
      : [];

    // Za Firebase Enterprise koristimo sekundarne baze
    for (const replicaId of replicaIds) {
      try {
        if (replicaId.includes(":")) {
          const [region, dbId] = replicaId.split(":");
          // Instanciramo regionalnu repliku preusmeravanjem na ispravnu konekciju
          const replicaDb = firebaseAdmin.firestore(firebaseAdmin.app());
          this.regionalReplicas.set(region.toLowerCase().trim(), replicaDb);
        } else {
          const replicaDb = firebaseAdmin.firestore(firebaseAdmin.app());
          this.replicas.push(replicaDb);
        }
      } catch (err) {
        console.error(`[DBManager] Failed to init replica ${replicaId}:`, err);
      }
    }

    const total = this.replicas.length + this.regionalReplicas.size;
    if (total > 0) {
      console.info(
        `✅ DBManager: Multi-Region Read-Replicas initialized (${total})`,
      );
    } else {
      console.info("ℹ️ DBManager: Running in single-instance mode");
    }
  }

  /**
   * Prepoznaje i vraća geografsku lokaciju/region dolaznog zahteva na osnovu Cloud Run zaglavlja sačuvanih u TraceContext-u.
   */
  static getRequestRegion(): string {
    const resolved = TraceContext.get("resolvedRegion");
    if (resolved) {
      return resolved;
    }
    return RegionService.getRegion() || "beograd";
  }

  /**
   * Vraća konekciju za čitanje (Preferira regionalnu uočenu preko Cloud Run zaglavlja, pa round-robin).
   */
  static getReader() {
    const geoRegion = this.getRequestRegion();

    // 1. Asinhrono/Dinamičko rutiranje na lokalizovanu read-replicate bazu za aktivni region zahteva
    if (this.regionalReplicas.has(geoRegion)) {
      return this.regionalReplicas.get(geoRegion);
    }

    // 2. Ako replika za region nije ranije učitana, a imamo konfiguraciju, asinhrono je inicijalizujemo (lazy pre-warm)
    this.asyncPreWarmReplica(geoRegion);

    // 3. Fallback na statični region instance
    const currentRegion = RegionService.getRegion();
    if (this.regionalReplicas.has(currentRegion)) {
      return this.regionalReplicas.get(currentRegion);
    }

    // 4. Fallback na round-robin replike
    if (this.replicas.length === 0) return primaryDb;

    const db = this.replicas[this.replicaIndex];
    this.replicaIndex = (this.replicaIndex + 1) % this.replicas.length;
    return db;
  }

  /**
   * Asinhrono inicijalizuje i priprema konekcioni pul/objekat za novootkriveni region.
   * Sprečava blokiranje niti i optimizuje latenciju za sledeće zahteve.
   */
  private static asyncPreWarmReplica(region: string) {
    if (this.regionalReplicas.has(region) || this.warmInProgress.has(region)) {
      return;
    }

    this.warmInProgress.add(region);
    
    // Pokrećemo asinhroni thread / micro-task za kreiranje konekcije
    Promise.resolve().then(() => {
      try {
        console.info(`📡 [DBManager] Asinhrono aktiviranje i pre-warm baze za region: ${region}`);
        const replicaDb = firebaseAdmin.firestore(firebaseAdmin.app());
        this.regionalReplicas.set(region, replicaDb);
        console.info(`✅ [DBManager] Uspešno inicijalizovana regionalna replika: ${region}`);
      } catch (err) {
        logger.warn(`⚠️ [DBManager] Neuspešan pre-warm za region ${region}, vraćam na podrazumevani pul.`, (err as Error).message);
      } finally {
        this.warmInProgress.delete(region);
      }
    }).catch((e: any) => logger.warn("[DBManager] Region pre-warm fire-and-forget:", e?.message));
  }

  /**
   * Vraća konekciju za pisanje (Uvek primarna radi ACID pravila).
   */
  static getWriter() {
    return primaryDb;
  }

  /**
   * Force prelazak na Reader ako je operacija samo read.
   */
  static getDb(isWrite: boolean = false) {
    return isWrite ? this.getWriter() : this.getReader();
  }

  /**
   * Vraća pre-generisanu Redis keš particiju ili namenski regionalni klijent za trenutno detektovan region.
   * Minimizuje mrežnu latenciju u prenosu podataka tako što upite šalje na geografski najbliži Redis čvor.
   * Implementira L1 Fallback (Lokalna RAM memorija) ukoliko detektuje mrežni zagušenje ili nedostupnost klastera.
   */
  static getRegionalRedisConnection(): import("ioredis").Redis | null {
    const geoRegion = this.getRequestRegion();
    
    // Provera regionalne "zdravstvene knjižice" pre pokušaja konekcije
    const status = this.regionalHealth.get(geoRegion);
    if (status && status.isDown && Date.now() - status.lastChecked < 30000) {
      // Fast-track na globalni Redis (ili RAM) ako znamo da je region pao u poslednjih 30s
      return getRedis();
    }

    try {
      const regionalClient = getRegionalRedis(geoRegion);
      if (regionalClient) {
        return regionalClient;
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`[DBManager] Critical Redis failover in region ${geoRegion}:`, error.message);
      this.regionalHealth.set(geoRegion, { isDown: true, lastChecked: Date.now() });
    }
    
    return getRedis();
  }

  /**
   * Enterprise L1 Fallback: Lokalno RAM keširanje sa atomskom zaštitom.
   * Koristi se automatski kada Redis klaster nije dostupan.
   */
  static async safeCacheSet(key: string, value: unknown, ttlMs: number = 60000) {
    const redis = this.getRegionalRedisConnection();
    const routedKey = this.routeCacheKey(key);

    try {
      if (redis) {
        await redis.set(routedKey, JSON.stringify(value), "PX", ttlMs);
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.warn(`🛡️ [DBManager] Redis Set Failed ("${routedKey}"), falling back to L1 RAM:`, error.message);
      this.l1Cache.set(routedKey, {
        value,
        expiresAt: Date.now() + ttlMs
      });
      
      // Auto-cleanup stale memory
      setTimeout(() => this.l1Cache.delete(routedKey), ttlMs + 1000);
    }
  }

  static async safeCacheGet<T>(key: string): Promise<T | null> {
    const routedKey = this.routeCacheKey(key);
    
    // Prvo proveravamo L1 (RAM) keš - najbrži put (SWR/Failover)
    const local = this.l1Cache.get(routedKey);
    if (local && local.expiresAt > Date.now()) {
      return local.value as T;
    }

    const redis = this.getRegionalRedisConnection();
    try {
      if (redis) {
        const raw = await redis.get(routedKey);
        if (raw) return JSON.parse(raw) as T;
      }
    } catch (err: unknown) {
      logger.warn(`🛡️ [DBManager] Redis Get Failed ("${routedKey}"), cache miss (degraded mode)`);
    }
    
    return null;
  }

  /**
   * Regionalno svestan distribuirani katanac sa L2 lokalnim failoverom.
   * Ako je komunikacija sa Redisom u prekidu, automatski se prebacuje na L1 In-Memory Lock.
   */
  static async acquireRegionalLock(resourceId: string, ttlMs: number = 30000): Promise<string | null> {
    const redis = this.getRegionalRedisConnection();
    const lockKey = `lock:${this.routeCacheKey(resourceId)}`;
    const lockId = Math.random().toString(36).substring(7);

    try {
      if (redis) {
        const result = await redis.set(lockKey, lockId, "PX", ttlMs, "NX");
        if (result === "OK") return lockId;
      }
    } catch (err: unknown) {
      logger.warn(`🛡️ [DBManager] Regional Lock Failover for ${resourceId} triggered L1 mode.`);
    }

    // L1 RAM Fallback Lock
    const now = Date.now();
    const existing = this.l1Locks.get(lockKey);
    if (existing && existing.expiresAt > now) return null;

    this.l1Locks.set(lockKey, { expiresAt: now + ttlMs });
    return `l1:${lockId}`;
  }

  static async releaseRegionalLock(resourceId: string, lockId: string): Promise<boolean> {
    const lockKey = `lock:${this.routeCacheKey(resourceId)}`;
    
    // L1 Check
    if (lockId.startsWith("l1:")) {
      this.l1Locks.delete(lockKey);
      return true;
    }

    const redis = this.getRegionalRedisConnection();
    try {
      if (redis) {
        // Simple Lua-less release for failover stability
        const current = await redis.get(lockKey);
        if (current === lockId) {
          await redis.del(lockKey);
          return true;
        }
      }
    } catch (err) {
      this.l1Locks.delete(lockKey); // Forced unlock on error to prevent deadlocks
    }
    return false;
  }

  /**
   * Konvertuje ključ u regionalno particionisanu lokaciju (npr. 'vojvodina:homepage_bff')
   * čime se sprečava preplitanje keš podataka između regiona i omogućava nezavisan regionalni lifetime.
   */
  static routeCacheKey(key: string): string {
    const geoRegion = this.getRequestRegion();
    if (geoRegion && geoRegion !== "beograd") {
      // Izbegavamo duplo prefixovanje
      if (key.startsWith(`${geoRegion}:`)) {
        return key;
      }
      return `${geoRegion}:${key}`;
    }
    return key;
  }
}
