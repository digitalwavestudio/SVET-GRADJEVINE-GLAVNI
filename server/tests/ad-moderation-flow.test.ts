import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * End-to-end proof for the construction-firm ad submission flow:
 *   1. Firm submits ad   -> stored as status "pending" + moderationStatus "pending"
 *   2. Admin Hub queue    -> the pending ad shows up in the moderation queue
 *   3. Admin approves      -> ad becomes status "active" + moderationStatus "approved"
 *   4. Poslovi vertical    -> the approved ad appears in the public jobs listing
 *
 * Runs against a tiny in-memory fake Firestore, so it never touches real data.
 */

// ---- In-memory fake Firestore (kept on globalThis so the test can inspect it) ----
vi.mock("../config/firebase.ts", () => {
  const store: Record<string, Record<string, any>> = {
    listings: {},
    users: {},
    system: {},
    transactions: {},
    outbox: {},
  };
  (globalThis as any).__store = store;

  let counter = 0;
  const genId = (prefix: string) => `${prefix}_${++counter}`;

  const snap = (collection: string, id: string) => {
    const data = store[collection]?.[id];
    return { id, exists: !!data, data: () => data };
  };

  const matches = (data: any, filters: any[]) =>
    filters.every(({ field, op, value }) => {
      const v = data?.[field];
      if (op === "==") return v === value;
      if (op === "in") return Array.isArray(value) && value.includes(v);
      return true;
    });

  const makeQuery = (collection: string, filters: any[] = [], lim?: number) => ({
    where: (field: string, op: string, value: any) =>
      makeQuery(collection, [...filters, { field, op, value }], lim),
    orderBy: () => makeQuery(collection, filters, lim),
    limit: (n: number) => makeQuery(collection, filters, n),
    startAfter: () => makeQuery(collection, filters, lim),
    select: () => makeQuery(collection, filters, lim),
    get: async () => {
      let rows = Object.entries(store[collection] || {})
        .filter(([, data]) => matches(data, filters))
        .map(([id, data]) => ({ id, exists: true, data: () => data }));
      if (typeof lim === "number") rows = rows.slice(0, lim);
      return { docs: rows, size: rows.length, empty: rows.length === 0, forEach: (f: any) => rows.forEach(f) };
    },
  });

  const collection = (name: string) => {
    if (!store[name]) store[name] = {};
    const q = makeQuery(name);
    return Object.assign(q, {
      doc: (id?: string) => {
        const realId = id || genId(name);
        return {
          id: realId,
          _collection: name,
          _id: realId,
          get: async () => snap(name, realId),
          set: async (data: any) => {
            store[name][realId] = { ...(store[name][realId] || {}), ...data };
          },
          update: async (data: any) => {
            store[name][realId] = { ...(store[name][realId] || {}), ...data };
          },
        };
      },
    });
  };

  const db = {
    collection,
    doc: (path: string) => {
      const [c, id] = path.split("/");
      return { id, _collection: c, _id: id, get: async () => snap(c, id) };
    },
    runTransaction: async (fn: any) => {
      const tx = {
        get: async (ref: any) => snap(ref._collection, ref._id),
        set: (ref: any, data: any) => {
          store[ref._collection][ref._id] = { ...(store[ref._collection][ref._id] || {}), ...data };
        },
        update: (ref: any, data: any) => {
          store[ref._collection][ref._id] = { ...(store[ref._collection][ref._id] || {}), ...data };
        },
      };
      return fn(tx);
    },
  };

  const admin = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => "MOCK_TS",
        increment: (n: number) => n,
      },
      Timestamp: { fromMillis: (m: number) => ({ _ms: m }), fromDate: (d: Date) => ({ _date: d }) },
    },
  };

  return {
    db,
    admin,
    checkQuotaStatus: () => false,
    getMockDocSnapshot: () => ({ exists: false }),
  };
});

