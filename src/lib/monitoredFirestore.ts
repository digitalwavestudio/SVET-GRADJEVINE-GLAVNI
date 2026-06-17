
import { 
  onSnapshot, 
  getDoc, 
  getDocs, 
  setDoc,
  updateDoc,
  DocumentData,
  DocumentReference, 
  Query, 
  DocumentSnapshot, 
  QuerySnapshot,
  SetOptions,
  UpdateData
} from 'firebase/firestore';
 import { firestoreTelemetry } from './firestoreTelemetry';
import { measureFirebaseQuery } from './performance';
import { getTracer } from './tracing';
// import { SpanStatusCode } from '@opentelemetry/api';

const SpanStatusCode = { OK: 0, ERROR: 1 } as { OK: number, ERROR: number };
const tracer = getTracer('firestore-instrumentation');

/**
 * Enterprise Wrapper for getDoc with Telemetry & OTel Spans
 */
export async function monitoredGetDoc<T>(docRef: DocumentReference<T>): Promise<DocumentSnapshot<T>> {
  return tracer.startActiveSpan(`firestore_get_${docRef.parent.id}`, async (span: { setAttributes: (attributes: Record<string, string | number | boolean>) => void, setAttribute: (key: string, value: string | number | boolean) => void, setStatus: (status: { code: number, message?: string }) => void, end: () => void }) => {
    span.setAttributes({
      'db.system': 'firestore',
      'db.operation': 'get',
      'db.collection': docRef.parent.id,
    });
    
    try {
      const start = performance.now();
      return await measureFirebaseQuery(docRef.parent.id, 'get', async () => {
        const snap = await getDoc(docRef);
        const duration = performance.now() - start;
        const fromCache = snap.metadata.fromCache;
        
        span.setAttribute('db.firestore.from_cache', fromCache);
        firestoreTelemetry.recordRead(1, fromCache);
        firestoreTelemetry.recordQueryProfile({
          id: Math.random().toString(36).substr(2, 9),
          collection: docRef.parent.id,
          operation: 'get',
          duration,
          resultSize: 1,
          timestamp: new Date().toISOString()
        });
        
        span.setStatus({ code: SpanStatusCode.OK });
        return snap;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      firestoreTelemetry.recordError('get', docRef.parent.id, errorMessage);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Enterprise Wrapper for getDocs with Telemetry
 */
export async function monitoredGetDocs<T>(q: Query<T>): Promise<QuerySnapshot<T>> {
  const colName = q.type === 'collection' ? (q as any).id : 'any';
  
  return tracer.startActiveSpan(`firestore_list_${colName}`, async (span: { setAttributes: (attributes: Record<string, string | number | boolean>) => void, setAttribute: (key: string, value: string | number | boolean) => void, setStatus: (status: { code: number, message?: string }) => void, end: () => void }) => {
    span.setAttributes({
      'db.system': 'firestore',
      'db.operation': 'list',
      'db.collection': colName,
    });

    try {
      const start = performance.now();
      return await measureFirebaseQuery(colName, 'list', async () => {
        const snap = await getDocs(q);
        const duration = performance.now() - start;
        
        let resolvedColName = colName;
        if (resolvedColName === 'any' && snap.size > 0 && snap.docs[0]?.ref?.parent?.id) {
          resolvedColName = snap.docs[0].ref.parent.id;
          span.setAttribute('db.collection', resolvedColName);
        }
        
        span.setAttribute('db.firestore.result_size', snap.size);
        span.setAttribute('db.firestore.from_cache', snap.metadata.fromCache);
        firestoreTelemetry.recordRead(snap.size, snap.metadata.fromCache);
        
        firestoreTelemetry.recordQueryProfile({
          id: Math.random().toString(36).substr(2, 9),
          collection: resolvedColName,
          operation: 'list',
          duration,
          resultSize: snap.size,
          timestamp: new Date().toISOString()
        });

        span.setStatus({ code: SpanStatusCode.OK });
        return snap;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      firestoreTelemetry.recordError('list', colName, errorMessage);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Enterprise Wrapper for setDoc with Telemetry
 */
export async function monitoredSetDoc<T>(docRef: DocumentReference<T>, data: T, options?: SetOptions): Promise<void> {
  const colName = docRef.parent.id;
  
  return tracer.startActiveSpan(`firestore_set_${colName}`, async (span: { setAttributes: (attributes: Record<string, string | number | boolean>) => void, setStatus: (status: { code: number, message?: string }) => void, end: () => void }) => {
    span.setAttributes({
      'db.system': 'firestore',
      'db.operation': 'set',
      'db.collection': colName,
    });

    try {
      await measureFirebaseQuery(colName, 'set', async () => {
        await (options ? setDoc(docRef, data, options) : setDoc(docRef, data));
        firestoreTelemetry.recordWrite(1);
        span.setStatus({ code: SpanStatusCode.OK });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      firestoreTelemetry.recordError('set', colName, errorMessage);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Enterprise Wrapper for updateDoc with Telemetry
 */
export async function monitoredUpdateDoc<T extends DocumentData = DocumentData>(docRef: DocumentReference<T>, data: UpdateData<T>): Promise<void> {
  const colName = docRef.parent.id;
  
  return tracer.startActiveSpan(`firestore_update_${colName}`, async (span: { setAttributes: (attributes: Record<string, string | number | boolean>) => void, setStatus: (status: { code: number, message?: string }) => void, end: () => void }) => {
    span.setAttributes({
      'db.system': 'firestore',
      'db.operation': 'update',
      'db.collection': colName,
    });

    try {
      await measureFirebaseQuery(colName, 'update', async () => {
        await updateDoc(docRef as DocumentReference<any>, data as UpdateData<any>);
        firestoreTelemetry.recordWrite(1);
        span.setStatus({ code: SpanStatusCode.OK });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
      firestoreTelemetry.recordError('update', colName, errorMessage);
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Global Centralized Realtime Multiplexer Node
 */
interface Subscriber<T> {
  id: string;
  onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void;
  onError?: (error: Error | string) => void;
  name: string;
}

interface ActiveSubscriptionInternal<T = DocumentData> {
  key: string;
  type: 'query' | 'doc';
  target: Query<T> | DocumentReference<T>;
  subscribers: Map<string, Subscriber<T>>;
  unsubscribeFn: (() => void) | null;
  lastSnapshot: QuerySnapshot<T> | DocumentSnapshot<T> | null;
  lastError: Error | string | null;
}

const activeSubscriptions = new Map<string, ActiveSubscriptionInternal<DocumentData>>();
let isTabVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
let suspendTimer: ReturnType<typeof setTimeout> | null = null;

const queryInstanceKeys = new WeakMap<Query<any>, string>();
let queryInstanceCounter = 0;

function getStableQueryId(q: Query<any>): string {
  let key = queryInstanceKeys.get(q);
  if (!key) {
    queryInstanceCounter++;
    key = `query_ref_${queryInstanceCounter}`;
    queryInstanceKeys.set(q, key);
  }
  return key;
}

function getSubscriptionKey(target: Query<DocumentData> | DocumentReference<DocumentData>): string {
  if (!target) return 'null';
  
  if (target.type === 'document') {
    return `doc:${(target as DocumentReference<DocumentData>).path}`;
  }
  
  if (target.type === 'collection') {
    return `query:${(target as any).path}`;
  }

  const stableId = getStableQueryId(target);
  return `query_instance:${stableId}`;
}

function startUnderlyingSubscription(sub: ActiveSubscriptionInternal) {
  if (sub.unsubscribeFn) return;

  const target = sub.target;
  let colName = 'any';
  if (target.type === 'document' && (target as any).parent) {
    colName = (target as DocumentReference<any>).parent.id;
  } else if (target.type === 'collection') {
    colName = (target as any).id;
  }
  
  const name = Array.from(sub.subscribers.values())[0]?.name || 'multiplex';
  
  firestoreTelemetry.incrementListener(name);
  const span = tracer.startSpan(`firestore_multiplex_listener_${name}`);
  span.setAttributes({
    'db.system': 'firestore',
    'db.operation': sub.type === 'doc' ? 'watch_doc' : 'watch',
    'db.collection': colName,
    'app.listener.name': name,
    'app.multiplexer.key': sub.key,
  });

  const onNextWrapper = (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => {
    sub.lastSnapshot = snapshot;
    sub.lastError = null;
    
    const count = sub.type === 'doc' ? 1 : (snapshot as QuerySnapshot<DocumentData>).size || 0;
    const metadata = (snapshot as QuerySnapshot<DocumentData>).metadata;
    
    let resolvedColName = colName;
    if (resolvedColName === 'any' && sub.type !== 'doc') {
      const querySnap = snapshot as QuerySnapshot<DocumentData>;
      if (querySnap.size > 0 && querySnap.docs[0]?.ref?.parent?.id) {
        resolvedColName = querySnap.docs[0].ref.parent.id;
        span.setAttribute('db.collection', resolvedColName);
      }
    }
    
    firestoreTelemetry.recordRead(count, metadata?.fromCache ?? false);
    
    for (const subscriber of sub.subscribers.values()) {
      try {
        subscriber.onNext(snapshot);
      } catch (err) {
        console.error(`[Multiplex] Error in subscriber callback for key ${sub.key}:`, err);
      }
    }
  };

  const onErrorWrapper = (error: Error | string) => {
    sub.lastError = error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: errorMessage });
    firestoreTelemetry.recordError(sub.type === 'doc' ? 'doc_listener' : 'listener', colName, errorMessage);
    
    for (const subscriber of sub.subscribers.values()) {
      if (subscriber.onError) {
        try {
          subscriber.onError(error);
        } catch (err) {
          console.error(`[Multiplex] Error in subscriber error callback for key ${sub.key}:`, err);
        }
      }
    }
  };

  try {
    let unsubscribe: () => void;
    if (sub.type === 'doc') {
      const docRef = sub.target as DocumentReference<DocumentData>;
      unsubscribe = onSnapshot(
        docRef,
        (snap) => onNextWrapper(snap),
        (err) => onErrorWrapper(err)
      );
    } else {
      const queryRef = sub.target as Query<DocumentData>;
      unsubscribe = onSnapshot(
        queryRef,
        (snap) => onNextWrapper(snap),
        (err) => onErrorWrapper(err)
      );
    }
    
    sub.unsubscribeFn = () => {
      span.end();
      firestoreTelemetry.decrementListener(name);
      unsubscribe();
    };
  } catch (err) {
    onErrorWrapper(err as Error);
  }
}

function registerSubscription<T>(
  target: Query<T> | DocumentReference<T>,
  type: 'query' | 'doc',
  onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void,
  onError?: (error: Error | string) => void,
  name: string = 'listener'
): () => void {
  const key = getSubscriptionKey(target as Query<DocumentData> | DocumentReference<DocumentData>);
  const subscriberId = Math.random().toString(36).substring(2, 9);

  let sub = activeSubscriptions.get(key);
  if (!sub) {
    sub = {
      key,
      type,
      target: target as Query<DocumentData> | DocumentReference<DocumentData>,
      subscribers: new Map<string, Subscriber<DocumentData>>(),
      unsubscribeFn: null,
      lastSnapshot: null,
      lastError: null,
    };
    activeSubscriptions.set(key, sub);
    
    if (isTabVisible) {
      startUnderlyingSubscription(sub);
    }
  } else {
    if (sub.lastSnapshot) {
      const snap = sub.lastSnapshot;
      setTimeout(() => {
        if (sub?.subscribers.has(subscriberId)) {
          onNext(snap as QuerySnapshot<T> | DocumentSnapshot<T>);
        }
      }, 0);
    } else if (sub.lastError && onError) {
      const err = sub.lastError;
      setTimeout(() => {
        if (sub?.subscribers.has(subscriberId)) {
          onError(err);
        }
      }, 0);
    }
  }

  sub.subscribers.set(subscriberId, { 
    id: subscriberId, 
    onNext: onNext as (snapshot: QuerySnapshot<DocumentData> | DocumentSnapshot<DocumentData>) => void,
    onError, 
    name 
  });

  return () => {
    const currentSub = activeSubscriptions.get(key);
    if (!currentSub) return;
    
    currentSub.subscribers.delete(subscriberId);
    if (currentSub.subscribers.size === 0) {
      if (currentSub.unsubscribeFn) {
        currentSub.unsubscribeFn();
      }
      activeSubscriptions.delete(key);
    }
  };
}

function suspendAllSubscriptions() {
  for (const sub of activeSubscriptions.values()) {
    if (sub.unsubscribeFn) {
      try {
        sub.unsubscribeFn();
      } catch (err) {
        console.error(`[CentralizedRealtimeManager] Error unsubscribing ${sub.key}:`, err);
      }
      sub.unsubscribeFn = null;
    }
  }
}

function resumeAllSubscriptions() {
  for (const sub of activeSubscriptions.values()) {
    if (!sub.unsubscribeFn && sub.subscribers.size > 0) {
      try {
        startUnderlyingSubscription(sub);
      } catch (err) {
        console.error(`[CentralizedRealtimeManager] Error resuming subscription for ${sub.key}:`, err);
      }
    }
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      isTabVisible = false;
      
      // Cleanup existing timer if any
      if (suspendTimer) clearTimeout(suspendTimer);
      
      if (import.meta.env.DEV) console.log("⏳ [CentralizedRealtimeManager] Tab neaktivan. Priprema za Hard Kill svih Firestore stream-ova (TCP) za 20s...");
      
      suspendTimer = setTimeout(() => {
        if (!isTabVisible) {
          console.warn("💀 [CentralizedRealtimeManager] Tab neaktivan > 20s. IZVRŠAVAM HARD KILL: Fizički gasim sve onSnapshot listenere da bi se prekinuo mrežni saobraćaj.");
          suspendAllSubscriptions();
        }
      }, 20000); // 20 seconds delay as per PROMPT 14
    } else {
      isTabVisible = true;
      if (suspendTimer) {
        clearTimeout(suspendTimer);
        suspendTimer = null;
      }
      
      const streamCount = activeSubscriptions.size;
      if (streamCount > 0) {
        if (import.meta.env.DEV) console.log(`♻️ [CentralizedRealtimeManager] Tab ponovo aktivan. Obnavljam i sinkujem ${streamCount} Firestore konekcija (Hard Reconnect).`);
        resumeAllSubscriptions();
      }
    }
  });
}

/**
 * Enterprise Wrapper for onSnapshot with Lifecycle Telemetry
 */
export function monitoredOnSnapshot<T>(
  q: Query<T>, 
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: Error | string) => void,
  name: string = 'generic_listener'
) {
  return registerSubscription(
    q, 
    'query', 
    onNext as (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void, 
    onError, 
    name
  );
}

/**
 * Document-specific onSnapshot wrapper
 */
export function monitoredOnSnapshotDoc<T>(
  docRef: DocumentReference<T>,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: Error | string) => void,
  name: string = 'doc_listener'
) {
  return registerSubscription(
    docRef, 
    'doc', 
    onNext as (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void, 
    onError, 
    name
  );
}
