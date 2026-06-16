import Redis from "ioredis";
import { env } from "../config/env.ts";

// Lokalni in-memory fallback kada Redis padne
class MockPipeline {
  private fallback: InMemoryFallback;
  constructor(fallback: InMemoryFallback) {
    this.fallback = fallback;
  }
  hincrby(key: string, field: string, increment: number | string) {
    this.fallback.hincrby(key, field, increment).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  incrby(key: string, increment: number | string) {
    this.fallback.incrby(key, increment).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  set(key: string, value: string, ...args: (string | number)[]) {
    this.fallback.set(key, value, ...args).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  get(key: string) {
    return this;
  }
  del(...keys: string[]) {
    this.fallback.del(...keys).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  expire(key: string, seconds: number) {
    this.fallback.expire(key, seconds).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  sadd(key: string, ...members: string[]) {
    this.fallback.sadd(key, ...members).catch(err => console.error("[Cache] invalidation error:", err));
    return this;
  }
  async exec() {
    return [];
  }
}

class InMemoryFallback {
  private map = new Map<string, string | Set<string>>();
  private timeouts = new Map<string, NodeJS.Timeout>();

  async set(key: string, value: string, ...args: (string | number)[]) {
    let nx = false;
    let xx = false;
    let ttlMs: number | null = null;

    for (let i = 0; i < args.length; i++) {
      const argValue = args[i];
      const arg = typeof argValue === "string" ? argValue.toUpperCase() : "";
      if (arg === "NX") {
        nx = true;
      } else if (arg === "XX") {
        xx = true;
      } else if (arg === "PX" && args[i + 1]) {
        ttlMs = parseInt(String(args[i + 1]), 10);
      } else if (arg === "EX" && args[i + 1]) {
        ttlMs = parseInt(String(args[i + 1]), 10) * 1000;
      }
    }

    // fallback za starije pozive sa fiksiranim parametrima
    if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "number") {
      const mode = (args[0] as string).toUpperCase();
      const val = args[1] as number;
      if (mode === "PX") ttlMs = val;
      if (mode === "EX") ttlMs = val * 1000;
    }

    const exists = this.map.has(key);
    if (nx && exists) {
      return null; // ioredis vraća null kada NX uslov ne prođe u ovakvim pozivima
    }
    if (xx && !exists) {
      return null;
    }

    this.map.set(key, value);

    if (ttlMs !== null) {
      if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
      this.timeouts.set(
        key,
        setTimeout(() => {
          this.map.delete(key);
          this.timeouts.delete(key);
        }, ttlMs),
      );
    }
    return "OK";
  }

  async get(key: string) {
    return this.map.get(key) || null;
  }

  async del(...keys: string[]) {
    let count = 0;
    for (const key of keys) {
      if (this.map.has(key)) {
        this.map.delete(key);
        if (this.timeouts.has(key)) {
          clearTimeout(this.timeouts.get(key));
          this.timeouts.delete(key);
        }
        count++;
      }
    }
    return count;
  }

  async scan(cursor: string, ...args: (string | number)[]) {
    let matchPattern = "*";
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "MATCH" && args[i + 1]) {
        matchPattern = String(args[i + 1]);
      }
    }

    const keys = Array.from(this.map.keys());
    if (matchPattern && matchPattern !== "*") {
      const globPattern = matchPattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${globPattern}$`);
      const matchedKeys = keys.filter(k => regex.test(k));
      return ["0", matchedKeys];
    }
    return ["0", keys];
  }

  async eval(script: string, numKeys: number, ...args: (string | number)[]) {
    const key = args[0] as string;
    const val = args[numKeys] as string; // Prvi ARGV
    const currentVal = this.map.get(key) as string;

    if (script.includes("redis.call") && script.includes("== ARGV[1]")) {
      if (currentVal === val) {
        this.map.delete(key);
        if (this.timeouts.has(key)) {
          clearTimeout(this.timeouts.get(key));
          this.timeouts.delete(key);
        }
        return 1;
      }
      return 0;
    }
    return 0;
  }

  async incr(key: string) {
    const current = this.map.get(key) as string;
    const newVal = (parseInt(current, 10) || 0) + 1;
    this.map.set(key, String(newVal));
    return newVal;
  }

  async incrby(key: string, increment: number | string) {
    const current = this.map.get(key) as string;
    const inc = parseInt(String(increment), 10) || 0;
    const newVal = (parseInt(current, 10) || 0) + inc;
    this.map.set(key, String(newVal));
    return newVal;
  }

  async expire(key: string, seconds: number) {
    if (this.map.has(key)) {
      if (this.timeouts.has(key)) clearTimeout(this.timeouts.get(key));
      this.timeouts.set(
        key,
        setTimeout(() => {
          this.map.delete(key);
          this.timeouts.delete(key);
        }, seconds * 1000),
      );
      return 1;
    }
    return 0;
  }

  async hincrby(key: string, field: string, increment: number | string) {
    const compositeKey = `${key}#h#${field}`;
    const newVal = await this.incrby(compositeKey, increment);
    return newVal;
  }

  async hset(key: string, field: string, value: string) {
    const compositeKey = `${key}#h#${field}`;
    this.map.set(compositeKey, value);
    return 1;
  }

  async hget(key: string, field: string) {
    const compositeKey = `${key}#h#${field}`;
    return this.map.get(compositeKey) || null;
  }

  async hdel(key: string, field: string) {
    const compositeKey = `${key}#h#${field}`;
    if (this.map.has(compositeKey)) {
      this.map.delete(compositeKey);
      return 1;
    }
    return 0;
  }

  async sadd(key: string, ...members: string[]) {
    const setKey = `${key}#s`;
    let currentSet = this.map.get(setKey);
    if (!(currentSet instanceof Set)) {
      currentSet = new Set<string>();
      this.map.set(setKey, currentSet);
    }
    let added = 0;
    for (const mem of members) {
      if (!currentSet.has(mem)) {
        currentSet.add(mem);
        added++;
      }
    }
    return added;
  }

  async sismember(key: string, member: string) {
    const setKey = `${key}#s`;
    const currentSet = this.map.get(setKey);
    if (currentSet instanceof Set) {
      return currentSet.has(member) ? 1 : 0;
    }
    return 0;
  }

  async config() {
    return "OK";
  }

  async xadd() {
    return "OK";
  }

  async xgroup() {
    return "OK";
  }

  async xreadgroup() {
    await new Promise(r => setTimeout(r, 5000));
    return null;
  }

  async xack() {
    return 1;
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    const results: (string | null)[] = [];
    for (const key of keys) {
      const val = this.map.get(key);
      results.push(typeof val === "string" ? val : null);
    }
    return results;
  }

  async call(command: string, ...args: any[]): Promise<any> {
    const cmd = command.toLowerCase();
    if (cmd === 'script') {
        return "0000000000000000000000000000000000000000";
    }
    if (cmd === 'eval' || cmd === 'evalsha') {
        // Mock success for common rate-limiting LUA scripts
        // rate-limit-redis expects an array [count, resetTimeMs] 
        // or for fixed window [count, remaining]
        return [1, 1000]; 
    }
    return null;
  }

  pipeline() {
    return new MockPipeline(this);
  }

  multi() {
    return new MockPipeline(this);
  }
}

const fallbackMap = new InMemoryFallback();
let isRedisDown = process.env.FORCE_REDIS_OFFLINE === "true";

export function isClusterOffline(): boolean {
  return isRedisDown;
}

export type ResilientRedis = Redis & { _resilientInterval?: NodeJS.Timeout };

let redis: ResilientRedis | null = null;
let rawRedis: Redis | null = null;
let subRedis: ResilientRedis | null = null;
let streamRedis: ResilientRedis | null = null;
const regionalClients = new Map<string, ResilientRedis>();

interface ResilientClientOptions {
  isMain?: boolean;
  [key: string]: unknown;
}

interface ConfigurableRedis {
  config: (cmd: string, ...args: string[]) => Promise<unknown>;
}

function hasConfigMethod(client: object): client is ConfigurableRedis {
  return "config" in client && typeof (client as any).config === "function";
}

function createResilientClient(urlOrClient: string | Redis, options: ResilientClientOptions = {}): ResilientRedis {
  const { isMain: userIsMain, ...redisOptions } = options;
  const isMain = userIsMain ?? (typeof urlOrClient !== "string");
  let localDownState = false;

  const setDownState = (val: boolean) => {
    localDownState = val;
    if (isMain) {
      isRedisDown = val;
    }
  };

  const getDownState = () => {
    return isMain ? isRedisDown : localDownState;
  };

  const client = typeof urlOrClient === "string"
    ? new Redis(urlOrClient, {
        ...redisOptions,
        lazyConnect: true,
        enableOfflineQueue: true, // Required for BullMQ Worker stability
        maxRetriesPerRequest: null, // Critical for BullMQ infinite reconnection
        connectTimeout: 5000,
        keepAlive: 5000, // TCP Keep-alive to prevent EPIPE/idle drops
        retryStrategy: (times) => {
          setDownState(true);
          if (process.env.NODE_ENV !== "production") {
            return null; // Zaustavi reconnect loop u razvoju radi stabilnosti procesora
          }
          const base = 200;
          const maxDelay = 10000;
          const expDelay = base * Math.pow(2, Math.min(times - 1, 6));
          const jitter = Math.random() * 200;
          const delay = Math.min(expDelay + jitter, maxDelay);
          return delay;
        },
      })
    : urlOrClient;

  // Register resilient listeners on clients that do not have them preconfigured (prevents uncaught exceptions in production)
  if (client.listenerCount("error") === 0) {
    client.on("connect", async () => {
      setDownState(false);
      try {
        if (hasConfigMethod(client)) {
          await client.config("SET", "maxmemory-policy", "allkeys-lru");
        }
        if (process.env.NODE_ENV !== "production") console.log(`[Redis] Konektovan (${isMain ? 'Main' : 'Regional'}).`);
      } catch (err: unknown) {}
    });

    client.on("error", (err: Error & { code?: string | number }) => {
      const errMsg = err.message.toLowerCase();
      const isNetworkError =
        errMsg.includes("stream") ||
        errMsg.includes("writeable") ||
        errMsg.includes("offlinequeue") ||
        errMsg.includes("closed") ||
        errMsg.includes("connection") ||
        errMsg.includes("refused") ||
        errMsg.includes("timeout") ||
        errMsg.includes("econnrefused") ||
        errMsg.includes("epipe") ||
        errMsg.includes("econnreset") ||
        errMsg.includes("etimedout") ||
        errMsg.includes("enotfound") ||
        errMsg.includes("max number of clients") ||
        errMsg.includes("quota") ||
        errMsg.includes("limit") ||
        errMsg.includes("bandwidth") ||
        errMsg.includes("usage") ||
        errMsg.includes("overlimit") ||
        err.code === "EPIPE" ||
        err.code === "ECONNRESET" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT" ||
        err.code === "ENOTFOUND";

      if (isNetworkError) {
        if (!getDownState()) {
          setDownState(true);
          console.warn(`🛡️ [Redis Failover] Konekcija odbijena/pukla (${err.message}). Aktiviran lokalni fallback.`);
        }
      } else {
        console.error("Redis Error:", err.message);
      }
    });

    // Keep-alive ping na svakih 60 sekundi to maintain resilient sockets
    const keepAlive = setInterval(async () => {
      if (client && (client.status as string) !== "end") {
        try {
          if (getDownState()) {
            if ((client.status as string) === "end") {
              if (typeof client.connect === "function") {
                client.connect().catch(() => {});
              }
            } else if (client.status === "ready") {
              if (typeof client.ping === "function") {
                await client.ping();
              }
              setDownState(false);
            }
          } else {
            if (typeof client.ping === "function") {
              await client.ping();
            }
          }
        } catch (err) {
          setDownState(true);
        }
      }
    }, 60000);
    
    // Attach to client for cleanup
    (client as ResilientRedis)._resilientInterval = keepAlive;
  }

  // Pravimo Proxy koji preusmerava pozive na InMemoryFallback ako je Redis mrtav
  return new Proxy(client, {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop);
      }
      // Handle the status property correctly so it returns a clean string
      if (prop === "status") {
        const targetObj = target as any;
        return getDownState() ? "end" : (targetObj.status as string | undefined);
      }
      if (getDownState()) {
        const fallbackObj = fallbackMap as any;
        const fallbackValue = fallbackObj[prop];
        if (typeof fallbackValue === "function") {
          return (fallbackValue as (...args: unknown[]) => unknown).bind(fallbackMap);
        }
        // Only return a function if the original target property is a function
        const targetObj = target as any;
        if (typeof targetObj[prop] === "function") {
          return async () => null;
        }
        return targetObj[prop];
      }
      const targetObj = target as any;
      const value = targetObj[prop];
      if (typeof value === "function") {
        if (
          prop === "on" ||
          prop === "once" ||
          prop === "off" ||
          prop === "emit" ||
          prop === "addListener" ||
          prop === "removeListener" ||
          prop === "pipeline" ||
          prop === "multi"
        ) {
          return value.bind(target);
        }
        return async (...args: unknown[]) => {
          try {
            if (getDownState()) {
              const fallbackObj = fallbackMap as any;
              const fallbackMethod = fallbackObj[prop];
              if (typeof fallbackMethod === "function") {
                return (fallbackMethod as (...args: unknown[]) => unknown).apply(fallbackMap, args);
              }
              return null;
            }
            // Ako klijent slučajno nije spreman, odmah pokušavamo izvršenje;
            // pošto je isključena offline linija (enableOfflineQueue: false), ioredis će trenutno
            // baciti grešku, što će naš catch blok obraditi i prebaciti u in-memory mod bez ikakvog čekanja.
            const EXCLUDE_TIMEOUT_COMMANDS = [
              "on", "once", "off", "emit", "addListener", "removeListener",
              "pipeline", "multi", "subscribe", "psubscribe", "xread", "xreadgroup",
              "blpop", "brpop", "brpoplpush", "bzpopmin", "bzpopmax", "connect", "quit", "disconnect"
            ];

            const resultPromise = value.apply(target, args);
            if (!resultPromise || typeof resultPromise.then !== "function") {
              return resultPromise;
            }

            if (EXCLUDE_TIMEOUT_COMMANDS.includes(prop)) {
              return await resultPromise;
            }

            let timeoutId: NodeJS.Timeout | null = null;
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Redis operation timeout (3000ms limit achieved)")), 3000);
            });

            try {
              const res = await Promise.race([
                resultPromise,
                timeoutPromise
              ]);
              if (timeoutId) clearTimeout(timeoutId);
              return res;
            } catch (pErr) {
              if (timeoutId) clearTimeout(timeoutId);
              throw pErr;
            }
          } catch (err: unknown) {
            const error = err as Error & { code?: string | number };
            const errMsg = error.message.toLowerCase();
            const isNetworkError =
              errMsg.includes("stream") ||
              errMsg.includes("writeable") ||
              errMsg.includes("offlinequeue") ||
              errMsg.includes("closed") ||
              errMsg.includes("connection") ||
              errMsg.includes("refused") ||
              errMsg.includes("timeout") ||
              errMsg.includes("epipe") ||
              errMsg.includes("econnreset") ||
              errMsg.includes("max number of clients") ||
              errMsg.includes("quota") ||
              errMsg.includes("limit") ||
              errMsg.includes("bandwidth") ||
              errMsg.includes("usage") ||
              errMsg.includes("overlimit") ||
              error.code === "EPIPE" ||
              error.code === "ECONNRESET" ||
              error.code === "ECONNREFUSED" ||
              error.code === "ETIMEDOUT" ||
              error.code === "ENOTFOUND";

            if (isNetworkError) {
              if (!getDownState()) {
                setDownState(true);
                // Only log once and make it less scary
                const silentErrors = ["stream isn't writeable", "offlinequeue", "epipe", "econnreset", "connection is closed"];
                if (!silentErrors.some(e => errMsg.includes(e))) {
                  console.warn("🛡️ [Redis] Lokalni in-memory mod aktiviran.", error.message);
                }
              }
              const fallbackObj = fallbackMap as any;
              const fallbackMethod = fallbackObj[prop];
              if (typeof fallbackMethod === "function") {
                return (fallbackMethod as (...args: unknown[]) => unknown).apply(fallbackMap, args);
              }
              return null;
            }
            throw error;
          }
        };
      }
      return value;
    },
  });
}

