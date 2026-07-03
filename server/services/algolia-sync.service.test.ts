import { describe, it, expect, vi, beforeEach } from "vitest";
import { AlgoliaSync, SyncTaskType } from "./algolia-sync.service.ts";
import { syncJobToIndex } from "./algolia.service.ts";
import { QueueService, JobType } from "./queue.service.ts";

vi.mock("../config/firebase.ts", () => {
  const mockCollection = {
    add: vi.fn().mockResolvedValue({ id: "task123" }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  };
  return {
    db: {
      collection: vi.fn(() => mockCollection),
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        update: vi.fn().mockResolvedValue({}),
      })),
    },
    admin: {
      firestore: {
        FieldValue: { serverTimestamp: vi.fn(() => "MOCK_TS") },
      },
    },
  };
});

vi.mock("./queue.service.ts", () => ({
  QueueService: { addJob: vi.fn().mockResolvedValue({}) },
  JobType: { SYNC_COLLECTION: "sync_collection" },
  JobPriority: { LOW: 10, MEDIUM: 20, HIGH: 30 },
}));

vi.mock("./algolia.service.ts", () => ({
  syncJobToIndex: vi.fn().mockResolvedValue({}),
}));
describe("AlgoliaSync", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("queueSync", () => {
    it("should add a task to QueueService", async () => {
      await AlgoliaSync.queueSync("user123");
      expect(QueueService.addJob).toHaveBeenCalledWith(
        JobType.SYNC_COLLECTION,
        expect.objectContaining({ targetId: "user123", type: SyncTaskType.USER_RELATIONAL_SYNC }),
        expect.any(Object),
      );
    });
  });
});
