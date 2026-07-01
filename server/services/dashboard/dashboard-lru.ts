export const EMPLOYER_STATS_TTL = 3 * 60 * 1000; // 3 minutes
export const EMPLOYER_TRENDS_TTL = 3 * 60 * 1000; // 3 minutes

// Global Token Dictionary for memory-efficient inverted indexing and matching
export const TOKEN_DICTIONARY = new Map<string, number>();
export let tokenCounter = 1;

export class SimpleLRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();

  constructor(private maxLimit: number = 200, private ttl: number = 15 * 60 * 1000) {}

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxLimit) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  delete(key: K): void { this.cache.delete(key); }

  clear(): void { this.cache.clear(); }
}

export const jobTokensLRU = new SimpleLRUCache<string, { title: Uint32Array; requirements: Uint32Array; city: Uint32Array; location: Uint32Array }>(500);
export const userProfileTokensLRU = new SimpleLRUCache<string, { profession: Uint32Array; city: Uint32Array }>(500);

export const employerStatsMemoryCache = new SimpleLRUCache<string, any>(200, EMPLOYER_STATS_TTL);
export const smartMatchesMemoryCache = new SimpleLRUCache<string, { smartMatches: any[]; recentApplications: any[] }>(200, 15 * 60 * 1000);
export const employerTrendsMemoryCache = new SimpleLRUCache<string, any[]>(200, EMPLOYER_TRENDS_TTL);

export function setTokenCounter(val: number) {
  tokenCounter = val;
}

export function getTokenId(token: string): number {
  let id = TOKEN_DICTIONARY.get(token);
  if (id === undefined) {
    if (TOKEN_DICTIONARY.size > 50000) {
      TOKEN_DICTIONARY.clear();
      jobTokensLRU.clear();
      userProfileTokensLRU.clear();
      tokenCounter = 1;
    }
    id = tokenCounter++;
    TOKEN_DICTIONARY.set(token, id);
  }
  return id;
}

export function stringsToIds(strings: string[]): Uint32Array {
  const ids = new Uint32Array(strings.length);
  for (let i = 0; i < strings.length; i++) {
    ids[i] = getTokenId(strings[i]);
  }
  return ids;
}