function getRedisUrl(): string | null {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }
  if (env.REDIS_HOST) {
    const host = env.REDIS_HOST;
    const port = env.REDIS_PORT || "6379";
    let auth = "";
    if (env.REDIS_PASSWORD) {
      auth = `:${env.REDIS_PASSWORD}@`;
    }
    return `redis://${auth}${host}:${port}`;
  }
  return null;
}

export function getRawRedis(): Redis | null {
  const url = getRedisUrl();
  if (!rawRedis && url) {
    const client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: true, // Required for BullMQ Worker stability
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
      keepAlive: 5000,
      retryStrategy: (times) => {
        isRedisDown = true;
        if (process.env.NODE_ENV !== "production") {
          return null; // Zaustavi reconnect loop u razvoju radi stabilnosti procesora
        }
        const base = 200;
        const maxDelay = 10000;
        const expDelay = base * Math.pow(2, Math.min(times - 1, 6));
        const jitter = Math.random() * 200;
        const delay = Math.min(expDelay + jitter, maxDelay);
        return delay;
      },
    });

    client.on("connect", async () => {
      isRedisDown = false;
      try {
        await client.config("SET", "maxmemory-policy", "allkeys-lru");
      } catch (err: unknown) {}
    });

    client.on("error", (err: Error & { code?: string | number }) => {
      const errMsg = err.message.toLowerCase();
      const isNetworkError =
        errMsg.includes("stream") ||
        errMsg.includes("writeable") ||
        errMsg.includes("offlinequeue") ||
        errMsg.includes("closed") ||
        errMsg.includes("connection") ||
        errMsg.includes("refused") ||
        errMsg.includes("timeout") ||
        errMsg.includes("econnrefused") ||
        errMsg.includes("epipe") ||
        errMsg.includes("econnreset") ||
        errMsg.includes("etimedout") ||
        errMsg.includes("enotfound") ||
        errMsg.includes("max number of clients") ||
        errMsg.includes("quota") ||
        errMsg.includes("limit") ||
        errMsg.includes("bandwidth") ||
        errMsg.includes("usage") ||
        errMsg.includes("overlimit") ||
        err.code === "EPIPE" ||
        err.code === "ECONNRESET" ||
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT" ||
        err.code === "ENOTFOUND";

      if (isNetworkError) {
        isRedisDown = true;
      } else {
        console.error("Redis Raw Client Error:", err.message);
      }
    });
    
    rawRedis = client;
  }
  return rawRedis;
}

