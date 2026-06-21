/**
 * Enterprise Client-Side API Circuit Breaker & Offline Fallback Engine
 * Tracks error rates per microservice group in a rolling 60-second window.
 * Trippes into "OPEN/Degraded" state if the error rate exceeds 15% (for min 5 requests).
 * Transparently hydrats and fallbacks to persisted local state from localStorage.
 */

import { toast } from "react-hot-toast";
import { safeLocalStorage } from "./safeStorage";

export type ServiceGroup = 'ads' | 'companies' | 'masters' | 'tools' | 'general';

interface RequestEvent {
  timestamp: number;
  success: boolean;
}

class ClientCircuitBreaker {
  private windowMs = 60000; // 1 minute sliding window
  private minRequests = 5; // Minimum requests to trigger breaker to avoid false positives
  private errorThreshold = 0.15; // 15% error rate threshold

  // Tracks request events per service group
  private history: Map<ServiceGroup, RequestEvent[]> = new Map();
  // Active state per service group: 'CLOSED' (normal), 'OPEN' (tripped/offline)
  private states: Map<ServiceGroup, 'CLOSED' | 'OPEN'> = new Map();
  // Tripped timestamps to allow cooling down (e.g., auto-retry after 30 seconds)
  private trippedAt: Map<ServiceGroup, number> = new Map();
  private cooldownMs = 30000; // 30 seconds cooldown
  private lastToastTimes = new Map<string, number>();

  constructor() {
    this.history.set('ads', []);
    this.history.set('companies', []);
    this.history.set('masters', []);
    this.history.set('tools', []);
    this.history.set('general', []);

    this.states.set('ads', 'CLOSED');
    this.states.set('companies', 'CLOSED');
    this.states.set('masters', 'CLOSED');
    this.states.set('tools', 'CLOSED');
    this.states.set('general', 'CLOSED');
  }

  /**
   * Classifies an API URL into a service group
   */
  public classifyUrl(url: string): ServiceGroup {
    const cleanUrl = url.toLowerCase();
    if (cleanUrl.includes('/ads') || cleanUrl.includes('/oglasi') || cleanUrl.includes('/smestaj') || cleanUrl.includes('/masine') || cleanUrl.includes('/placevi') || cleanUrl.includes('/alat-i-oprema')) {
      return 'ads';
    }
    if (cleanUrl.includes('/firme') || cleanUrl.includes('/companies') || cleanUrl.includes('/tenderi')) {
      return 'companies';
    }
    if (cleanUrl.includes('/majstori') || cleanUrl.includes('/masters')) {
      return 'masters';
    }
    if (cleanUrl.includes('/calcs') || cleanUrl.includes('/kalkulatori') || cleanUrl.includes('/dnevnik') || cleanUrl.includes('/dokumenti')) {
      return 'tools';
    }
    return 'general';
  }

  /**
   * Prunes history older than rolling window
   */
  private pruneHistory(group: ServiceGroup) {
    const now = Date.now();
    const list = this.history.get(group) || [];
    const pruned = list.filter((event) => now - event.timestamp < this.windowMs);
    this.history.set(group, pruned);
  }

  /**
   * Memory Guard verifies localStorage capacity. 
   * If usage exceeds 80% (approx 4,000,000 characters/bytes of the 5MB browser limit),
   * it purges older and less critical cached responses.
   */
  private lastMemoryGuardRun = 0;

  private runMemoryGuard() {
    if (typeof window === 'undefined') return;
    const now = Date.now();
    if (now - this.lastMemoryGuardRun < 30000) return; // throttle to every 30s
    this.lastMemoryGuardRun = now;
    try {
      let totalChars = 0;
      const evictable: { key: string; timestamp: number; size: number }[] = [];

      for (let i = 0; i < safeLocalStorage.length; i++) {
        const key = safeLocalStorage.key(i);
        if (key) {
          const val = safeLocalStorage.getItem(key) || '';
          const size = key.length + val.length;
          totalChars += size;

          if (key.startsWith('sg_cb_cache:')) {
            try {
              const parsed = JSON.parse(val);
              evictable.push({
                key,
                timestamp: parsed.timestamp || 0,
                size
              });
            } catch (e) {
              evictable.push({ key, timestamp: 0, size });
            }
          }
        }
      }

      const MAX_BYTES = 4.5 * 1024 * 1024; // 4.5MB (90% of 5MB limit)
      if (totalChars > MAX_BYTES) {
        // Sort by timestamp asc (oldest first)
        evictable.sort((a, b) => a.timestamp - b.timestamp);

        let freedBytes = 0;
        for (const item of evictable) {
          safeLocalStorage.removeItem(item.key);
          freedBytes += item.size;
          totalChars -= item.size;
          if (totalChars < 2.5 * 1024 * 1024) break; // target 2.5MB
        }
      }
    } catch (err) {
      // silent
    }
  }

