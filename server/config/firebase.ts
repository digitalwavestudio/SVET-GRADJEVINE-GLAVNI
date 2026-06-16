import { env } from "./env.ts";
import admin from "firebase-admin";
import { getFirestore, QuerySnapshot, DocumentSnapshot } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let currentDirname = "";
try {
  if (typeof __dirname !== "undefined") {
    currentDirname = __dirname;
  } else if (typeof import.meta !== "undefined" && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  } else {
    currentDirname = process.cwd();
  }
} catch (e) {
  currentDirname = process.cwd();
}

const rootDir = path.resolve(currentDirname, "../../");

interface FirebaseAppletConfig {
  projectId: string;
  storageBucket: string;
  firestoreDatabaseId?: string;
}

let firebaseConfig: FirebaseAppletConfig = {
  projectId: "placeholder",
  storageBucket: "placeholder"
};

try {
  let configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    configPath = path.join(rootDir, "firebase-applet-config.json");
  }

  if (fs.existsSync(configPath)) {
    console.log(`[FIREBASE] Loading configuration from: ${configPath}`);
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    console.warn(
      "[FIREBASE] firebase-applet-config.json missing. Using defaults.",
    );
  }
} catch (e) {
  console.error(
    "[FIREBASE] Failed to read or parse firebase-applet-config.json",
    e,
  );
}

let _initialized = false;

export function ensureInitialized() {
  if (_initialized) return;

  try {
    if (admin.apps.length === 0) {
      console.log(
        "[FIREBASE] Initializing Admin SDK for project: " +
          firebaseConfig.projectId,
      );
      let credential;
      let serviceAccountKey: any = null;

      // 1. Check if local JSON file exists
      const localKeyPath = path.resolve(process.cwd(), "firebase-service-account.json");
      if (fs.existsSync(localKeyPath)) {
        try {
          console.log("[FIREBASE] Using service account key from local file: firebase-service-account.json");
          serviceAccountKey = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
        } catch (fileErr) {
          console.error("[FIREBASE] Failed to read/parse local firebase-service-account.json:", fileErr);
        }
      }

      // 2. Fallback to env key if not loaded from file
      if (!serviceAccountKey && env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          console.log("[FIREBASE] Using service account key from environment.");
          let keyString = env.FIREBASE_SERVICE_ACCOUNT_KEY;
          const trimmed = keyString.trim();
          if (fs.existsSync(trimmed)) {
            serviceAccountKey = JSON.parse(fs.readFileSync(trimmed, "utf-8"));
          } else {
            if (!trimmed.startsWith("{")) keyString = "{" + trimmed;
            if (!keyString.trim().endsWith("}")) keyString = keyString + "}";
            serviceAccountKey = JSON.parse(keyString);
          }
        } catch (e: unknown) {
          console.error(
            "[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from env",
            e instanceof Error ? e.message : String(e),
          );
        }
      }

      if (serviceAccountKey) {
        credential = admin.credential.cert(serviceAccountKey);
      } else {
        console.log("[FIREBASE] Using applicationDefault credentials.");
        try {
          credential = admin.credential.applicationDefault();
        } catch (appDefaultErr) {
          console.warn("[FIREBASE] applicationDefault credentials failed. Using dummy fallback cert to ensure container liveness.");
          credential = admin.credential.cert({
            projectId: firebaseConfig.projectId || "svet-gradjevine-mock",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADA\n-----END PRIVATE KEY-----",
            clientEmail: "mock@svet-gradjevine-mock.iam.gserviceaccount.com"
          });
        }
      }

      admin.initializeApp({
        credential,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      console.log("[FIREBASE] Admin SDK initialized.");
    }
    _initialized = true;
  } catch (err) {
    console.error("[FIREBASE] Critical initialization error:", err);
    throw err;
  }
}

let _db: admin.firestore.Firestore | null = null;
export function getDb() {
  ensureInitialized();
  if (!_db) {
    try {
      console.log(
        "[FIREBASE] Getting Firestore instance for database: " +
          (firebaseConfig.firestoreDatabaseId || "(default)"),
      );
      _db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId as string);
      _db.settings({ ignoreUndefinedProperties: true });
    } catch (err) {
      console.error("[FIREBASE] Failed to get Firestore instance:", err);
      throw err;
    }
  }
  return _db;
}

import { trackFirestoreOp } from "../middleware/telemetry.middleware.ts";
import { MonitoringService } from "../services/monitoring.service.ts";

// --- FIRESTORE QUOTA RUNTIME PROTECTION LAYER ---
let isQuotaExhausted = false;
let quotaExhaustedAt = 0;
// PROMPT 10: 24h Firebase (Daily Quota) cooldown instead of 5-min circuit breaker
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000; // Smanjeno sa 24h na 5 minuta za plaćeni (Blaze) plan
let lastRedisSync = 0;