export function getRedis(): ResilientRedis {
  const url = getRedisUrl();
  if (!redis) {
    if (url) {
      try {
        const redisUrl = new URL(url);
        if (process.env.NODE_ENV !== "production") console.log(
          `[Redis] Connecting to ${redisUrl.hostname}:${redisUrl.port || 6379}...`,
        );
      } catch (e) {
        console.warn(`[Redis] Connecting using raw path: ${url}`);
      }
      const raw = getRawRedis();
      if (raw) {
        redis = createResilientClient(raw);
      }
    }
    
    if (!redis) {
      console.warn("⚠️ [Redis] No host/URL configured. Initializing absolute InMemoryFallback client for process liveness.");
      const rawDummy = new Redis({ lazyConnect: true });
      redis = createResilientClient(rawDummy, { isMain: true });
      isRedisDown = true;
    }
  }
  return redis!;
}

/**
 * Vraća Redis klijent za specifičan region.
 * Korisno za prekograničnu sinhronizaciju ili failover metadata.
 */
const MAX_REGIONAL_CLIENTS = 5;

export function getRegionalRedis(region: string): ResilientRedis {
  if (regionalClients.has(region)) return regionalClients.get(region)!;

  // Cleanup old clients if limit reached
  if (regionalClients.size >= MAX_REGIONAL_CLIENTS) {
    // If we hit the limit, just fallback to main redis to avoid new socket opening
    return getRedis();
  }

  const regionUrls = env.REDIS_REGION_URLS
    ? env.REDIS_REGION_URLS.split(",")
    : [];
  const pair = regionUrls.find((p) => p.startsWith(`${region}:`));

  if (pair) {
    const colonIdx = pair.indexOf(":");
    const url = pair.substring(colonIdx + 1);
    const client = createResilientClient(url, { maxRetriesPerRequest: 1, isMain: false });
    regionalClients.set(region, client);
    return client;
  }
  return getRedis();
}

