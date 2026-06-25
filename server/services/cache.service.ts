import { MonitoringService } from "./monitoring.service.ts";
import { getRedis } from "../utils/redis.ts";
import { RedisLockManager } from "../utils/redis-lock.ts";
import { DatabaseManager } from "../utils/db-manager.ts";
import { checkQuotaStatus } from "../config/firebase.ts";
import { AdaptiveQosService } from "./adaptive-qos.service.ts";
import { CACHE_PREFIXES, CacheKeys } from "../constants/cache-keys.ts";
import zlib from "zlib";
import { Logger, logger } from "../utils/logger.ts";

/**
 * Centralizovani servis za keširanje.
 * L1 (In-Memory) + L2 (Redis Cluster) Hibrid.
 */
export class CacheService {
  private static localCache = new Map<string, { value: unknown; expiry: number; hits: number }>();
  private static inFlight = new Map<string, Promise<unknown>>();


  private static async executeWithTimeout<R>(fn: () => Promise<R>, timeoutMs: number = 25000): Promise<R> {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<R>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Fetch timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      if (timer) clearTimeout(timer);
      return result;
    } catch (err) {
      if (timer) clearTimeout(timer);
      throw err;
    }
  }

  // Enterprise Strategy: Compress large HTML/String/Array keys to save Redis Memory
  private static shouldCompress(key: string): boolean {
    return key.startsWith(CACHE_PREFIXES.SEO_SCHEMA) ||
           key.startsWith("fallback_search_") ||
           key.startsWith("unified_search_") ||
           key.startsWith(CACHE_PREFIXES.SWR_ENVELOPE);
  }

  // Enterprise Hot Keys Optimization: Localize super-hot objects in-memory to reduce CPU & network constraints under 50k RPS
  private static isHotKey(key: string): boolean {
    const cleanKey = key.includes(":") ? key.substring(key.indexOf(":") + 1) : key;
    return key.startsWith(CACHE_PREFIXES.AD_DETAIL) ||
           key.startsWith("hot_") ||
           key.startsWith(CACHE_PREFIXES.DASHBOARD_STATS) ||
           key.startsWith(CACHE_PREFIXES.EMPLOYER_STATS) ||
           key.startsWith(CACHE_PREFIXES.ADMIN_STATS) ||
           key.startsWith("metadata") ||
           key.startsWith(CACHE_PREFIXES.SWR_ENVELOPE + CACHE_PREFIXES.AD_DETAIL);
  }

  private static get redisClient() {
    const cl = DatabaseManager.getRegionalRedisConnection();
    if (!cl) return null;
    if (typeof cl.status === 'string') {
      // Proxy with "end" status still routes to InMemoryFallback — locking works within process
      if (cl.status === 'end') return cl;
      if (cl.status !== 'ready' && cl.status !== 'connecting') return null;
    }
    return cl;
  }

  /**
   * Rešava problem 'Cache Stampede' / thundering herd.
   * Koristi distribuirani globalni katanac (RedisLockManager) za Cloud Run flotu.
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 300000,
  ): Promise<T> {
    // 1. Synchronous L1 inFlight check at the VERY ENTRY (SingleFlight coalescing)
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const execute = async (): Promise<T> => {
      // Provera keša L1 & L2
      let cached = await this.get<T>(key);
      if (cached !== null) return cached;

      // ADR 003: Pre-emptive Quota Guard (Ako nema ni bajatog keša, ne pokušavamo upit na bazu)
      if (checkQuotaStatus()) {
         logger.warn(`[CacheService] 🛡️ Pre-emptive Quota Guard: Baza zaštićena. Nema stale keša za ${key}, obustavljam block-fetch.`);
         throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
      }

      let lockId: string | null = null;
      let acquired = false;

      if (this.redisClient) {
        for (let i = 0; i < 10; i++) {
          try {
            lockId = await RedisLockManager.acquire(key, ttlMs);
            if (lockId) {
              acquired = true;
              break;
            }
          } catch (lockErr: unknown) {
            logger.warn(`[CacheService] RedisLockManager.acquire failed for key ${key}:`, lockErr instanceof Error ? lockErr.message : String(lockErr));
            break;
          }

          await RedisLockManager.snooze(50);
          try {
            cached = await this.get<T>(key);
            if (cached !== null) {
              return cached;
            }
          } catch (getErr) {
            // Ignorišemo grešku i nastavljamo dalje
          }
        }
      }

      // ADR 003: Provera Throughput-a pre samog izrsavanja
      const isThroughputSafe = await AdaptiveQosService.recordReadIntent();
      if (!isThroughputSafe) {
         logger.warn(`[CacheService] 🛡️ Adaptive QoS: Throughput spike detektovan za ${key}. Baza se stiti (Block-fetch denied).`);
         throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
      }

      try {
        const val = await fetchFn();
        await this.set(key, val, ttlMs);
        return val;
      } finally {
        if (acquired && lockId) {
          await RedisLockManager.release(key, lockId).catch((e: any) => logger.warn("[CacheService] Redis lock release:", e));
        }
      }
    };

    const promise = execute().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Rešava problem 'Cache Stampede' / thundering herd koristeći Stale-While-Revalidate (SWR) uz RedisLockManager.
   * Ako je keš istekao, prvi zahtev počinje revalidaciju u pozadini dok ostalih 19 odmah dobija 'stale'
   * podatke produžene za 15 sekundi u cilju očuvanja resursa.
   */
  static async getOrSetSWR<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 300000,
    fallbackValue?: T,
    timeoutMs: number = 25000
  ): Promise<T> {
    const swrKey = CacheKeys.swr(key);
    const lockKey = CacheKeys.swrLock(key);
    const backoffKey = CacheKeys.swrBackoff(key);

    // 1. Synchronous L1 inFlight check at the VERY ENTRY (SingleFlight coalescing)
    if (this.inFlight.has(swrKey)) {
      return this.inFlight.get(swrKey) as Promise<T>;
    }

    interface SWREnvelope<T> {
      isSWR: boolean;
      expiresAt: number;
      staleFallbackUntil: number;
      data: T;
    }

    const executeSWR = async (): Promise<T> => {
      // 1. Provera postojanja SWR koverte u L1 / L2 kešu
      const envelope = await this.get<SWREnvelope<T>>(swrKey);
      const now = Date.now();

      if (envelope && envelope.isSWR) {
        // Keš je u potpunosti svež i validan -> vrati ga odmah
        if (now <= envelope.expiresAt) {
          return envelope.data;
        }

        // Keš je prešao u 'stale' stanje, a prozor za fallback je i dalje otvoren
        if (now <= envelope.staleFallbackUntil) {
          // Provera da li smo u backoff periodu zbog prethodnih grešaka revalidacije
          try {
            const backoff = await this.get<{ errorCount: number; retryAfter: number }>(backoffKey);
            if (backoff && now < backoff.retryAfter) {
              logger.debug(`[CacheService SWR] Background revalidation backoff active for ${key}. Skipping retry for another ${Math.round((backoff.retryAfter - now) / 1000)}s.`);
              return envelope.data;
            }
          } catch (err) {
            logger.warn(`[CacheService SWR] Failed to check SWR backoff for ${key}:`, err);
          }

          // Pokušaj preuzimanja distributed lock-a (jedan pobednik) za asinhronu pozadinsku revalidaciju
          const lockId = await RedisLockManager.acquire(lockKey, 30000).catch(() => null);

          if (lockId) {
            // Ovaj zahtev je pobednik i preuzima revalidaciju
            logger.debug(`[CacheService SWR] Acquired background lock for ${key}. Revalidating...`);
            
            // ADR 003: Provera Throughput-a
            AdaptiveQosService.recordReadIntent().then((isThroughputSafe) => {
               if (!isThroughputSafe) {
                 logger.warn(`[CacheService SWR] 🛡️ Adaptive QoS: Background revalidation obustavljena zbog spike-a.`);
                 throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
               }
               return this.executeWithTimeout(fetchFn, timeoutMs);
            })
              .then(async (freshData) => {
                const newEnvelope: SWREnvelope<T> = {
                  isSWR: true,
                  expiresAt: Date.now() + ttlMs,
                  staleFallbackUntil: Date.now() + ttlMs + 24 * 60 * 60 * 1000, // 24h fallback prozor
                  data: freshData,
                };
                await this.set(swrKey, newEnvelope, ttlMs + 24 * 60 * 60 * 1000);
                // Clear current backoff upon successful revalidation
                await this.delete(backoffKey).catch((e: any) => logger.warn("[CacheService] SWR delete backoff key:", e));
                logger.debug(`[CacheService SWR] Successfully refreshed SWR cache for key: ${key}`);
              })
              .catch(async (err) => {
                console.error(`[CacheService SWR] Background revalidation failed for key: ${key}`, err);
                // Update backoff exponentially
                try {
                  const currentBackoff = await this.get<{ errorCount: number; retryAfter: number }>(backoffKey).catch(() => null);
                  const errorCount = currentBackoff ? currentBackoff.errorCount + 1 : 1;
                  const delay = Math.min(1000 * Math.pow(2, errorCount - 1), 300000); // 1s, 2s, 4s, 8s, up to 5 min
                  const retryAfter = Date.now() + delay;
                  await this.set(backoffKey, { errorCount, retryAfter }, delay + 60000);
                  logger.debug(`[CacheService SWR] Exponential backoff registered for ${key}. Attempts: ${errorCount}, delay: ${delay / 1000}s.`);
                } catch (e) {
                  console.error("[CacheService SWR] Failed to update backoff metadata:", e);
                }
              })
              .finally(async () => {
                await RedisLockManager.release(lockKey, lockId).catch((e: any) => logger.warn("[CacheService] SWR lock release after revalidation:", e));
              });

            // Pobednik takođe odmah dobija stale podatak da ne bi čekao na spori DB odziv (UX <5ms)
            return envelope.data;
          } else {
            // Lock je zauzet, neko drugi već radi revalidaciju. 
            // Serviramo trenutni 'stale' podatak
            logger.debug(`[CacheService SWR] Revalidation lock holds. Serving stale data for key: ${key}`);
            return envelope.data;
          }
        }
      }

      // 2. Hladan start (nema keša ili je fallback prozor prošao) -> radimo sinhroni blokirajući fetch sa lock zaštitom
      const hasRedis = !!this.redisClient;

      // PRE-EMPTIVE QUOTA CHECK: If we know quota is exhausted, don't even try the fetch
      if (checkQuotaStatus()) {
         if (fallbackValue !== undefined) {
           logger.warn(`[CacheService SWR] 🛡️ Pre-emptive Quota Fallback activated for ${key}`);
           return fallbackValue;
         } else {
           logger.warn(`[CacheService SWR] 🛡️ Pre-emptive Quota Guard: Baza zaštićena. Obustavljam cold-start fetch za ${key}`);
           throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
         }
      }

      const lockId = hasRedis ? await RedisLockManager.acquire(lockKey, 30000).catch(() => null) : null;
      if (hasRedis && !lockId) {
        // Čekamo u krugovima nadajući se da će druga nit završiti upis sveže koverte
        // Smanjujemo broj retry-ja i povećavamo delay da smanjimo "noise" u logovima
        for (let i = 0; i < 5; i++) {
          await RedisLockManager.snooze(250);
          const retryEnv = await this.get<SWREnvelope<T>>(swrKey);
          if (retryEnv && retryEnv.data) {
            return retryEnv.data;
          }
        }
      }

      try {
        logger.debug(`[CacheService SWR] Cold-start block-fetch for key: ${key}`);
        
        // ADR 003: Provera Throughput-a
        const isThroughputSafe = await AdaptiveQosService.recordReadIntent();
        if (!isThroughputSafe) {
           logger.warn(`[CacheService SWR] 🛡️ Adaptive QoS: Cold-start block-fetch obustavljen zbog spike-a.`);
           throw new Error("QUOTA_EXHAUSTED_NO_STALE_CACHE");
        }

        const freshData = await this.executeWithTimeout(fetchFn, timeoutMs);
        const newEnvelope: SWREnvelope<T> = {
          isSWR: true,
          expiresAt: Date.now() + ttlMs,
          staleFallbackUntil: Date.now() + ttlMs + 24 * 60 * 60 * 1000,
          data: freshData,
        };
        await this.set(swrKey, newEnvelope, ttlMs + 24 * 60 * 60 * 1000);
        // Cold-start success should also clear any existing backoff
                await this.delete(backoffKey).catch((e: any) => logger.warn("[CacheService] Cold-start delete backoff key:", e));
                return freshData;
      } catch (err: unknown) {
        // CRITICAL FALLBACK: If cold start fails, check if we have ANY stale data to return
        const backup = await this.get<SWREnvelope<T>>(swrKey).catch(() => null);
        if (backup && backup.data) {
           logger.warn(`[CacheService SWR] Recovered cold-start failure using stale backup for ${key}`);
           return backup.data;
        }
        
        if (fallbackValue !== undefined) {
           logger.warn(`[CacheService SWR] Recovered cold-start failure using provided fallbackValue for ${key}`);
           return fallbackValue;
        }

        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[CacheService SWR] Cold-start fetch failed for ${key} and no fallback available:`, errorMsg);
        throw err;
      } finally {
        if (lockId) {
          await RedisLockManager.release(lockKey, lockId).catch((e: any) => logger.warn("[CacheService] Cold-start lock release:", e));
        }
      }
    };

    const promise = executeSWR().finally(() => {
      this.inFlight.delete(swrKey);
    });

    this.inFlight.set(swrKey, promise);
    return promise;
  }

  /**
   * Postavlja vrednost u L1 i L2 keš.
   * L1 keš ima kraći TTL (max 10 sekundi) kako bi stitio Redis od ludnice,
   * a pritom izbegao stale data problem na Cloud Runtu.
   */
  static async set<T>(
    key: string,
    value: T,
    ttlMs: number = 300000,
  ): Promise<void> {
    const routedKey = DatabaseManager.routeCacheKey(key);
    const client = this.redisClient;
    // If Redis is active, L1 maxes at 10s to prevent stale data. If no Redis, L1 MUST use full TTL to protect DB.
    let l1TtlMs = client ? Math.min(ttlMs, 10000) : ttlMs;

    // Enterprise 50k RPS opt: keep hot keys at least 5000ms locally in L1 to prevent network/CPU card bottlenecks
    if (this.isHotKey(routedKey)) {
      l1TtlMs = Math.max(l1TtlMs, 5000);
    }

    // Uvek setujemo L1 sa praćenjem poseta
    const currentItem = this.localCache.get(routedKey);
    const prevHits = currentItem ? currentItem.hits : 0;

    this.localCache.set(routedKey, {
      value,
      expiry: Date.now() + l1TtlMs,
      hits: prevHits + 1,
    });

    // Sprečavamo preveliku potrošnju memorije - Smart LFU/LRU Eviction za L1
    if (this.localCache.size > 2000) {
      let candidateKey: string | null = null;
      let minScore = Infinity;
      const now = Date.now();

      for (const [k, item] of this.localCache.entries()) {
        if (now > item.expiry) {
          candidateKey = k;
          break;
        }
        const score = (item.hits || 1) * (item.expiry - now);
        if (score < minScore) {
          minScore = score;
          candidateKey = k;
        }
      }

      if (candidateKey) {
        this.localCache.delete(candidateKey);
      } else {
        const oldestKey = this.localCache.keys().next().value;
        if (oldestKey) this.localCache.delete(oldestKey);
      }
    }

    // Setujemo u L2 (Envelope Pattern za Stale-Cache otpornost - ADR 003)
    if (client) {
      try {
        const envelope = {
          __isEnvelope: true,
          data: value,
          expiry: Date.now() + ttlMs,
        };
        const payloadString = JSON.stringify(envelope);
        let redisPayload = payloadString;
        
        // Optimizacija: Automatska kompresija za bilo koji payload veći od 2KB kako bi sačuvali bandwidth i RAM Redisa
        if (this.shouldCompress(routedKey) || payloadString.length > 2048) {
           const compressed = zlib.gzipSync(Buffer.from(payloadString)).toString("base64");
           redisPayload = "GZ64:" + compressed;
        }

        const staleRetentionMs = 20 * 24 * 60 * 60 * 1000;
        const redisPx = Math.min(ttlMs + staleRetentionMs, 2_147_483_647);
        await client.set(routedKey, redisPayload, "PX", redisPx);
      } catch (err) {
        console.error("[CacheService] Redis set error:", err);
      }
    }

  }

  /**
   * Dobavlja vrednost iz keša. L1 -> L2 fallback.
   */
  static async get<T>(key: string, ignoreTTL: boolean = false): Promise<T | null> {
    const routedKey = DatabaseManager.routeCacheKey(key);
    const tracker = MonitoringService.startSegment("cache_lookup", { key: routedKey });
    try {
      // 1. Provera L1 (Local RAM)
      const item = this.localCache.get(routedKey);
      if (item && (ignoreTTL || Date.now() <= item.expiry)) {
        item.hits = (item.hits || 0) + 1;
        const prefix = routedKey.split(":")[0];
        MonitoringService.recordCacheHit("L1", prefix);
        tracker.end({ hit: true, cache_layer: "L1" });
        return item.value as T;
      } else if (item) {
        // Istekao L1
        this.localCache.delete(routedKey);
      }

      // 2. Provera L2 (Redis) - ADR 003 Stale-Cache Adaptive QoS
      const client = this.redisClient;
      if (client) {
        try {
          const val = await client.get(routedKey);
          if (val) {
            let payloadStr = val;
            if (val.startsWith("GZ64:")) {
               const buffer = Buffer.from(val.slice(5), "base64");
               payloadStr = zlib.gunzipSync(buffer).toString("utf-8");
            }

            let parsed = JSON.parse(payloadStr);

            // Stale-Cache (Envelope) Evaluator
            if (parsed && typeof parsed === "object" && parsed.__isEnvelope) {
              const logicalExpired = Date.now() > parsed.expiry;
              
              if (logicalExpired && !ignoreTTL) {
                // Ako je istekao, a NE štitimo bazu, ignorišemo keš (force refresh)
                if (!checkQuotaStatus()) {
                  this.localCache.delete(routedKey); // Očisti mogući stari rep
                  tracker.end({ hit: false, reason: "logical_expiry" });
                  return null;
                } else {
                  logger.warn(`[CacheService] 🛡️ QoS Quota Guard: Serviram STALE-CACHE (istekle podatke) za ključ ${routedKey}`);
                }
              }
              // Raspakuj u originalni oblik ukoliko je prošao evaluaciju ili je još svež
              parsed = parsed.data;
            }

            const prefix = routedKey.split(":")[0];
            MonitoringService.recordCacheHit("L2", prefix);
            
            // Hydrate L1 from L2 for short burst protection
            // Podizemo burst saobracaja na duzi nivo za local L1 kada smo u aktivnoj Quota zastiti ili za hotkeys
            let hydratedTtl = checkQuotaStatus() ? 60000 : 10000;
            if (this.isHotKey(routedKey)) {
              hydratedTtl = Math.max(hydratedTtl, 5000);
            }
            this.localCache.set(routedKey, {
              value: parsed,
              expiry: Date.now() + hydratedTtl,
              hits: (item?.hits || 0) + 1,
            });
            tracker.end({ hit: true, cache_layer: "L2" });
            return parsed as T;
          }
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error("[CacheService] Redis get error, attempting local stale recovery:", errorMsg);
          // Rescue using Stale Local L1: If we have the expired item in local memory, return it gracefully rather than crashing or hitting DB
          if (item) {
            logger.warn(`[CacheService] 🛡️ Failover Recovery: Serviram istekli lokalni L1 za ključ ${routedKey} usled mrežnih/Redis problema.`);
            // Privremeno ga re-setujemo na par sekundi u L1 da sledeći burstovi ne zaguše sistem
            const recoveryTtl = this.isHotKey(routedKey) ? 5000 : 2000;
            this.localCache.set(routedKey, {
              value: item.value,
              expiry: Date.now() + recoveryTtl,
              hits: item.hits + 1,
            });
            tracker.end({ hit: true, cache_layer: "L1_failover_stale" });
            return item.value as T;
          }
        }
      }

      const prefix = routedKey.split(":")[0];
      MonitoringService.recordCacheMiss(prefix);
      tracker.end({ hit: false });
      return null;
    } catch (err) {
      tracker.end({ error: (err as Error).message });
      throw err;
    }
  }

  /**
   * Enterprise-Grade MGET Optimizacija: Grupni dohvat ključeva koji drastično štedi mrežne resurse i RTT ka Redisu.
   */
  static async getMultiple<T>(keys: string[], ignoreTTL: boolean = false): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    if (keys.length === 0) return results;

    const missingKeysWithRouted: { original: string; routed: string }[] = [];
    
    // 1. Provera lokalnog L1 keša
    for (const key of keys) {
      const routedKey = DatabaseManager.routeCacheKey(key);
      const item = this.localCache.get(routedKey);
      if (item && (ignoreTTL || Date.now() <= item.expiry)) {
        item.hits = (item.hits || 0) + 1;
        const prefix = routedKey.split(":")[0];
        MonitoringService.recordCacheHit("L1", prefix);
        results.set(key, item.value as T);
      } else {
        if (item) this.localCache.delete(routedKey);
        missingKeysWithRouted.push({ original: key, routed: routedKey });
      }
    }

    if (missingKeysWithRouted.length === 0) {
      return results;
    }

    // 2. Jednokružni dohvat sa L2 (Redis MGET)
    const client = this.redisClient;
    if (client) {
      try {
        const routedKeysToFetch = missingKeysWithRouted.map(k => k.routed);
        const values = await client.mget(...routedKeysToFetch);

        for (let i = 0; i < missingKeysWithRouted.length; i++) {
          const originalKey = missingKeysWithRouted[i].original;
          const routedKey = missingKeysWithRouted[i].routed;
          const val = values[i];

          if (val) {
            try {
              let payloadStr = val;
              if (val.startsWith("GZ64:")) {
                const buffer = Buffer.from(val.slice(5), "base64");
                payloadStr = zlib.gunzipSync(buffer).toString("utf-8");
              }

              let parsed = JSON.parse(payloadStr);

              if (parsed && typeof parsed === "object" && parsed.__isEnvelope) {
                const logicalExpired = Date.now() > parsed.expiry;
                if (logicalExpired && !ignoreTTL) {
                  if (!checkQuotaStatus()) {
                    results.set(originalKey, null);
                    continue;
                  } else {
                    logger.warn(`[CacheService] 🛡️ QoS Quota Guard MGET: Serviram STALE-CACHE za ${routedKey}`);
                  }
                }
                parsed = parsed.data;
              }

              const prefix = routedKey.split(":")[0];
              MonitoringService.recordCacheHit("L2", prefix);

              let hydratedTtl = checkQuotaStatus() ? 60000 : 10000;
              if (this.isHotKey(routedKey)) {
                hydratedTtl = Math.max(hydratedTtl, 5000);
              }
              
              this.localCache.set(routedKey, {
                value: parsed,
                expiry: Date.now() + hydratedTtl,
                hits: 1,
              });

              results.set(originalKey, parsed as T);
            } catch (err) {
              console.error(`[CacheService] MGET parsing/compression error for ${routedKey}:`, err);
              results.set(originalKey, null);
            }
          } else {
            const prefix = routedKey.split(":")[0];
            MonitoringService.recordCacheMiss(prefix);
            results.set(originalKey, null);
          }
        }
      } catch (err) {
        console.error("[CacheService] Redis MGET error:", err);
        for (const item of missingKeysWithRouted) {
          const singleVal = await this.get<T>(item.original, ignoreTTL).catch(() => null);
          results.set(item.original, singleVal);
        }
      }
    } else {
      for (const item of missingKeysWithRouted) {
        results.set(item.original, null);
      }
    }

    return results;
  }

  /**
   * CountCache Segment (Shield)
   * Trajno keširanje broja rezultata pretrage (count aggregation).
   * TTL: 60 minuta.
   */
  static async getQueryCount(queryKey: string, fetchFn: () => Promise<number>): Promise<number> {
    const cacheKey = `count:${queryKey}`;
    return this.getOrSet(cacheKey, fetchFn, 3600000); // 60 min TTL
  }

  private static isListenerRunning = false;
  private static STREAM_NAME = "cache_invalidation_stream";

  /**
   * Pokreće ne-blokirajući asinhroni Redis Stream listener za invalidaciju L1 keša na svim Cloud Run kontejnerima.
   */
  static startStreamListener(): void {
    if (this.isListenerRunning) return;

    const runStreamReader = async () => {
      try {
        const { getStreamRedis } = await import("../utils/redis.ts");
        const sub = getStreamRedis();
        if (!sub) {
          logger.warn("[CacheService] Redis stream klijent nije konfigurisan. Invalidation Stream je isključen (graceful fallback).");
          return;
        }

        this.isListenerRunning = true;
        logger.debug(`🚀 [CacheService] Pokrenut ne-blokirajući Redis Stream listener: ${this.STREAM_NAME}`);

        let lastId = "$"; // Čitamo samo nove zapise od trenutka pokretanja kontejnera

        const poll = async () => {
          if (!this.isListenerRunning) return;
          try {
            const results = await sub.xread("BLOCK", 5000, "STREAMS", this.STREAM_NAME, lastId);
            if (results && results.length > 0) {
              for (const [stream, messages] of results) {
                if (stream === this.STREAM_NAME) {
                  for (const [id, fields] of messages) {
                    lastId = id; // Pomeramo kursor ID-ja
                    
                    const data: Record<string, string> = {};
                    for (let i = 0; i < fields.length; i += 2) {
                      data[fields[i]] = fields[i + 1];
                    }

                    if (data.action === "delete" && data.key) {
                      this.deleteLocalOnly(data.key);
                    } else if (data.action === "invalidate_prefix" && data.prefix) {
                      this.deleteLocalByPrefixOnly(data.prefix);
                    } else if (data.action === "clear") {
                      this.localCache.clear();
                    }
                  }
                }
              }
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            // Ako stream još ne postoji u Redisu, resetujemo kursor
            if (errMsg.includes("ERR") || errMsg.includes("no such key")) {
              lastId = "$";
            } else if (errMsg.toLowerCase().includes("offlinequeue") || errMsg.toLowerCase().includes("writeable")) {
              logger.warn("[CacheService Invalidation Stream] Aktiviran lokalni in-memory fallback.");
            } else {
              logger.warn("[CacheService Stream Reader Exception]:", errMsg);
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          if (this.isListenerRunning) {
            setTimeout(poll, 50);
          }
        };

        try {
          poll();
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          console.error("[CacheService] Neuspešna inicijalizacija invalidation streama:", errMsg);
        }
      } catch (error) {
        console.error("[CacheService] runStreamReader initialization failed:", error);
      }
    };

    runStreamReader().catch((err) => {
      console.error("[CacheService] Stream parent loop crashed:", err);
    });
  }

  /**
   * Briše ključ isključivo iz in-memory L1 keša ovog kontejnera (sprečava petlje)
   */
  static deleteLocalOnly(key: string): void {
    const routedKey = DatabaseManager.routeCacheKey(key);
    this.localCache.delete(routedKey);
  }

  /**
   * Briše ključeve sa specifičnim prefiksom isključivo iz in-memory L1 keša ovog kontejnera
   */
  static deleteLocalByPrefixOnly(prefix: string): void {
    const geoRegion = DatabaseManager.getRequestRegion();
    const regionalPrefix = geoRegion && geoRegion !== "beograd" ? `${geoRegion}:${prefix}` : prefix;

    for (const key of this.localCache.keys()) {
      if (key.startsWith(prefix) || key.startsWith(regionalPrefix)) {
        this.localCache.delete(key);
      }
    }
  }

  /**
   * Briše određeni ključ iz L1.
   */
  static deleteLocal(key: string): void {
    this.deleteLocalOnly(key);
  }

  /**
   * Briše određeni ključ iz L1 i L2, i asinhrono invalidira sve kontejnere preko Redis Streama.
   */
  static async delete(key: string): Promise<void> {
    const routedKey = DatabaseManager.routeCacheKey(key);
    this.localCache.delete(routedKey);

    const client = this.redisClient;
    if (client) {
      try {
        await client.del(routedKey);
        // Radimo XADD u Stream sa MAXLEN 1000 za prevenciju rasta memorije u Redisu
        await client.xadd(this.STREAM_NAME, "MAXLEN", "~", "1000", "*", "action", "delete", "key", key);
      } catch (err) {
        console.error("[CacheService] Redis delete error:", err);
      }
    }

  }

  /**
   * Briše sve ključeve za više prefiksa u jednom batch pozivu.
   * Svi DEL-ovi se grupišu u Redis pipeline za manje round-trip-ova.
   */
  static async invalidateByPrefixes(prefixes: string[]): Promise<void> {
    if (prefixes.length === 0) return;

    const geoRegion = DatabaseManager.getRequestRegion();

    // Očisti lokalni L1 za sve prefikse
    for (const prefix of prefixes) {
      this.deleteLocalByPrefixOnly(prefix);
    }

    // Očisti L2
    const client = this.redisClient;
    if (client) {
      try {
        const pipeline = client.pipeline();
        const seen = new Set<string>();

        for (const prefix of prefixes) {
          const regionalPrefix = geoRegion && geoRegion !== "beograd" ? `${geoRegion}:${prefix}` : prefix;
          const prefList = [prefix];
          if (regionalPrefix !== prefix) {
            prefList.push(regionalPrefix);
          }

          for (const pref of prefList) {
            let cursor = "0";
            do {
              const [newCursor, keys] = await client.scan(
                cursor,
                "MATCH",
                `${pref}*`,
                "COUNT",
                200,
              );
              cursor = newCursor;
              for (const key of keys) {
                if (!seen.has(key)) {
                  seen.add(key);
                  pipeline.del(key);
                }
              }
            } while (cursor !== "0");
          }
        }

        if (seen.size > 0) {
          await pipeline.exec();
        }
      } catch (err) {
        console.error("[CacheService] Redis invalidateByPrefixes error:", err);
      }
    }
  }

  /**
   * Briše sve ključeve koji počinju sa prefiksom iz oba keša.
   */
  static async invalidateByPrefix(prefix: string): Promise<void> {
    const geoRegion = DatabaseManager.getRequestRegion();
    const regionalPrefix = geoRegion && geoRegion !== "beograd" ? `${geoRegion}:${prefix}` : prefix;

    // Očisti lokalni L1
    this.deleteLocalByPrefixOnly(prefix);

    // Očisti L2
    const client = this.redisClient;
    if (client) {
      try {
        let cursor = "0";
        const prefixes = [prefix];
        if (regionalPrefix !== prefix) {
          prefixes.push(regionalPrefix);
        }
        
        for (const pref of prefixes) {
          do {
            const [newCursor, keys] = await client.scan(
              cursor,
              "MATCH",
              `${pref}*`,
              "COUNT",
              100,
            );
            cursor = newCursor;
            if (keys.length > 0) {
              await client.del(...keys);
            }
          } while (cursor !== "0");
        }

        // Emitujemo asinhroni invalidacioni događaj u Redis Stream
        await client.xadd(this.STREAM_NAME, "MAXLEN", "~", "1000", "*", "action", "invalidate_prefix", "prefix", prefix);
      } catch (err) {
        console.error("[CacheService] Redis invalidateByPrefix error:", err);
      }
    }
  }

  /**
   * Prazni kompletan keš na svim nivoima i Cloud Run kontejnerima.
   */
  static async clear(): Promise<void> {
    this.localCache.clear();

    const client = this.redisClient;
    if (client) {
      try {
        await client.flushdb();
        await client.xadd(this.STREAM_NAME, "MAXLEN", "~", "1000", "*", "action", "clear");
      } catch (err) {
        console.error("[CacheService] Redis clear error:", err);
      }
    }
  }
}