export function withTimeout<T>(promise: Promise<T>, ms: number, errMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let timer = setTimeout(() => {
      const timeoutErr = new Error(errMessage) as FirestoreQuotaError;
      timeoutErr.code = 8; // Simulate RESOURCE_EXHAUSTED code so it triggers the protection layer
      reject(timeoutErr);
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    ).catch(() => {});
  });
}

async function syncQuotaStatusWithRedis() {
  const now = Date.now();
  if (now - lastRedisSync < 10000) { // Sync every 10 seconds max
    return;
  }
  lastRedisSync = now;

  try {
    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    if (redis) {
      const data = await redis.get("circuit_breaker:firestore_quota:exhausted");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.isExhausted) {
          isQuotaExhausted = true;
          quotaExhaustedAt = parsed.exhaustedAt;
        }
      } else {
        if (isQuotaExhausted) {
          isQuotaExhausted = false;
          console.log("🛡️ [Firestore Quota Protection] Circuit breaker reset by Redis.");
        }
      }
    }
  } catch (err) {
    // Silent catch
  }
}

export function checkQuotaStatus(): boolean {
  if (env.DISABLE_FIRESTORE_QUOTA_CHECK === "true") return false;
  syncQuotaStatusWithRedis(); // Non-blocking async check logic internally runs if time passed
  if (isQuotaExhausted) {
    const now = Date.now();
    const timeSinceExhaustion = now - quotaExhaustedAt;
    
    // Check if cooldown has passed
    if (timeSinceExhaustion > QUOTA_COOLDOWN_MS) {
      isQuotaExhausted = false;
      console.log(`🛡️ [Firestore Quota Protection] Cooldown period (${QUOTA_COOLDOWN_MS / (1000 * 60 * 60)}h) passed. Resetting Firestore access.`);
      
      // Auto-clear Redis circuit breaker status
      import("../utils/redis.ts").then(({ getRedis }) => {
        const redis = getRedis();
        if (redis) redis.del("circuit_breaker:firestore_quota:exhausted").catch(() => {});
      }).catch(() => {});
      return false;
    }
    return true;
  }
  return false;
}

export interface FirestoreQuotaError extends Error {
  code?: number;
  details?: string;
}

async function tryResolveFromRedis(docPath: string): Promise<admin.firestore.DocumentSnapshot | null> {
  try {
    const { getRedis } = await import("../utils/redis.ts");
    const redis = getRedis();
    if (redis) {
      const cached = await redis.get(`fs_cache:${docPath}`);
      if (cached) {
        const data = JSON.parse(cached);
        const docId = docPath.split("/").pop() || "unknown";
        console.log(`🛡️ [Firestore Quota] Served ${docPath} from Redis L2 Shield Cache.`);
        return {
          id: docId,
          exists: true,
          data: () => data,
          ref: { id: docId, path: docPath } as any,
          get: (field: string) => data[field]
        } as unknown as admin.firestore.DocumentSnapshot;
      }
    }
  } catch (err) {
    // Silent fallback
  }
  return null;
}

export function triggerQuotaProtection(error: FirestoreQuotaError | unknown): boolean {
  if (env.DISABLE_FIRESTORE_QUOTA_CHECK === "true") return false;
  const err = error as FirestoreQuotaError;
  const errMsg = err?.message || String(err);
  const errDetails = err?.details || "";
  if (
    errMsg.includes("RESOURCE_EXHAUSTED") ||
    errMsg.includes("Quota limit exceeded") ||
    errMsg.includes("quota exceeded") ||
    errDetails.includes("Quota limit exceeded") ||
    errMsg.includes("request timeout") ||
    err?.code === 8 ||
    errMsg.includes("Could not load the default credentials") ||
    errMsg.includes("Failed to get Firestore instance") ||
    errMsg.includes("Unauthorized") ||
    errMsg.includes("credential") ||
    errMsg.includes("permission_denied") ||
    errMsg.includes("Permission denied") ||
    err?.code === 7
  ) {
    if (!isQuotaExhausted) {
      isQuotaExhausted = true;
      quotaExhaustedAt = Date.now();
      console.error(
        "🚨 [Firestore Quota Protection ACTIVATED] Firestore Free Quota reached. Centralized Sandbox Fallbacks activated to protect server integrity!"
      );

      // Save globally to Redis asynchronous so it informs other nodes/workers
      import("../utils/redis.ts").then(({ getRedis }) => {
        const redis = getRedis();
        if (redis) {
          redis.set(
            "circuit_breaker:firestore_quota:exhausted",
            JSON.stringify({ isExhausted: true, exhaustedAt: quotaExhaustedAt }),
            "PX",
            QUOTA_COOLDOWN_MS
          ).catch(() => {});
        }
      }).catch(() => {});
    }
    return true;
  }
  return false;
}

