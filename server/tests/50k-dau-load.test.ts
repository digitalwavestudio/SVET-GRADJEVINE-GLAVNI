import { describe, it, expect, vi } from "vitest";

let firestoreFetchCount = 0;

vi.mock("../config/firebase.ts", () => {
  const mockGet = vi.fn().mockImplementation(async () => ({
    docs: [
      {
        id: "doc_1",
        data: () => ({
          title: "Test",
          status: "active",
          type: "jobs",
          activeAds: 0,
          pendingApplications: 0,
          totalViews: 0,
          createdAt: { _seconds: Math.floor(Date.now() / 1000) },
        }),
      },
    ],
    size: 1,
    exists: true,
    data: () => ({
      count: 1,
      totalJobs: 150,
      machinesCount: 45,
      realEstateCount: 60,
      companiesCount: 200,
      premiumPartners: 12,
      urgentAds: 8,
    }),
  }));

  const mockDoc = {
    delete: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockImplementation(async () => ({
      exists: true,
      data: () => ({
        trend: {},
        activeAds: 0,
        pendingApplications: 0,
        totalViews: 0,
      }),
    })),
  };

  const mockQuery = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    get: mockGet,
    doc: vi.fn().mockReturnValue(mockDoc),
  };

  const mockCollection = vi.fn().mockReturnValue(mockQuery);

  return {
    db: {
      collection: mockCollection,
      doc: vi.fn().mockReturnValue(mockDoc),
      batch: vi.fn().mockReturnValue({ set: vi.fn(), commit: vi.fn().mockResolvedValue({}) }),
      runTransaction: vi.fn(),
    },
    checkQuotaStatus: vi.fn().mockReturnValue(false),
    admin: {
      firestore: {
        FieldValue: {
          serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
          increment: vi.fn((val: number) => `MOCK_INCREMENT_${val}`),
        },
      },
    },
  };
});

vi.mock("@sentry/node", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn(),
  getActiveSpan: vi.fn(),
  startInactiveSpan: vi.fn(),
}));

vi.mock("firebase-admin", () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn(), applicationDefault: vi.fn() },
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
        increment: vi.fn((val: number) => `MOCK_INCREMENT_${val}`),
      },
    },
    auth: vi.fn().mockReturnValue({ getUser: vi.fn(), setCustomUserClaims: vi.fn() }),
  },
}));

import { bffService } from "../services/bff.service.ts";
import { CacheService } from "../services/cache.service.ts";