// ---- Light mocks for side-effect collaborators (cache, stats, sync, queue, audit, logging) ----
vi.mock("../services/cache.service.ts", () => ({
  CacheService: {
    get: async () => null,
    set: async () => {},
    delete: async () => {},
    invalidateByPrefix: async () => {},
    getOrSetSWR: async (_k: string, fn: any) => fn(),
  },
}));
vi.mock("../services/admin-stats.service.ts", () => ({
  AdminStatsService: { updateGlobalStats: async () => {}, updateUserStats: async () => {} },
}));
vi.mock("../services/audit.service.ts", () => ({
  AuditService: { logAction: async () => {} },
  AuditAction: new Proxy({}, { get: (_t, p) => String(p) }),
}));
vi.mock("../services/sync.service.ts", () => ({
  SyncManager: { syncAd: async () => {}, deleteAd: async () => {} },
}));
vi.mock("../services/admin/admin-users.service.ts", () => ({
  AdminUsersService: { syncClaims: async () => {} },
}));
vi.mock("../services/queue.service.ts", () => ({
  QueueService: { addJob: async () => {} },
  JobType: { OUTBOX_PROCESS: "outbox" },
  JobPriority: { HIGH: 1 },
}));
vi.mock("../services/dashboard.service.ts", () => ({
  DashboardService: { clearEmployerStatsCache: async () => {} },
}));
vi.mock("../events/event-bus.ts", () => ({
  eventBus: { emit: () => {} },
  DomainEvents: { AD_CREATED: "ad.created", JOB_CREATED: "job.created" },
}));
vi.mock("../utils/logger.ts", () => {
  class Logger {
    info() {}
    warn() {}
    error() {}
    debug() {}
    static withContext() {
      return new Logger();
    }
  }
  return { Logger };
});

import { UnifiedAdsService } from "../services/unified-ads.service.ts";
import { AdminAdsService } from "../services/admin/admin-ads.service.ts";
import { JobsCoreService } from "../services/jobs/jobs-core.service.ts";

const store = () => (globalThis as any).__store as Record<string, Record<string, any>>;

describe("Construction-firm ad submission -> moderation -> listing flow", () => {
  const uid = "firm-1";

  beforeEach(() => {
    const s = store();
    for (const key of Object.keys(s)) s[key] = {};
    s.users[uid] = {
      displayName: "Bau d.o.o.",
      role: "poslodavac",
      isVerified: true,
      businessProfile: { companyName: "Bau d.o.o." },
      walletBalance: 0,
      availableCredits: 0,
    };
  });

  it("1) a submitted ad is saved as PENDING and awaits moderation", async () => {
    const { id } = await UnifiedAdsService.createAd(
      "jobs",
      { title: "Potreban zidar", description: "Gradiliste Beograd", location: "Beograd" },
      uid,
    );

    const ad = store().listings[id];
    expect(ad).toBeTruthy();
    expect(ad.status).toBe("pending");
    expect(ad.moderationStatus).toBe("pending");
    expect(ad.type).toBe("job");
  });

  it("2) the pending ad appears in the Admin Hub moderation queue", async () => {
    const { id } = await UnifiedAdsService.createAd(
      "jobs",
      { title: "Potreban tesar", description: "Hitno", location: "Novi Sad" },
      uid,
    );

    const queue = await AdminAdsService.getModerationQueue(25);
    const ids = queue.items.map((i: any) => i.id);
    expect(ids).toContain(id);
  });

  it("3) after admin approval the ad becomes ACTIVE", async () => {
    const { id } = await UnifiedAdsService.createAd(
      "jobs",
      { title: "Potreban armirac", description: "Dugorocno", location: "Nis" },
      uid,
    );

    await AdminAdsService.moderateListing("listings", id, "approved", "admin-1");

    const ad = store().listings[id];
    expect(ad.status).toBe("active");
    expect(ad.moderationStatus).toBe("approved");
  });

  it("4) the approved ad shows up on the Poslovi (jobs) public listing", async () => {
    const { id } = await UnifiedAdsService.createAd(
      "jobs",
      { title: "Potreban moler", description: "Stan 80m2", location: "Beograd" },
      uid,
    );

    // Before approval it must NOT be in the public listing
    let listing: any = await JobsCoreService.getPublicJobs(50);
    expect(listing.docs.map((d: any) => d.id)).not.toContain(id);

    await AdminAdsService.moderateListing("listings", id, "approved", "admin-1");

    listing = await JobsCoreService.getPublicJobs(50);
    expect(listing.docs.map((d: any) => d.id)).toContain(id);
  });
});