const lastWarned = new Map<string, number>();
function throttleWarn(key: string, msg: string, intervalMs: number = 60000) {
  const now = Date.now();
  const lastTime = lastWarned.get(key) || 0;
  if (now - lastTime > intervalMs) {
    lastWarned.set(key, now);
    console.warn(msg);
  }
}

export function getSubRedis(): ResilientRedis {
  const url = getRedisUrl();
  if (!subRedis) {
    if (url) {
      const rawSub = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        enableOfflineQueue: true,
        retryStrategy: (times) => {
          if (process.env.NODE_ENV !== "production") {
            return null; // Zaustavi reconnect loop u razvoju radi stabilnosti procesora
          }
          const base = 200;
          const maxDelay = 15000;
          const expDelay = base * Math.pow(2, Math.min(times - 1, 6));
          const jitter = Math.random() * 200;
          return Math.min(expDelay + jitter, maxDelay);
        }
      });
  
      // Wrap the subscriber in a resilient proxy too, so it doesn't crash on connection spikes
      subRedis = createResilientClient(rawSub, { isMain: false });
    }
    
    if (!subRedis) {
      console.warn("⚠️ [Redis] No host/URL configured for subscriber. Initializing absolute InMemoryFallback client for process liveness.");
      const rawDummy = new Redis({ lazyConnect: true });
      subRedis = createResilientClient(rawDummy, { isMain: false });
    }
  }
  return subRedis!;
}