export function getMockDocSnapshot(docId: string, docPath?: string): admin.firestore.DocumentSnapshot {
  let mockData: Record<string, unknown> | undefined = undefined;
  // ... (unutrašnja logika ostaje ista)

  if (docId === "admin_stats" || docPath?.includes("metadata/admin_stats")) {
    mockData = {
      systemOutboxPending: 0,
      systemOutboxDlq: 0,
      activeAds: 125,
      pendingAds: 4,
      premiumPartners: 18,
      totalUsers: 1450,
      verifiedCompanies: 32,
      jobsCount: 88,
      machinesCount: 30,
      companiesCount: 45,
      estimatedRevenue: 3400,
    };
  } else if (docPath?.startsWith("users/")) {
    // If it's the user mock
    mockData = {
      id: docId,
      name: "Standardni Korisnik",
      firstName: "Korisnik",
      lastName: "Svet Građevine",
      email: "sandbox-user@svetgradjevine.com",
      role: "standard",
      isAdmin: false,
      walletBalance: 1500,
      isVerified: false,
      company: "",
      photoURL: "https://svetgradjevine.com/favicon.ico",
      businessProfile: {
        logo: "https://svetgradjevine.com/favicon.ico",
      },
      createdAt: new Date().toISOString()
    };
    // Include private subcollection if asked
    if (docPath?.includes("/private/")) {
      mockData = {};
    }
  } else if (docId === "branding" || docPath?.includes("settings/branding")) {
    mockData = {
      heroTitle: "OSNAŽUJEMO GRAĐEVINSKU INDUSTRIJU",
      heroSubtitle: "Povezujemo profesionalce i klijente širom regiona.",
      primaryColor: "#0f172a",
      secondaryColor: "#3b82f6"
    };
  } else if (docPath?.includes("metadata/premium_partners_fastpath")) {
    mockData = {
      partners: [
        { id: "f1", name: "ENERGOPROJEKT", logo: "" },
        { id: "f2", name: "STRABAG", logo: "" },
        { id: "f3", name: "NAPRED", logo: "" },
        { id: "f4", name: "KARIN KOMERC", logo: "" },
        { id: "f5", name: "MILLENNIUM TEAM", logo: "" },
        { id: "f6", name: "PUTEVI SRBIJE", logo: "" }
      ],
      updatedAt: new Date().toISOString()
    };
  } else if (docPath?.includes("metadata/promoted_ads_fastpath")) {
    mockData = {
      urgent: [
        {
          id: "fu1",
          title: "HITNO: Keramičar / Gipsar za unutrašnje radove",
          category: "jobs",
          grad: "Beograd",
          location: "Beograd",
          salary: "2000+ EUR",
          comp: "Lux Adaptacije d.o.o.",
          logo: "",
          images: [],
          isPremium: false,
          isUrgent: true,
          createdAt: new Date().toISOString()
        }
      ],
      premium: [
        {
          id: "fp1",
          title: "Građevinski Inženjer - Šef Gradilišta",
          category: "jobs",
          grad: "Beograd",
          location: "Novi Beograd",
          salary: "1500 - 2000 EUR",
          comp: "Energoprojekt Visokogradnja",
          logo: "",
          images: [],
          isPremium: true,
          isUrgent: false,
          createdAt: new Date().toISOString()
        },
        {
          id: "fp2",
          title: "Rukovalac Bagerom i Utovarivačem",
          category: "jobs",
          grad: "Novi Sad",
          location: "Novi Sad",
          salary: "1200 - 1400 EUR",
          comp: "Karin Komerc",
          logo: "",
          images: [],
          isPremium: true,
          isUrgent: false,
          createdAt: new Date().toISOString()
        }
      ]
    };
  } else if (docPath?.includes("metadata/global_stats") || docPath?.includes("metadata/global_stats_consolidated")) {
    mockData = {
      jobsCount: 124,
      machinesCount: 64,
      companiesCount: 88,
      accommodationsCount: 42,
      cateringsCount: 15,
      plotsCount: 22,
      marketplaceCount: 310,
      totalUsers: 1450,
      activeAds: 645,
      updatedAt: new Date().toISOString()
    };
  } else if (docPath?.includes("metadata/magazine_stats")) {
    mockData = {
      totalViews: 41200,
      totalArticles: 145,
      totalCategories: 8,
      clicksCount: 3105,
      updatedAt: new Date().toISOString()
    };
  } else if (docId === "platform" || docPath?.includes("settings/platform")) {
    mockData = {
      maintenanceMode: false,
      allowRegistrations: true,
    };
  } else if (docId === "config" || docPath?.includes("system/config")) {
    mockData = {
      stripeEnabled: true,
      allowFreePostings: true,
    };
  } else if (docPath?.includes("user_stats/")) {
    mockData = {
      activeAds: 12,
      totalViews: 1540,
      pendingApplications: 3,
    };
  }

  return {
    id: docId,
    exists: mockData !== undefined,
    data: () => mockData,
    ref: { id: docId, path: docPath || `mock_col/${docId}` } as admin.firestore.DocumentReference
  } as unknown as admin.firestore.DocumentSnapshot;
}

