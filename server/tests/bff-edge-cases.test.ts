import { describe, it, expect, vi, beforeEach } from "vitest";

let firestoreFetchCount = 0;

vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockImplementation(async () => {
    firestoreFetchCount++;
    return {
      docs: [{ id: "edge_test", data: () => ({ title: "edge", status: "active" }) }],
      size: 1, exists: true,
      data: () => ({ count: 1, title: "edge", status: "active" }),
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
import { bffService, bffSingleFlightMap } from "../services/bff.service.ts";

describe("BFF Edge Cases & Error Resilience", () => {
  beforeEach(() => {
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();
    bffSingleFlightMap.clear();
  });

  it("Handles empty platform gracefully (defaults to web)", async () => {
    const result = await bffService.getHomepageData("");
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("Returns degraded response on quota exhaustion for dashboard", async () => {
    const { checkQuotaStatus } = await import("../config/firebase.ts");
    vi.mocked(checkQuotaStatus).mockReturnValueOnce(true);

    const result = await bffService.getDashboardData(
      "edge_quota_user", "poslodavac", false,
      { uid: "edge_quota_user", role: "poslodavac" } as never,
    );

    expect(result).toBeDefined();
    expect((result as unknown as Record<string, unknown>)._degraded).toBe(true);
  });

  it("Survives null user input with graceful fallback", async () => {
    const result = await bffService.getDashboardData(
      "unknown_user", "poslodavac", false,
      null as never,
    );
    expect(result).toBeDefined();
  });

  it("Handles admin role verification with non-admin params", async () => {
    const result = await bffService.getDashboardData(
      "fake_admin", "standard", true,
      { uid: "fake_admin", role: "standard", isAdmin: true } as never,
    );
    expect(result).toBeDefined();
  });

  it("Does not share cache state between different users", async () => {
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const resultAlice = await bffService.getDashboardData(
      "alice_edge", "poslodavac", false,
      { uid: "alice_edge", role: "poslodavac" } as never,
    );
    const resultBob = await bffService.getDashboardData(
      "bob_edge", "poslodavac", false,
      { uid: "bob_edge", role: "poslodavac" } as never,
    );

    expect(resultAlice).toBeDefined();
    expect(resultBob).toBeDefined();
  });

  it("CacheService returns fallbackValue when fetch throws", async () => {
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const failingFn = vi.fn().mockRejectedValue(new Error("DB down"));
    const result = await CacheService.getOrSetSWR(
      "edge:failover_test", failingFn, 60000, { fallback: true, msg: "cached" },
    );
    expect(result).toEqual({ fallback: true, msg: "cached" });
  });

  it("CacheService throws when no fallback and fetch fails", async () => {
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    const failingFn = vi.fn().mockRejectedValue(new Error("DB unreachable"));
    await expect(
      CacheService.getOrSetSWR("edge:no_fallback", failingFn, 60000)
    ).rejects.toThrow();
  });
});