export function getStreamRedis(): ResilientRedis {
  const url = getRedisUrl();
  if (!streamRedis) {
    if (url) {
      const rawStream = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: null,
        connectTimeout: 5000,
        enableOfflineQueue: true,
        retryStrategy: (times) => {
          if (process.env.NODE_ENV !== "production") {
            return null; // Zaustavi reconnect loop u razvoju radi stabilnosti procesora
          }
          const base = 200;
          const maxDelay = 15000;
          const expDelay = base * Math.pow(2, Math.min(times - 1, 6));
          const jitter = Math.random() * 200;
          return Math.min(expDelay + jitter, maxDelay);
        }
      });
  
      // Wrap the stream reader in a resilient proxy
      streamRedis = createResilientClient(rawStream, { isMain: false });
    }
    
    if (!streamRedis) {
      console.warn("⚠️ [Redis] No host/URL configured for stream. Initializing absolute InMemoryFallback client for process liveness.");
      const rawDummy = new Redis({ lazyConnect: true });
      streamRedis = createResilientClient(rawDummy, { isMain: false });
    }
  }
  return streamRedis!;
}

export async function shutdownRedis() {
  if (process.env.NODE_ENV !== "production") console.log("[Redis] Graceful shutdown initiated...");
  const cleanupClient = async (c: ResilientRedis | null | Redis) => {
    if (!c) return;
    try {
      if ((c as ResilientRedis)._resilientInterval) clearInterval((c as ResilientRedis)._resilientInterval);
      if (typeof c.unsubscribe === "function") await c.unsubscribe();
      if (typeof c.quit === "function") await c.quit();
      else {
        const clientObj = c as any;
        if (typeof clientObj.disconnect === "function") {
          (clientObj.disconnect as () => void)();
        }
      }
    } catch (e) { console.error("[Redis] Cleanup/disconnect error:", e); }
  };

  await cleanupClient(subRedis);
  subRedis = null;
  await cleanupClient(streamRedis);
  streamRedis = null;
  await cleanupClient(redis);
  redis = null;
  await cleanupClient(rawRedis);
  rawRedis = null;
  
  for (const client of regionalClients.values()) {
    await cleanupClient(client);
  }
  regionalClients.clear();
}