  /**
   * Applies aggressive slimming to listing payloads to store only essentials.
   * Strips out heavy descriptions, metadata, logs, etc.
   */
  private slimPayload(url: string, payload: unknown): unknown {
    if (!payload) return payload;

    const group = this.classifyUrl(url);

    const slimItem = (item: unknown): unknown => {
      if (typeof item !== 'object' || item === null) return item;

      const essentials = [
        'id', 'uid', 'title', 'price', 'name', 'comp', 'logo', 'logoUrl',
        'location', 'type', 'status', 'createdAt', 'isPremium', 'isUrgent',
        'pricePerDay', 'pricePerHour', 'category', 'role', 'grad',
        'adTitle', 'adType', 'machPrice', 'machPricePerDay', 'machYear', 'machHours',
        'machBrand', 'machModel', 'machAdType', 'machCategory', 'machSubCategory', 'machFuel',
        'year', 'workingHours', 'machineType', 'condition', 'fuelType', 'weightKg',
        'companyName', 'companyLogo', 'isCompanyVerified', 'categoryId', 'categorySlug',
        'isServiced', 'isNegotiable', 'imageStatus', 'imagePlaceholders',
        'currency', 'city', 'description', 'authorId', 'authorSnapshot',
        'locationSlug', 'professionSlug', 'mainCategories',
      ];
      
      const typedItem = item as Record<string, unknown>;
      const cleaned: Record<string, unknown> = {};
      for (const key of essentials) {
        if (typedItem[key] !== undefined) {
          cleaned[key] = typedItem[key];
        }
      }
      return cleaned;
    };

    // Apply only to ads, job listings, machine structures, etc.
    const isCatalog = group === 'ads' || group === 'companies' || url.includes('/listings') || url.includes('/oglasi') || url.includes('/firme') || url.includes('/masine');
    if (isCatalog) {
      if (Array.isArray(payload)) {
        return payload.map(slimItem);
      } else if (payload && typeof payload === 'object') {
        const typedPayload = payload as Record<string, unknown>;
        if (Array.isArray(typedPayload.items)) {
          return {
            ...typedPayload,
            items: typedPayload.items.map(slimItem) as unknown[]
          };
        } else if (Array.isArray(typedPayload.docs)) {
          return {
            ...typedPayload,
            docs: typedPayload.docs.map(slimItem) as unknown[]
          };
        } else {
          return slimItem(payload);
        }
      }
    }

    return payload;
  }

  /**
   * Records a request outcome
   */
  public recordResult(url: string, success: boolean, payload?: unknown) {
    const group = this.classifyUrl(url);
    this.pruneHistory(group);

    const list = this.history.get(group) || [];
    list.push({ timestamp: Date.now(), success });
    this.history.set(group, list);

    // Save successful responses to localStorage for offline fallback
    if (success && payload !== undefined && typeof window !== 'undefined') {
      const cacheKey = `sg_cb_cache:${url}`;
      try {
        // Memory Guard capacity verification & cleanup
        this.runMemoryGuard();

        // Aggressive data slimming / compression
        const finalPayload = this.slimPayload(url, payload);

        safeLocalStorage.setItem(cacheKey, JSON.stringify({
          data: finalPayload,
          timestamp: Date.now()
        }));
      } catch (err) {
        // If quota exceeded, nuke all cache entries and retry once
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          try {
            for (let i = safeLocalStorage.length - 1; i >= 0; i--) {
              const k = safeLocalStorage.key(i);
              if (k?.startsWith('sg_cb_cache:')) safeLocalStorage.removeItem(k);
            }
            // Aggressive data slimming / compression
            const finalPayload = this.slimPayload(url, payload);
            safeLocalStorage.setItem(cacheKey, JSON.stringify({
              data: finalPayload,
              timestamp: Date.now()
            }));
          } catch (e2) {
            console.warn('[CircuitBreaker] Failed to cache even after clearing all cache:', e2);
          }
        } else {
          console.warn('[CircuitBreaker] Failed to cache response in safeLocalStorage:', err);
        }
      }
    }