function unwrapArg(arg: unknown): unknown {
  if (arg && typeof arg === 'object') {
    const argObj = arg as Record<string, unknown>;
    if (argObj.__raw_target) {
      return argObj.__raw_target;
    }
  }
  return arg;
}

export const db = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === '__raw_target') {
        return getDb();
      }

      const firestoreDb = getDb();
      const value = Reflect.get(firestoreDb, prop);

      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const unwrappedArgs = args.map(unwrapArg);

          if (checkQuotaStatus()) {
            if (prop === 'runTransaction') {
              const updateFunction = args[0] as (transaction: admin.firestore.Transaction) => Promise<unknown>;
              try {
                return Promise.resolve(updateFunction(wrapTransaction({})));
              } catch (txErr) {
                return Promise.resolve(true);
              }
            }
            if (prop === 'collection' || prop === 'doc') {
              return wrapFirestoreObject({ id: args[0], path: args[0] });
            }
            if (prop === 'batch') {
              return wrapBatch({});
            }
          }

          let result: unknown;
          try {
            if (prop === 'runTransaction') {
              const originalUpdate = args[0] as (transaction: admin.firestore.Transaction) => Promise<unknown>;
              const wrappedArgs = [...unwrappedArgs];
              wrappedArgs[0] = async (transaction: admin.firestore.Transaction) => {
                try {
                  return await originalUpdate(wrapTransaction(transaction));
                } catch (txErr: unknown) {
                  if (triggerQuotaProtection(txErr)) {
                    return true;
                  }
                  throw txErr;
                }
              };
              result = firestoreDb.runTransaction(wrappedArgs[0] as (transaction: admin.firestore.Transaction) => Promise<unknown>);
            } else {
              result = value.apply(firestoreDb, unwrappedArgs);
            }
          } catch (syncErr) {
            if (triggerQuotaProtection(syncErr)) {
              if (prop === 'runTransaction') {
                return Promise.resolve(true);
              }
              if (prop === 'collection' || prop === 'doc') {
                return wrapFirestoreObject({ id: args[0], path: args[0] });
              }
              if (prop === 'batch') {
                return wrapBatch({});
              }
            }
            throw syncErr;
          }

          if (result instanceof Promise) {
            return result.catch((err: Error) => {
              if (triggerQuotaProtection(err)) {
                if (prop === 'runTransaction') {
                  return true;
                }
                return null;
              }
              throw err;
            });
          }

          if (prop === 'collection' || prop === 'doc' || prop === 'collectionGroup') {
            return wrapFirestoreObject(result as object);
          }
          if (prop === 'batch') {
            return wrapBatch(result as admin.firestore.WriteBatch);
          }

          return result;
        };
      }
      return value;
    },
  },
) as admin.firestore.Firestore;

/**
 * Extract target path helper
 */
interface FirestoreObjectMetadata {
  id?: string;
  path?: string;
  _path?: { relativeName?: string; formattedName?: string };
  parent?: { path?: string };
  _queryOptions?: { collectionId?: string; parentPath?: { relativeName?: string } };
  _reference?: { path?: string };
}

const getTargetPath = (t: FirestoreObjectMetadata): string => {
  if (!t) return "unknown";
  if (typeof t.path === "string") return t.path;
  if (t._path && typeof t._path.relativeName === "string") return t._path.relativeName;
  if (t._path && typeof t._path.formattedName === "string") {
    const parts = t._path.formattedName.split("/documents/");
    if (parts.length > 1) return parts[1];
  }
  if (t.parent && typeof t.parent.path === "string") return t.parent.path;
  if (t._queryOptions && typeof t._queryOptions.collectionId === "string") return t._queryOptions.collectionId;
  if (t._queryOptions && t._queryOptions.parentPath) {
    const p = t._queryOptions.parentPath;
    if (typeof p.relativeName === "string") return p.relativeName;
  }
  if (t._reference && typeof t._reference.path === "string") return t._reference.path;
  return "unknown";
};

/**
 * Wraps CollectionReference, DocumentReference, or Query to intercept reads and writes
 */
