import { describe, it, expect, vi, beforeEach } from "vitest";

let firestoreFetchCount = 0;

vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockImplementation(async () => {
    firestoreFetchCount++;
    return {
      docs: [{ id: "evict_test", data: () => ({ title: "evict", status: "active" }) }],
      size: 1, exists: true,
      data: () => ({ count: 1, title: "evict", status: "active" }),
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

describe("Cache Eviction Isolation", () => {
  beforeEach(() => {
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();
  });

  it("Deleting one key does not affect unrelated cache entries", async () => {
    const fetchA = vi.fn().mockResolvedValue("value_a");
    const fetchB = vi.fn().mockResolvedValue("value_b");

    await CacheService.getOrSet("evict:key_a", fetchA, 60000);
    await CacheService.getOrSet("evict:key_b", fetchB, 60000);

    expect(fetchA).toHaveBeenCalledTimes(1);
    expect(fetchB).toHaveBeenCalledTimes(1);

    await CacheService.delete("evict:key_a");

    const aAfter = await CacheService.get<string>("evict:key_a");
    expect(aAfter).toBeNull();

    const bAfter = await CacheService.get<string>("evict:key_b");
    expect(bAfter).toBe("value_b");
  });

  it("Re-fetches after eviction produces fresh data", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce("original")
      .mockResolvedValueOnce("refreshed");

    const first = await CacheService.getOrSet<string>("evict:refresh_test", fetchFn, 60000);
    expect(first).toBe("original");
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await CacheService.delete("evict:refresh_test");

    const second = await CacheService.getOrSet<string>("evict:refresh_test", fetchFn, 60000);
    expect(second).toBe("refreshed");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("SWR stale cache survives after fresh fetch fails (stale-while-revalidate)", async () => {
    const liveFetch = vi.fn().mockResolvedValue({ live: true, data: "fresh" });
    await CacheService.getOrSetSWR("evict:swr_stale", liveFetch, 60000);
    expect(liveFetch).toHaveBeenCalledTimes(1);

    const failingFetch = vi.fn().mockRejectedValue(new Error("DB failure"));
    const result = await CacheService.getOrSetSWR(
      "evict:swr_stale", failingFetch, 60000,
    );
    expect(result).toEqual({ live: true, data: "fresh" });
  });

  it("Multiple deletes on same key are idempotent", async () => {
    const fetchFn = vi.fn().mockResolvedValue("idempotent_value");
    await CacheService.getOrSet("evict:idempotent", fetchFn, 60000);

    await CacheService.delete("evict:idempotent");
    await CacheService.delete("evict:idempotent");
    await CacheService.delete("evict:idempotent");

    const val = await CacheService.get<string>("evict:idempotent");
    expect(val).toBeNull();
  });

  it("Local cache L1 is cleared on delete, forcing fresh fetch", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce("initial")
      .mockResolvedValueOnce("reloaded");

    const first = await CacheService.getOrSet("evict:l1_clear", fetchFn, 60000);
    expect(first).toBe("initial");

    await CacheService.delete("evict:l1_clear");

    const second = await CacheService.getOrSet("evict:l1_clear", fetchFn, 60000);
    expect(second).toBe("reloaded");
  });
});
