import { describe, it, expect, vi } from "vitest";

// Spy counter to track total mock Firestore database get queries
let firestoreFetchCount = 0;

vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockImplementation(async () => {
    firestoreFetchCount++;
    return {
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
      exists: true,
      data: () => ({
        count: 1,
        title: "Električar",
        status: "active",
        type: "jobs",
        createdAt: { _seconds: 1716240000 }
      })
    };
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
      collection: mockCollection,
      doc: vi.fn().mockReturnValue(mockDoc)
    },
    checkQuotaStatus: vi.fn().mockReturnValue(false)
  };
});

// Mock Sentry to avoid live reporting in test environments
vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn()
}));

import { CacheService } from "../services/cache.service.ts";
import { getDashboardBff } from "../controllers/bff.controller.ts";
import { bffSingleFlightMap } from "../services/bff.service.ts";
import { Request, Response } from "express";

describe("BFF High-Load Stress & Concurrency Benchmark", () => {
  it("Simulates 150 concurrent client sessions calling BFF routes to verify extreme caching efficiency", async () => {
    // Reset global spy counters prior to executing benchmark run
    firestoreFetchCount = 0;
    bffSingleFlightMap.clear();

    const TOTAL_REQUESTS = 150;
    const durHistory: number[] = [];
    const responsePayloads: unknown[] = [];

    // Auxiliary helper to generate a mocked Express Req/Res cycle for the stress test
    const runMockedBffRequest = (userId: string, role: string): Promise<unknown> => {
      const startTime = performance.now();
      
      const req = {
        user: { uid: userId, role, id: userId },
        headers: {},
        originalUrl: "/api/bff/dashboard",
        url: "/api/bff/dashboard",
        method: "GET"
      } as unknown as Request;

      return new Promise((resolve, reject) => {
        const res = {
          setHeader: vi.fn(),
          status: vi.fn().mockReturnThis(),
          json: vi.fn().mockImplementation((payload: unknown) => {
            const extTime = performance.now() - startTime;
            durHistory.push(extTime);
            responsePayloads.push(payload);
            resolve(payload);
            return res;
          })
        } as unknown as Response;

        const next = (err?: unknown) => {
          if (err) reject(err);
        };

        getDashboardBff(req, res, next).catch((err) => reject(err));
      });
    };

    // Phase 1: Heat up the system with parallel requests triggering SingleFlight coalescing
    // We fire all 150 requests truly concurrently using Promise.all
    const promises = Array.from({ length: TOTAL_REQUESTS }, () => {
      // All requests are initiated by the same employer user profile to maximize coalescing
      return runMockedBffRequest("stress_test_user_789", "poslodavac");
    });

    const results = await Promise.all(promises);

    // Phase 2: Compute performance metrics for the stress test
    const totalDuration = durHistory.reduce((sum, val) => sum + val, 0);
    const averageDuration = totalDuration / TOTAL_REQUESTS;

    console.log(`[Stress Test Result] Total parallel requests: ${TOTAL_REQUESTS}`);
    console.log(`[Stress Test Result] Average latency: ${averageDuration.toFixed(2)}ms`);
    console.log(`[Stress Test Result] Primary physical Firestore db reads: ${firestoreFetchCount}`);

    // Assert that the database is protected with EXACTLY zero incremental reads beyond the absolute cold-start baseline (at most 7 queries for consolidated aggregation)
    expect(firestoreFetchCount).toBeLessThanOrEqual(7);

    // Verify system outcomes that SingleFlight request coalescing and local caching keep response time below 600ms under extreme parallel pressure
    expect(averageDuration).toBeLessThan(600);

    // Verify all returned responses loaded the data structure successfully
    results.forEach((res) => {
      const response = res as { success: boolean; stats: unknown };
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.stats).toBeDefined();
    });
  });
});