function wrapFirestoreObject<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, prop: string | symbol) {
      if (prop === '__raw_target') {
        return target;
      }

      const chainableMethods = [
        'where', 'limit', 'orderBy', 'startAfter', 'select', 'offset',
        'startAt', 'endAt', 'endBefore', 'doc', 'collection', 'withConverter', 'parent', 'count'
      ];

      // 1. Quota is active: Sandbox modes/mock operations
      if (checkQuotaStatus()) {
        const targetObj = target as Record<string, unknown> & { id?: string; path?: string };
        if (prop === 'get') {
          return async (...args: unknown[]) => {
            const docId = targetObj.id || "mock_doc";
            const docPath = typeof targetObj.path === 'string' ? targetObj.path : undefined;
            
            if (docPath && docPath.split('/').length % 2 === 0) {
              const cached = await tryResolveFromRedis(docPath);
              if (cached) return cached;
              return getMockDocSnapshot(docId as string, docPath);
            }

            return {
              empty: true,
              docs: [],
              size: 0,
              data: () => ({ count: 0 }),
              forEach: () => {},
              docChanges: () => []
            } as unknown as admin.firestore.QuerySnapshot;
          };
        }
        if (['set', 'update', 'delete', 'add'].includes(prop as string)) {
          return (...args: unknown[]) => Promise.resolve({ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } });
        }
        if (chainableMethods.includes(prop as string)) {
          return (...chainArgs: unknown[]) => {
            let nextTarget = target as Record<string, unknown> & { id?: string; path?: string };
            if (prop === 'doc' || prop === 'collection') {
              const subPath = chainArgs[0] as string;
              nextTarget = {
                id: subPath,
                path: targetObj.path ? `${targetObj.path}/${subPath}` : subPath
              };
            }
            return wrapFirestoreObject(nextTarget);
          };
        }
        if (prop === 'id' || prop === 'path') {
          return targetObj[prop as string] || "mock_id_or_path";
        }
      }

      // 2. Normal mode: Real operations
      const value = Reflect.get(target, prop);
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const unwrappedArgs = args.map(unwrapArg);

          // If quota has been flagged right before execution
          if (checkQuotaStatus()) {
            const targetObj = target as Record<string, unknown> & { id?: string; path?: string };
            if (prop === 'get') {
              const docId = targetObj.id || "mock_doc";
              const docPath = typeof targetObj.path === 'string' ? targetObj.path : undefined;
              if (docPath && docPath.split('/').length % 2 === 0) {
                return tryResolveFromRedis(docPath).then(cached => cached || getMockDocSnapshot(docId as string, docPath));
              }
              return Promise.resolve({
                empty: true,
                docs: [],
                size: 0,
                data: () => ({ count: 0 }),
                forEach: () => {},
                docChanges: () => []
              } as unknown as admin.firestore.QuerySnapshot);
            }
            if (['set', 'update', 'delete', 'add'].includes(prop as string)) {
              return Promise.resolve({ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } });
            }
            if (chainableMethods.includes(prop as string)) {
              let nextTarget = target as Record<string, unknown> & { id?: string; path?: string };
              if (prop === 'doc' || prop === 'collection') {
                const subPath = args[0] as string;
                nextTarget = {
                  id: subPath,
                  path: targetObj.path ? `${targetObj.path}/${subPath}` : subPath
                };
              }
              return wrapFirestoreObject(nextTarget);
            }
          }

          const targetMetadata = target as FirestoreObjectMetadata;
          const targetPath = getTargetPath(targetMetadata);
          const isDocumentRef = targetPath && targetPath !== "unknown" && targetPath.split('/').length % 2 === 0;

          if (prop === 'get' && isDocumentRef) {
            return (async () => {
              const cached = await tryResolveFromRedis(targetPath);
              if (cached) {
                return cached;
              }

              trackFirestoreOp('read');
              let segmentTracker: { end: (opts?: { error: string }) => void } | undefined;
              try {
                const collectionName = targetPath ? targetPath.split('/')[0] : "unknown";
                const queryParams = { id: targetMetadata.id };
                MonitoringService.recordDbQuery(collectionName, queryParams);
                segmentTracker = MonitoringService.startSegment("db_transaction", {
                  collection: collectionName,
                  operation: prop as string,
                  path: targetPath,
                  queryParams
                });
              } catch (err) {}

              try {
                const resultPromise = value.apply(target, unwrappedArgs) as Promise<unknown>;
                let timeoutMs = 8000;
                if (targetPath.startsWith('settings/')) timeoutMs = 8000;
                else if (targetPath.startsWith('metadata/')) timeoutMs = 8000;

                const finalPromise = withTimeout(
                  resultPromise,
                  timeoutMs,
                  "Firestore request timeout - Quota or network exhausted (Trip Circuit Breaker)"
                );

                const res = await finalPromise;
                if (segmentTracker) segmentTracker.end();

                try {
                  const collection = targetPath.split('/')[0] || "unknown_collection";
                  if (res && (res as any).exists) {
                    const docSnap = res as DocumentSnapshot<unknown>;
                    const { getRedis } = await import("../utils/redis.ts");
                    const redis = getRedis();
                    if (redis) {
                      await redis.set(`fs_cache:${targetPath}`, JSON.stringify(docSnap.data()), "EX", 600); // 10 minutes L2 Shield Cache
                    }
                    MonitoringService.recordFirestoreAudit(collection, targetPath, 1, 1);
                  } else {
                    MonitoringService.recordFirestoreAudit(collection, targetPath, 1, 0);
                  }
                } catch (auditErr) {}

                return res;
              } catch (err: any) {
                if (segmentTracker) segmentTracker.end({ error: err.message });
                if (triggerQuotaProtection(err)) {
                  const docId = targetMetadata.id || "mock_doc";
                  return getMockDocSnapshot(docId as string, targetPath);
                }
                throw err;
              }
            })();
          }

          if (prop === 'get') {
            trackFirestoreOp('read');
          } else if (['set', 'update', 'delete', 'add'].includes(prop as string)) {
            trackFirestoreOp('write');
            if (isDocumentRef && targetPath) {
              import("../utils/redis.ts").then(({ getRedis }) => {
                const redis = getRedis();
                if (redis) redis.del(`fs_cache:${targetPath}`).catch(() => {});
              }).catch(() => {});
            }
          }

          const isGet = prop === 'get';
          const isWrite = ['set', 'update', 'delete', 'add'].includes(prop as string);

          let segmentTracker: { end: (opts?: { error: string }) => void } | undefined;
          if (isGet || isWrite) {
            try {
              const getFieldName = (field: unknown): string => {
                if (!field) return "";
                if (typeof field === "string") return field;
                const fObj = field as Record<string, unknown> & { _parts?: string[]; segments?: string[] };
                if (fObj._parts && Array.isArray(fObj._parts)) return fObj._parts.join(".");
                if (fObj.segments && Array.isArray(fObj.segments)) return fObj.segments.join(".");
                if (typeof field === "object" && field !== null && "toString" in field && typeof (field as { toString: () => unknown }).toString === "function") {
                  const str = (field as { toString: () => unknown }).toString();
                  if (str && str !== "[object Object]") return String(str);
                }
                return String(field);
              };

              const targetMetadata = target as FirestoreObjectMetadata;
              const targetPath = getTargetPath(targetMetadata);
              const collectionName = targetPath ? targetPath.split('/')[0] : "unknown";
              
              const queryParams: Record<string, unknown> = {};
              if (targetMetadata._queryOptions) {
                interface QueryOptionsType {
                  filters?: Array<{ field: unknown; op: string; val: unknown }>;
                  limit?: number;
                  orderBy?: unknown;
                }
                const opts = targetMetadata._queryOptions as QueryOptionsType;
                const filters = opts.filters;
                queryParams.filters = filters?.map((f) => ({
                  field: getFieldName(f.field),
                  op: f.op,
                  val: f.val
                })) || [];
                queryParams.limit = opts.limit;
                if (opts.orderBy) queryParams.orderBy = opts.orderBy;
              } else if (targetMetadata.id) {
                queryParams.id = targetMetadata.id;
              }

              MonitoringService.recordDbQuery(collectionName, queryParams);

              segmentTracker = MonitoringService.startSegment("db_transaction", {
                collection: collectionName,
                operation: prop as string,
                path: targetPath,
                queryParams
              });
            } catch (err) {
              // safe fallback
            }
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            if (segmentTracker) segmentTracker.end({ error: (syncErr as Error).message });
            if (triggerQuotaProtection(syncErr)) {
              const targetObj = target as any;
              if (prop === 'get') {
                const docId = targetObj.id || "mock_doc";
                const docPath = typeof targetObj.path === 'string' ? targetObj.path : undefined;
                if (docPath && docPath.split('/').length % 2 === 0 && docId) {
                  return Promise.resolve(getMockDocSnapshot(docId as string, docPath));
                }
                return Promise.resolve({
                  empty: true,
                  docs: [],
                  size: 0,
                  data: () => ({ count: 0 }),
                  forEach: () => {},
                  docChanges: () => []
                } as unknown as admin.firestore.QuerySnapshot);
              }
              return Promise.resolve({ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } });
            }
            throw syncErr;
          }

          if (result instanceof Promise) {
            let finalPromise = result;
            if (prop === 'get') {
              const targetMetadata = target as FirestoreObjectMetadata;
              const targetPath = getTargetPath(targetMetadata);
              let timeoutMs = 8000; // Increased base timeout to 8s to prevent false trips during connection setup
              if (targetPath && targetPath.startsWith('settings/')) timeoutMs = 8000;
              else if (targetPath && targetPath.startsWith('metadata/')) timeoutMs = 8000;

              finalPromise = withTimeout(
                result,
                timeoutMs,
                "Firestore request timeout - Quota or network exhausted (Trip Circuit Breaker)"
              );
            }
            return finalPromise.then(async (res: unknown) => {
              if (segmentTracker) segmentTracker.end();
              try {
                const targetMetadata = target as FirestoreObjectMetadata;
                const path = getTargetPath(targetMetadata) || "unknown_path";
                const collection = path.split('/')[0] || "unknown_collection";

                let readsCount = 0;
                let sizeResult: number | undefined = undefined;

                if (res && typeof res === 'object') {
                  const docSnap = res as DocumentSnapshot<unknown>;
                  const querySnap = res as QuerySnapshot<unknown>;
                  if (typeof docSnap.exists === 'boolean') {
                    readsCount = 1;
                    sizeResult = docSnap.exists ? 1 : 0;
                    
                    // Opportunity: cache successful document read for future quota protection
                    if (docSnap.exists) {
                       const { getRedis } = await import("../utils/redis.ts");
                       const redis = getRedis();
                       if (redis) {
                         await redis.set(`fs_cache:${path}`, JSON.stringify(docSnap.data()), "EX", 600); // 10 minutes L2 Shield Cache
                       }
                    }
                  } else if (typeof querySnap.size === 'number') {
                    sizeResult = querySnap.size;
                    readsCount = querySnap.size > 0 ? querySnap.size : 1;
                  } else {
                    readsCount = 1;
                  }
                } else if (res === null || res === undefined) {
                  readsCount = 1;
                }

                if (readsCount > 0) {
                  MonitoringService.recordFirestoreAudit(collection, path, readsCount, sizeResult);
                }
              } catch (auditErr) {
                // tihi fallback radi apsolutne sigurnosti pretnje po stabilnost
              }
              return res;
            }).catch((err: Error): any => {
              if (segmentTracker) segmentTracker.end({ error: err.message });
              if (triggerQuotaProtection(err)) {
                const targetObj = target as any;
                if (prop === 'get') {
                  const docId = targetObj.id || "mock_doc";
                  const docPath = typeof targetObj.path === 'string' ? targetObj.path : undefined;
                  if (docPath && docPath.split('/').length % 2 === 0 && docId) {
                    // Try Redis first before falling back to pure mocks
                    return tryResolveFromRedis(docPath).then(cached => cached || getMockDocSnapshot(docId as string, docPath));
                  }
                  return {
                    empty: true,
                    docs: [],
                    size: 0,
                    data: () => ({ count: 0 }),
                    forEach: () => {},
                    docChanges: () => []
                  } as unknown as admin.firestore.QuerySnapshot;
                }
                return { writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } };
              }
              throw err;
            });
          }

          if (segmentTracker) segmentTracker.end();

          if (chainableMethods.includes(prop as string)) {
            return wrapFirestoreObject(result as object);
          }

          return result;
        };
      }
      return value;
    }
  });
}

