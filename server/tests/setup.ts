import { vi } from "vitest";

// Mock Firebase Admin so it doesn't initialize real DB connections during unit tests
vi.mock("firebase-admin", () => {
  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      credential: {
        cert: vi.fn(),
        applicationDefault: vi.fn(),
      },
      firestore: {
        FieldValue: {
          serverTimestamp: vi.fn(() => "MOCK_TIMESTAMP"),
          increment: vi.fn((val: number) => `MOCK_INCREMENT_${val}`),
        },
      },
      auth: vi.fn().mockReturnValue({
        getUser: vi.fn(),
        setCustomUserClaims: vi.fn(),
      }),
    },
  };
});

// Mock Firestore explicitly if needed
vi.mock("firebase-admin/firestore", () => {
  return {
    getFirestore: vi.fn(() => ({
      settings: vi.fn(),
      collection: vi.fn(),
      batch: vi.fn(),
    })),
    FieldPath: {
      documentId: vi.fn(() => "__documentId__"),
    },
  };
});

process.env.NODE_ENV = "test";
process.env.FORCE_REDIS_OFFLINE = "true";
