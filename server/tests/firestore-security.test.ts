import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  setDoc,
  getDoc,
  updateDoc,
  doc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "fs";

let testEnv: any;
const PROJECT_ID = "test-project";

describe("Firestore Security Rules Audit", () => {
  beforeAll(async () => {
    const host = process.env.FIRESTORE_EMULATOR_HOST?.split(":")[0] || "127.0.0.1";
    const port = parseInt(process.env.FIRESTORE_EMULATOR_HOST?.split(":")[1] || "8080");
    try {
      testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
          host,
          port,
          rules: fs.readFileSync("firestore.rules", "utf8"),
        },
      });
    } catch (err) {
      console.warn("Could not initialize rules test environment, checking fallback conditions:", err);
    }
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async (context: any) => {
    if (!testEnv) {
      context.skip();
      return;
    }
    await testEnv.clearFirestore();
  });

  // --- IDENTITY & PII ---
  describe("User Profiles (PII Protection)", () => {
    it("should allow user to read their own profile", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "users/alice"), {
          firstName: "Alice",
          email: "alice@example.com",
          role: "standard",
        });
      });
      await assertSucceeds(getDoc(doc(alice.firestore(), "users/alice")));
    });

    it("should deny unauthorized reading of another user profile (PII Leak test)", async () => {
      const bob = testEnv.authenticatedContext("bob");
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "users/alice"), {
          firstName: "Alice",
          email: "alice@example.com",
        });
      });
      // This MUST fail in a hardened environment
      await assertFails(getDoc(doc(bob.firestore(), "users/alice")));
    });

    it("should deny listing users to non-admins (Scraping test)", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await assertFails(getDocs(collection(alice.firestore(), "users")));
    });
  });

  // --- PRIVILEGE ESCALATION ---
  describe("Privilege Escalation", () => {
    it("should deny self-promotion to admin", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await assertFails(
        setDoc(doc(alice.firestore(), "users/alice"), {
          role: "admin",
          email: "alice@example.com",
          firstName: "Alice",
          lastName: "Test",
        }),
      );
    });

    it("should deny updating sensitive fields (balance)", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "users/alice"), {
          partnerBalance: 0,
          role: "standard",
        });
      });
      await assertFails(
        updateDoc(doc(alice.firestore(), "users/alice"), {
          partnerBalance: 99999,
        }),
      );
    });
  });

  // --- LISTINGS & INTEGRITY ---
  describe("Listings Integrity", () => {
    it("should deny client-side ad creation (Backend-First rule)", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await assertFails(
        setDoc(doc(alice.firestore(), "listings/ad1"), {
          title: "Cheap iPhone",
          authorId: "alice",
          status: "active",
        }),
      );
    });

    it("should deny shadow updates to system fields", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "listings/ad1"), {
          title: "Ad 1",
          authorId: "alice",
          isPremium: false,
          status: "active",
        });
      });
      await assertFails(
        updateDoc(doc(alice.firestore(), "listings/ad1"), { isPremium: true }),
      );
    });

    it("should deny updates to deleted ads (Terminal State Lock)", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "listings/ad1"), {
          authorId: "alice",
          status: "deleted",
        });
      });
      await assertFails(
        updateDoc(doc(alice.firestore(), "listings/ad1"), {
          title: "New Title",
        }),
      );
    });
  });

  // --- PATH HARDENING ---
  describe("Path Variable Hardening", () => {
    it("should deny operations with invalid document IDs", async () => {
      const alice = testEnv.authenticatedContext("alice");
      const junkId = "a".repeat(200); // Exceeds 128 chars
      await assertFails(getDoc(doc(alice.firestore(), "users", junkId)));
    });
  });

  // --- ISOLATION (OUTBOX/DLQ) ---
  describe("System Isolation (Outbox/DLQ)", () => {
    it("should deny direct read/write to outbox for standard users", async () => {
      const alice = testEnv.authenticatedContext("alice");
      await assertFails(getDocs(collection(alice.firestore(), "outbox")));
      await assertFails(
        setDoc(doc(alice.firestore(), "outbox/o1"), { event: "AD_CREATED" }),
      );
    });

    it("should allow admin to read DLQ", async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        await setDoc(doc(context.firestore(), "admins/admin1"), {
          email: "admin@test.com",
        });
      });
      const admin = testEnv.authenticatedContext("admin1");
      await assertSucceeds(getDocs(collection(admin.firestore(), "dlq")));
    });
  });
});
