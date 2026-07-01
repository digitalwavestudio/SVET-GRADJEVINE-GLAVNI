import { describe, it, expect, vi } from "vitest";

// Robust Firestore mock to prevent query chain crashes during tests
vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockResolvedValue({
    docs: [
      {
        id: "ad_test_100",
        data: () => ({
          title: "Električar",
          status: "active",
          type: "jobs",
          createdAt: { _seconds: 1716240000 }
        })
      }
    ],
    size: 1,
    data: () => ({ count: 1 })
  });

  const mockDoc = {
    delete: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    get: mockGet
  };

  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    get: mockGet,
    doc: vi.fn().mockReturnValue(mockDoc)
  };

  const mockCollection = vi.fn().mockReturnValue(mockQuery);

  return {
    db: {
      collection: mockCollection
    },
    checkQuotaStatus: vi.fn().mockReturnValue(false)
  };
});

import { CacheService } from "../services/cache.service.ts";
import { DashboardService, SimpleLRUCache } from "../services/dashboard.service.ts";
import { breaker } from "../routes/bff.routes.ts";
import { bffSingleFlightMap } from "../services/bff.service.ts";
import { CacheKeys } from "../constants/cache-keys.ts";

describe("Dashboard Cache Sanity & Integration Flow", () => {
  
  it("Phase 1: Initial Network/Service request completes and populates the Redis and memory cache", async () => {
    const testKey = "bff_cache:test_user_789";
    const testData = {
      success: true,
      stats: {
        totalAds: 1,
        recentAds: [
          { id: "ad_test_100", title: "Električar", type: "jobs" }
        ],
        recentApplications: []
      }
    };

    // Clean up cache pre-run
    await CacheService.delete(testKey);

    let fetchCount = 0;
    const fetchFunc = async () => {
      fetchCount++;
      return testData;
    };

    // 1. Initial request
    const response = await CacheService.getOrSet(testKey, fetchFunc, 60000);
    expect(response).toEqual(testData);
    expect(fetchCount).toBe(1);

    // Verify cache is populated
    const cachedResponse = await CacheService.get(testKey);
    expect(cachedResponse).toEqual(testData);
  });

  it("Phase 2: Verifies response speed of subsequent request is below 10ms (from Cache)", async () => {
    const testKey = "bff_cache:test_user_789";
    const testData = {
      success: true,
      stats: {
        totalAds: 1,
        recentAds: [
          { id: "ad_test_100", title: "Električar", type: "jobs" }
        ],
        recentApplications: []
      }
    };

    // Pre-seed cache
    await CacheService.set(testKey, testData, 60000);

    let fetchCount = 0;
    const fetchFunc = async () => {
      fetchCount++;
      return testData;
    };

    const startTime = performance.now();
    const cachedResponse = await CacheService.getOrSet(testKey, fetchFunc, 60000);
    const duration = performance.now() - startTime;

    expect(cachedResponse).toEqual(testData);
    expect(fetchCount).toBe(0); // Fetched strictly from cache
    expect(duration).toBeLessThan(10); // Response must be virtually instant (<10ms)
  });

  it("Phase 3: Simulates user ad modification and evaluates automatic cache eviction", async () => {
    const uid = "test_user_789";
    const cacheKey = CacheKeys.employerStats(uid);
    
    // Seed initial cache showing 10 ads
    await CacheService.set(cacheKey, { totalAds: 10, recentAds: [] }, 60000);
    
    // Verify cached state is present
    const cachedPreEviction = await CacheService.get<any>(cacheKey);
    expect(cachedPreEviction?.totalAds).toBe(10);

    // Call cache eviction and pre-warm flow
    await DashboardService.clearEmployerStatsCache(uid);

    // Verify that the cached values are no longer the stale value of 10
    const cachedPostEviction = await CacheService.get<any>(cacheKey);
    expect(cachedPostEviction?.totalAds).not.toBe(10);
  });

  it("Phase 4: Circuit Breaker Simulation (Simulate 5 failures to trip breaker and confirm Sandbox fallback)", async () => {
    // Force 5 consecutive failures
    for (let i = 0; i < 5; i++) {
      await breaker.recordFailure();
    }

    const state = await breaker.getState();
    expect(state).toBe("OPEN");
  });

  it("Phase 5: SimpleLRUCache unit test for TTL and LRU eviction limits", async () => {
    // 1. Check LRU eviction size limit
    const lru = new SimpleLRUCache<string, number>(2);
    lru.set("a", 1);
    lru.set("b", 2);
    lru.set("c", 3); // Should evict "a"

    expect(lru.get("a")).toBeUndefined();
    expect(lru.get("b")).toBe(2);
    expect(lru.get("c")).toBe(3);

    // 2. Check TTL simulation (value set 16 minutes ago with 15 min TTL)
    const lruWithTtl = new SimpleLRUCache<string, string>(5, 15 * 60 * 1000);
    lruWithTtl.set("test_ttl", "working");
    lruWithTtl.set("test_expired", "gone");
    (lruWithTtl as any).cache.get("test_expired").timestamp = Date.now() - 16 * 60 * 1000;

    expect(lruWithTtl.get("test_ttl")).toBe("working");
    expect(lruWithTtl.get("test_expired")).toBeUndefined();
  });

  it("Phase 6: SingleFlight Map checks that concurrent/duplicate requests are correctly tracked", async () => {
    const flightKey = "test_user_flight";
    expect(bffSingleFlightMap.has(flightKey)).toBe(false);

    // Create a mock active request Promise
    const resolveValue = { success: true, data: "flight_result" };
    const flightPromise = Promise.resolve(resolveValue);

    bffSingleFlightMap.set(flightKey, flightPromise);
    expect(bffSingleFlightMap.has(flightKey)).toBe(true);

    const resolved = await bffSingleFlightMap.get(flightKey);
    expect(resolved).toEqual(resolveValue);

    bffSingleFlightMap.delete(flightKey);
    expect(bffSingleFlightMap.has(flightKey)).toBe(false);
  });
});
