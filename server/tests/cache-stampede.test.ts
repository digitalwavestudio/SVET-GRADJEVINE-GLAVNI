import { describe, it, expect, vi } from "vitest";

let firestoreFetchCount = 0;

vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockImplementation(async () => {
    firestoreFetchCount++;
    await new Promise(r => setTimeout(r, 50));
    return {
      docs: [{ id: "test", data: () => ({ title: "test", status: "active" }) }],
      size: 1, exists: true,
      data: () => ({ count: 1, title: "test", status: "active" }),
    };
  });
  const mockDoc = { delete: vi.fn(), set: vi.fn(), update: vi.fn(), get: mockGet };
  const mockQuery = { where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), count: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), get: mockGet, doc: vi.fn().mockReturnValue(mockDoc) };
  const mockCollection = vi.fn().mockReturnValue(mockQuery);
  return {
    db: { collection: mockCollection, doc: vi.fn().mockReturnValue(mockDoc) },
    checkQuotaStatus: vi.fn().mockReturnValue(false),
  };
});

vi.mock("@sentry/node", () => ({ captureException: vi.fn(), captureMessage: vi.fn(), withScope: vi.fn() }));

import { CacheService } from "../services/cache.service.ts";

describe("Cache Stampede & SingleFlight Protection", () => {
  it("Coalesces 200 concurrent requests into a single Firestore read", async () => {
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const fetchFn = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 100));
      return { data: "stampede-test", timestamp: Date.now() };
    });

    const TOTAL = 200;
    const start = performance.now();
    const results = await Promise.all(
      Array.from({ length: TOTAL }, () =>
        CacheService.getOrSet("stampede:test:key:001", fetchFn, 60000)
      )
    );
    const elapsed = performance.now() - start;

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(TOTAL);
    results.forEach(r => expect(r).toEqual({ data: "stampede-test", timestamp: expect.any(Number) }));
    expect(elapsed).toBeLessThan(1500);
  });

  it("SWR mode coalesces 200 concurrent cold requests", async () => {
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const fetchFn = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 100));
      return { swr: "data", version: 2 };
    });

    const TOTAL = 200;
    const results = await Promise.all(
      Array.from({ length: TOTAL }, () =>
        CacheService.getOrSetSWR("stampede:swr:key:002", fetchFn, 60000)
      )
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(TOTAL);
    results.forEach(r => expect(r).toEqual({ swr: "data", version: 2 }));
  });

  it("Isolated keys do not interfere during concurrent stampede", async () => {
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const counters = { alpha: 0, beta: 0, gamma: 0 };
    const fetchAlpha = vi.fn().mockImplementation(async () => { counters.alpha++; await new Promise(r => setTimeout(r, 80)); return "alpha" });
    const fetchBeta = vi.fn().mockImplementation(async () => { counters.beta++; await new Promise(r => setTimeout(r, 80)); return "beta" });
    const fetchGamma = vi.fn().mockImplementation(async () => { counters.gamma++; await new Promise(r => setTimeout(r, 80)); return "gamma" });

    const results = await Promise.all([
      ...Array.from({ length: 50 }, () => CacheService.getOrSet("stampede:multi:a", fetchAlpha, 60000)),
      ...Array.from({ length: 50 }, () => CacheService.getOrSet("stampede:multi:b", fetchBeta, 60000)),
      ...Array.from({ length: 50 }, () => CacheService.getOrSet("stampede:multi:c", fetchGamma, 60000)),
    ]);

    expect(counters.alpha).toBe(1);
    expect(counters.beta).toBe(1);
    expect(counters.gamma).toBe(1);
    expect(results.filter(r => r === "alpha")).toHaveLength(50);
    expect(results.filter(r => r === "beta")).toHaveLength(50);
    expect(results.filter(r => r === "gamma")).toHaveLength(50);
  });
});
