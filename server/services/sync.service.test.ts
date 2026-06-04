import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncManager, SyncTaskType } from "./sync.service.ts";
import { SyncProcessor } from "./sync/sync-processor.service.ts";
import { db, admin } from "../config/firebase.ts";
import { syncJobToIndex } from "./algolia.service.ts";
import { QueueService, JobType } from "./queue.service.ts";

const mockCollection = {
  add: vi.fn().mockResolvedValue({ id: "task123" }),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
};

vi.mock("../config/firebase.ts", () => ({
  db: {
    collection: vi.fn(() => mockCollection),
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      update: vi.fn().mockResolvedValue({}),
    })),
  },
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: vi.fn(() => "MOCK_TS"),
      },
    },
  },
}));

vi.mock("./queue.service.ts", () => ({
  QueueService: {
    addJob: vi.fn().mockResolvedValue({}),
  },
  JobType: {
    SYNC_COLLECTION: "sync_collection",
  },
  JobPriority: {
    LOW: 10,
    MEDIUM: 20,
    HIGH: 30,
  },
}));

vi.mock("./algolia.service.ts", () => ({
  syncJobToIndex: vi.fn().mockResolvedValue({}),
}));

vi.mock("./monitoring.service.ts", () => ({
  MonitoringService: {
    recordSyncSuccess: vi.fn(),
    recordSyncFail: vi.fn(),
    recordError: vi.fn(),
  },
}));

describe("SyncManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("queueSync", () => {
    it("should add a task to QueueService", async () => {
      await SyncManager.queueSync("user123");

      expect(QueueService.addJob).toHaveBeenCalledWith(
        JobType.SYNC_COLLECTION,
        expect.objectContaining({
          targetId: "user123",
          type: SyncTaskType.USER_RELATIONAL_SYNC,
        }),
        expect.any(Object),
      );
    });
  });

  describe("processJob", () => {
    it("should sync job to algolia for ALGOLIA_JOB_SYNC type", async () => {
      const mockJob = {
        data: {
          type: SyncTaskType.ALGOLIA_JOB_SYNC,
          targetId: "job1",
          data: { title: "Test Job" },
          correlationId: "correlation123",
        },
      } as unknown as import("bullmq").Job;

      await SyncProcessor.processJob(mockJob);

      expect(syncJobToIndex).toHaveBeenCalledWith(
        "job1",
        expect.objectContaining({ title: "Test Job" }),
      );
    });
  });
});