/**
 * Wraps WriteBatch to intercept commit (writes)
 */
function wrapBatch(batch: admin.firestore.WriteBatch | Record<string, unknown>): admin.firestore.WriteBatch {
  let writeCount = 0;
  
  const b = batch as Record<string, unknown> & { set?: unknown; update?: unknown; delete?: unknown; commit?: unknown };
  // Provide mock methods if they are missing (e.g. when quota is exhausted and we pass in {})
  if (!b.set) b.set = () => batch;
  if (!b.update) b.update = () => batch;
  if (!b.delete) b.delete = () => batch;
  if (!b.commit) b.commit = () => Promise.resolve([{ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } }]);

  return new Proxy(batch as admin.firestore.WriteBatch, {
    get(target, prop: string | symbol) {
      if (prop === '__raw_target') {
        return target;
      }

      const value = Reflect.get(target, prop);
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const unwrappedArgs = args.map(unwrapArg);

          if (checkQuotaStatus()) {
            if (prop === 'commit') {
              return Promise.resolve([{ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } }]);
            }
            return batch as admin.firestore.WriteBatch;
          }

          if (['set', 'update', 'delete'].includes(prop as string)) {
            writeCount++;
            try {
              const docRef = args[0] as any;
              const docPath = docRef?.path;
              if (docPath) {
                import("../utils/redis.ts").then(({ getRedis }) => {
                  const redis = getRedis();
                  if (redis) redis.del(`fs_cache:${docPath}`).catch(() => {});
                }).catch(() => {});
              }
            } catch (err) {}
          }
          if (prop === 'commit') {
            trackFirestoreOp('write', writeCount);
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            if (triggerQuotaProtection(syncErr)) {
              if (prop === 'commit') {
                return Promise.resolve([{ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } }]);
              }
              return batch as admin.firestore.WriteBatch;
            }
            throw syncErr;
          }

          if (result instanceof Promise) {
            return result.catch((err: Error) => {
              if (triggerQuotaProtection(err)) {
                if (prop === 'commit') {
                  return [{ writeTime: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } }];
                }
                return batch as admin.firestore.WriteBatch;
              }
              throw err;
            });
          }

          if (prop === 'set' || prop === 'update' || prop === 'delete') {
            return wrapBatch((result || batch) as admin.firestore.WriteBatch);
          }

          return result;
        };
      }
      return value;
    }
  });
}