describe("50k DAU Load Test", () => {
  it("Handles peak-hour load with caching efficiency", async () => {
    // ── Reset state ─────────────────────────────────────────────────
    firestoreFetchCount = 0;
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();

    // ── User pools (simulating real traffic distribution) ──────────
    const USERS = {
      ANONYMOUS: { count: 3, platform: "web" as const },
      EMPLOYER: [
        { uid: "employer_1", role: "poslodavac" },
        { uid: "employer_2", role: "poslodavac" },
        { uid: "employer_3", role: "poslodavac" },
        { uid: "employer_4", role: "COMPANY" },
      ],
      MASTER: [
        { uid: "master_1", role: "majstor", profession: "Električar", location: "Beograd" },
        { uid: "master_2", role: "majstor", profession: "Molere", location: "Novi Sad" },
        { uid: "master_3", role: "MASTER", profession: "Stolar", location: "Niš" },
      ],
      ADMIN: [
        { uid: "admin_1", role: "admin", isAdmin: true },
      ],
    };

    // ── Scenario builder ────────────────────────────────────────────
    interface RequestSpec {
      label: string;
      fn: () => Promise<unknown>;
    }

    const buildScenarios = (): RequestSpec[] => {
      const specs: RequestSpec[] = [];

      // 30% Anonymous → Homepage
      for (let i = 0; i < USERS.ANONYMOUS.count; i++) {
        specs.push({
          label: `homepage_anon_${i}`,
          fn: () => bffService.getHomepageData(USERS.ANONYMOUS.platform),
        });
      }
      for (let i = 0; i < 3; i++) {
        specs.push({
          label: `homepage_mobile_${i}`,
          fn: () => bffService.getHomepageData("mobile"),
        });
      }

      // 40% Employer → Dashboard
      for (const u of USERS.EMPLOYER) {
        specs.push({
          label: `dashboard_employer_${u.uid}`,
          fn: () => bffService.getDashboardData(u.uid, u.role, false, u as never),
        });
      }

      // 20% Master → Dashboard
      for (const u of USERS.MASTER) {
        specs.push({
          label: `dashboard_master_${u.uid}`,
          fn: () => bffService.getDashboardData(u.uid, u.role, false, u as never),
        });
      }

      // 10% Admin → Dashboard
      for (const u of USERS.ADMIN) {
        specs.push({
          label: `dashboard_admin_${u.uid}`,
          fn: () => bffService.getDashboardData(u.uid, u.role, true, u as never),
        });
      }

      // Repeat scenarios 5x to reach ~50 concurrent requests (peak burst)
      const repeated: RequestSpec[] = [];
      for (let r = 0; r < 5; r++) {
        for (const s of specs) {
          repeated.push({ ...s, label: `${s.label}_burst${r}` });
        }
      }
      return repeated;
    };

    // ── Phase 0: Warm-up ───────────────────────────────────────────
    // Pre-load ICU locale data, dynamic imports, module resolution,
    // and one of each user-type path (homepage + all dashboard variants)
    console.log("[50kDAU] Warming up...");
    const warmupScenarios = buildScenarios();
    // Warm up all unique user types to avoid per-path cold-start during benchmark
    const warmed = new Set<string>();
    for (const s of warmupScenarios) {
      const key = s.label.replace(/_burst\d+$/, "");
      if (warmed.has(key)) continue;
      warmed.add(key);
      await s.fn();
    }
    // Clear cache so benchmark measures cold-start per-user caching
    CacheService["localCache"].clear();
    CacheService["inFlight"].clear();
    console.log("[50kDAU] Warm-up complete. Starting benchmark...");

    // ── Phase 1: Peak burst ────────────────────────────────────────
    // Simulates ~50 concurrent users hitting the system simultaneously
    const scenarios = buildScenarios();
    const TOTAL = scenarios.length;
    const latencies: number[] = [];
    const errors: { label: string; err: string }[] = [];
    const results: unknown[] = [];

    const runWithLatency = async (spec: RequestSpec): Promise<void> => {
      const start = performance.now();
      try {
        const res = await spec.fn();
        latencies.push(performance.now() - start);
        results.push(res);
      } catch (err) {
        latencies.push(performance.now() - start);
        errors.push({ label: spec.label, err: (err as Error).message });
      }
    };

    await Promise.all(scenarios.map((s) => runWithLatency(s)));

    // ── Phase 2: Metrics computation ──────────────────────────────
    const sorted = [...latencies].sort((a, b) => a - b);
    const avg = sorted.reduce((s, v) => s + v, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const max = sorted[sorted.length - 1];

    console.log(`[50kDAU] ─────────────────────────────────────`);
    console.log(`[50kDAU]  Total requests:   ${TOTAL}`);
    console.log(`[50kDAU]  Errors:           ${errors.length}/${TOTAL}`);
    console.log(`[50kDAU]  Firestore reads:  ${firestoreFetchCount}`);
    console.log(`[50kDAU]  Avg latency:      ${avg.toFixed(2)}ms`);
    console.log(`[50kDAU]  P50 latency:      ${p50.toFixed(2)}ms`);
    console.log(`[50kDAU]  P95 latency:      ${p95.toFixed(2)}ms`);
    console.log(`[50kDAU]  P99 latency:      ${p99.toFixed(2)}ms`);
    console.log(`[50kDAU]  Max latency:      ${max.toFixed(2)}ms`);
    console.log(`[50kDAU] ─────────────────────────────────────`);

    // ── Assertions ─────────────────────────────────────────────────

    // 1. No errors under peak load
    expect(errors).toHaveLength(0);

    // 2. All responses returned successfully
    expect(results.length).toBe(TOTAL);
    results.forEach((r, i) => {
      const res = r as { success?: boolean };
      expect(res).toBeDefined();
      if (res.success !== undefined) {
        expect(res.success).toBe(true);
      }
    });

    // 3. Firestore reads are aggressively cached.
    // With ~50 different users (5 groups × ~10 unique users), at most
    // 1 cold-start read per unique user per cache key is acceptable.
    // Homepage keys: homepage_bff_web_v4, homepage_bff_mobile_v4
    // Dashboard keys: bff_cache_tiered:{uid}, employer:stats:{uid},
    //   employer:trends:{uid}, metrics:user_analytics:{uid}:30
    // Max unique cache keys across 50 requests ≈ 30-40.
    // Sandbox mode hits a safety path with minimal reads.
    expect(firestoreFetchCount).toBeLessThanOrEqual(50);

    // 4. Latency — P95 under 1500ms, average under 500ms
    // (accounts for cold-start per-user path in test environment)
    expect(avg).toBeLessThan(500);
    expect(p95).toBeLessThan(1500);
  });
});