    this.evaluateState(group);
  }

  /**
   * Evaluates the circuit state based on sliding window statistics
   */
  private evaluateState(group: ServiceGroup) {
    const list = this.history.get(group) || [];
    if (list.length < this.minRequests) {
      this.states.set(group, 'CLOSED');
      return;
    }

    const failedCount = list.filter((e) => !e.success).length;
    const errorRate = failedCount / list.length;

    if (errorRate > this.errorThreshold) {
      if (this.states.get(group) !== 'OPEN') {
        console.warn(`🚨 [CircuitBreaker] Group "${group}" tripped! Error rate: ${(errorRate * 100).toFixed(1)}% exceeds threshold ${this.errorThreshold * 100}%. Entering offline degraded fallback mode.`);
        this.states.set(group, 'OPEN');
        this.trippedAt.set(group, Date.now());

        toast.error(`Automatski prelazak na lokalni/offline rad za modul: ${group.toUpperCase()}`, {
          duration: 5000,
          id: `cb-trip-${group}`,
          style: {
            background: '#1c1917',
            color: '#f97316',
            border: '1px solid #ea580c',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        });
      }
    } else {
      if (this.states.get(group) === 'OPEN') {
        console.info(`🛡️ [CircuitBreaker] Group "${group}" recovered. Circuit CLOSED.`);
        this.states.set(group, 'CLOSED');
        toast.success(`Modul ${group.toUpperCase()} se uspešno sinhronizovao i vratio na online rad!`, {
          duration: 4000,
          id: `cb-recover-${group}`,
          style: {
            background: '#022c22',
            color: '#34d399',
            border: '1px solid #059669',
            fontSize: '11px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }
        });
      }
    }
  }

  /**
   * Checks if service group is tripped (OPEN)
   */
  public isTripped(url: string): boolean {
    return this.states.get(this.classifyUrl(url)) === "OPEN";
  }

  /**
   * Gets the stored local cache fallback for an end-point
   */
  public getCachedFallback(url: string): unknown {
    if (typeof window === 'undefined') return null;
    try {
      const cacheKey = `sg_cb_cache:${url}`;
      const item = safeLocalStorage.getItem(cacheKey);
      if (item) {
        const parsed = JSON.parse(item) as { data: unknown; timestamp?: number };
        console.info(`📦 [CircuitBreaker] Serving offline cached fallback for: "${url}"`);

        // Avoid infinite toast spam on simultaneous items loading
        const lastToast = this.lastToastTimes.get(url) || 0;
        if (Date.now() - lastToast > 15000) {
          this.lastToastTimes.set(url, Date.now());
          toast.success(`Učitani lokalni podaci za modul (Degraded Cache Fallback)`, {
            duration: 3000,
            id: `cb-fallback-${url}`,
            icon: '📦',
            style: {
              background: '#0f172a',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }
          });
        }
        return parsed.data;
      }
    } catch (err) {
      console.warn('[CircuitBreaker] Failed to read fallback from safeLocalStorage:', err);
    }
    return null;
  }

  /**
   * Forces a recover state for a service group
   */
  public forceReset() {
    for (const group of this.history.keys()) {
      this.history.set(group, []);
      this.states.set(group, 'CLOSED');
    }
    console.info('🛡️ [CircuitBreaker] Manually reset all circuits.');
  }

  public getCircuitStatus() {
    return Array.from(this.states.entries()).map(([group, state]) => {
      const list = this.history.get(group) || [];
      const failed = list.filter((e) => !e.success).length;
      const rate = list.length > 0 ? (failed / list.length) * 100 : 0;
      return { group, state, errorRate: `${rate.toFixed(1)}%`, requests: list.length };
    });
  }

  public getSnapshot() {
    let totalRequests = 0;
    let failedRequests = 0;
    
    Array.from(this.history.values()).forEach(list => {
      totalRequests += list.length;
      failedRequests += list.filter(e => !e.success).length;
    });

    return {
      totalRequests,
      failedRequests,
      successfulRequests: totalRequests - failedRequests,
      anyTripped: Array.from(this.states.values()).some(s => s === 'OPEN')
    };
  }
}

export const circuitBreaker = new ClientCircuitBreaker();