/**
 * Wraps Transaction to intercept get/set/update/delete
 */
function wrapTransaction(transaction: admin.firestore.Transaction | Record<string, unknown>): admin.firestore.Transaction {
  const t = transaction as Record<string, unknown> & { get?: unknown; set?: unknown; update?: unknown; delete?: unknown };
  if (!t.get) t.get = (ref: admin.firestore.DocumentReference) => Promise.resolve(getMockDocSnapshot((ref && ref.id) || "mock_doc", ref && ref.path));
  if (!t.set) t.set = () => transaction;
  if (!t.update) t.update = () => transaction;
  if (!t.delete) t.delete = () => transaction;

  return new Proxy(transaction as admin.firestore.Transaction, {
    get(target, prop: string | symbol) {
      if (prop === '__raw_target') {
        return target;
      }

      const value = Reflect.get(target, prop);
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const unwrappedArgs = args.map(unwrapArg);

          if (checkQuotaStatus()) {
            if (prop === 'get') {
              const ref = (((args[0] as admin.firestore.DocumentReference) || {}) as unknown) as Record<string, unknown> & { id?: string; path?: string };
              const docId = (ref.id as string | undefined) || "mock_doc";
              const docPath = typeof ref.path === 'string' ? ref.path : undefined;
              return Promise.resolve(getMockDocSnapshot(docId, docPath));
            }
            return transaction as admin.firestore.Transaction;
          }

          if (prop === 'get') {
            trackFirestoreOp('read');
          } else if (['set', 'update', 'delete'].includes(prop as string)) {
            trackFirestoreOp('write');
            try {
              const docRef = args[0] as any;
              const docPath = docRef?.path;
              if (docPath) {
                import("../utils/redis.ts").then(({ getRedis }) => {
                  const redis = getRedis();
                  if (redis) redis.del(`fs_cache:${docPath}`).catch(() => {});
                }).catch(() => {});
              }
            } catch (err) {}
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            if (triggerQuotaProtection(syncErr)) {
              if (prop === 'get') {
                const ref = ((args[0] as admin.firestore.DocumentReference) || {}) as any;
                return Promise.resolve(getMockDocSnapshot((ref.id as string | undefined) || "mock_doc", ref.path as string | undefined));
              }
              return transaction as admin.firestore.Transaction;
            }
            throw syncErr;
          }

          if (result instanceof Promise) {
            let finalPromise = result;
            if (prop === 'get') {
              const ref = ((args[0] as admin.firestore.DocumentReference) || {}) as any;
              const refPath = typeof ref.path === 'string' ? ref.path : "";
              const timeoutMs = refPath.startsWith('metadata/') ? 5000 : 10000;

              finalPromise = withTimeout(
                result,
                timeoutMs,
                "Firestore transaction request timeout - Quota or network exhausted (Trip Circuit Breaker)"
              );
            }
            return finalPromise.catch((err: Error) => {
              if (triggerQuotaProtection(err)) {
                if (prop === 'get') {
                  const ref = ((args[0] as admin.firestore.DocumentReference) || {}) as any;
                  return getMockDocSnapshot((ref.id as string | undefined) || "mock_doc", ref.path as string | undefined);
                }
                return transaction as admin.firestore.Transaction;
              }
              throw err;
            });
          }

          if (prop === 'set' || prop === 'update' || prop === 'delete') {
            return wrapTransaction((result || transaction) as admin.firestore.Transaction);
          }

          return result;
        };
      }
      return value;
    }
  });
}

let _bucket: ReturnType<typeof admin.storage.prototype.bucket> | null = null;
export function getBucket() {
  ensureInitialized();
  if (!_bucket) {
    _bucket = admin.storage().bucket();
  }
  return _bucket;
}

export const bucket = new Proxy(
  {},
  {
    get(target, prop) {
      const b = getBucket();
      const value = Reflect.get(b, prop);
      return typeof value === "function" ? value.bind(b) : value;
    },
  },
) as ReturnType<typeof admin.storage.prototype.bucket>;

export { admin, firebaseConfig };
