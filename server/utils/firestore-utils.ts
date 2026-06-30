import { getDb, getBucket } from "../config/firebase-init.ts";
import type admin from "firebase-admin";
import type { QuerySnapshot, DocumentSnapshot } from "firebase-admin/firestore";
import { trackFirestoreOp } from "../middleware/logging.middleware.ts";

export interface FirestoreQuotaError extends Error {
  code?: number;
  details?: string;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, errMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const timeoutErr = new Error(errMessage) as FirestoreQuotaError;
      timeoutErr.code = 8;
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
    ).catch(err => console.error("[Firebase] withTimeout promise catch:", err));
  });
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
  }
  return null;
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

          let result: unknown;
          try {
            if (prop === 'runTransaction') {
              const originalUpdate = args[0] as (transaction: admin.firestore.Transaction) => Promise<unknown>;
              const wrappedArgs = [...unwrappedArgs];
              wrappedArgs[0] = async (transaction: admin.firestore.Transaction) => {
                return await originalUpdate(wrapTransaction(transaction));
              };
              result = firestoreDb.runTransaction(wrappedArgs[0] as (transaction: admin.firestore.Transaction) => Promise<unknown>);
            } else {
              result = value.apply(firestoreDb, unwrappedArgs);
            }
          } catch (syncErr) {
            throw syncErr;
          }

          if (result instanceof Promise) {
            return result;
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

      const value = Reflect.get(target, prop);
      if (typeof value === 'function') {
        return (...args: unknown[]) => {
          const unwrappedArgs = args.map(unwrapArg);

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

              try {
                const resultPromise = value.apply(target, unwrappedArgs) as Promise<unknown>;
                let timeoutMs = 30000;
                if (targetPath.startsWith('settings/')) timeoutMs = 15000;
                else if (targetPath.startsWith('metadata/')) timeoutMs = 15000;

                const finalPromise = withTimeout(
                  resultPromise,
                  timeoutMs,
                  "Firestore request timeout - Quota or network exhausted (Trip Circuit Breaker)"
                );

                const res = await finalPromise;

                try {
                  if (res && (res as any).exists) {
                    const docSnap = res as DocumentSnapshot<unknown>;
                    const { getRedis } = await import("../utils/redis.ts");
                    const redis = getRedis();
                    if (redis) {
                      await redis.set(`fs_cache:${targetPath}`, JSON.stringify(docSnap.data()), "EX", 600);
                    }
                  }
                } catch { }

                return res;
              } catch (err: any) {
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
                if (redis) redis.del(`fs_cache:${targetPath}`).catch(err => console.error("[Firebase] redis.del fs_cache failed:", err));
              }).catch(err => console.error("[Firebase] import redis for cache cleanup failed:", err));
            }
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            throw syncErr;
          }

          if (result instanceof Promise) {
            let finalPromise = result;
            if (prop === 'get') {
              const targetMetadata = target as FirestoreObjectMetadata;
              const targetPath = getTargetPath(targetMetadata);
              let timeoutMs = 30000;
              if (targetPath && targetPath.startsWith('settings/')) timeoutMs = 15000;
              else if (targetPath && targetPath.startsWith('metadata/')) timeoutMs = 15000;

              finalPromise = withTimeout(
                result,
                timeoutMs,
                "Firestore request timeout - Quota or network exhausted (Trip Circuit Breaker)"
              );
            }
            return finalPromise;
          }

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

function wrapBatch(batch: admin.firestore.WriteBatch | Record<string, unknown>): admin.firestore.WriteBatch {
  let writeCount = 0;

  const b = batch as Record<string, unknown> & { set?: unknown; update?: unknown; delete?: unknown; commit?: unknown };
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

          if (['set', 'update', 'delete'].includes(prop as string)) {
            writeCount++;
            try {
              const docRef = args[0] as any;
              const docPath = docRef?.path;
              if (docPath) {
                import("../utils/redis.ts").then(({ getRedis }) => {
                  const redis = getRedis();
                  if (redis) redis.del(`fs_cache:${docPath}`).catch(err => console.error("[Firebase] redis.del fs_cache in batch failed:", err));
                }).catch(err => console.error("[Firebase] import redis in batch failed:", err));
              }
            } catch (err) { console.error("[Firestore] Batch commit error:", err); }
          }
          if (prop === 'commit') {
            trackFirestoreOp('write', writeCount);
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            throw syncErr;
          }

          if (result instanceof Promise) {
            return result;
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

function wrapTransaction(transaction: admin.firestore.Transaction | Record<string, unknown>): admin.firestore.Transaction {
  const t = transaction as Record<string, unknown> & { get?: unknown; set?: unknown; update?: unknown; delete?: unknown };
  if (!t.get) t.get = (ref: admin.firestore.DocumentReference) => Promise.resolve({ id: (ref && ref.id) || "mock_doc", exists: false, data: () => undefined } as any);
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
                  if (redis) redis.del(`fs_cache:${docPath}`).catch(err => console.error("[Firebase] redis.del fs_cache in tx failed:", err));
                }).catch(err => console.error("[Firebase] import redis in tx failed:", err));
              }
            } catch (err) { console.error("[Firestore] Transaction get error:", err); }
          }

          let result: unknown;
          try {
            result = value.apply(target, unwrappedArgs);
          } catch (syncErr: unknown) {
            throw syncErr;
          }

          if (result instanceof Promise) {
            let finalPromise = result;
            if (prop === 'get') {
              const ref = ((args[0] as admin.firestore.DocumentReference) || {}) as any;
              const refPath = typeof ref.path === 'string' ? ref.path : "";
              const timeoutMs = refPath.startsWith('metadata/') ? 15000 : 30000;

              finalPromise = withTimeout(
                result,
                timeoutMs,
                "Firestore transaction request timeout - Quota or network exhausted (Trip Circuit Breaker)"
              );
            }
            return finalPromise;
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
