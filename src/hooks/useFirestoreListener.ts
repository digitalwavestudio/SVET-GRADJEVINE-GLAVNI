import { useState, useEffect, useRef } from 'react';
import { Query, DocumentReference, QuerySnapshot, DocumentSnapshot, queryEqual } from 'firebase/firestore';
import { monitoredOnSnapshot, monitoredOnSnapshotDoc } from '../lib/monitoredFirestore';

/**
 * Svet Građevine - Centralized Firebase Listener Manager
 * Deduplicates snapshot listeners, guards against memory leaks, and handles React hydration gracefully.
 */

interface ActiveSubscription {
  unsubscribe: () => void;
  listeners: Set<(snapshot: QuerySnapshot<any> | DocumentSnapshot<any>) => void>;
  errorListeners: Set<(err: Error | any) => void>;
  lastSnapshot: QuerySnapshot<any> | DocumentSnapshot<any> | null;
  type: 'query' | 'document';
  target: Query<any> | DocumentReference<any>;
}

// Global registry of all active listeners to perform caching, deduplication, and overload warnings
class FirestoreListenerManager {
  private static instance: FirestoreListenerManager;
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  private queryRegistry: Array<{ target: Query<any> | DocumentReference<any>; key: string }> = [];
  private queryRegistryCounter = 0;
  private activeCount: number = 0;
  private lastDisconnectTime: number = 0;
  private readonly CONNECTION_DEBOUNCE_MS = 5000;

  private constructor() {}

  public static getInstance(): FirestoreListenerManager {
    if (!FirestoreListenerManager.instance) {
      FirestoreListenerManager.instance = new FirestoreListenerManager();
    }
    return FirestoreListenerManager.instance;
  }

  /**
   * Generates a unique key for a Firestore Query or DocumentReference
   */
  public getRegistryKey(target: Query<any> | DocumentReference<any>, customKey?: string): string {
    if (customKey) return customKey;
    
    if (target.type === 'document' || ('path' in target && typeof (target as any).path === 'string')) {
      return `doc:${(target as any).path}`;
    }
    
    if (target.type === 'collection') {
      return `query:${(target as any).path}`;
    }
    
    // Iterate through registry to find identical query using queryEqual
    for (const entry of this.queryRegistry) {
      if (entry.target.type !== 'document') {
        if (queryEqual(target as any, entry.target as any)) return entry.key;
      }
    }

    // New unique query
    this.queryRegistryCounter++;
    const newKey = `query:inst_${this.queryRegistryCounter}`;
    this.queryRegistry.push({ target, key: newKey });
    return newKey;
  }

  /**
   * Registers interest in a Firestore target listener.
   */
  public subscribe<T>(
    target: Query<T> | DocumentReference<T>,
    onNext: (snapshot: QuerySnapshot<T> | DocumentSnapshot<T>) => void,
    onError: (err: Error | any) => void,
    options: { key?: string; name?: string } = {}
  ): () => void {
    const key = this.getRegistryKey(target, options.key);
    const listenerName = options.name || ( 'path' in target ? `doc_${(target as any).path}` : `query_${key}` );

    const sub = this.subscriptions.get(key);

    if (!sub) {
      // Create new connection if none exists
      const listeners = new Set<(snapshot: QuerySnapshot<any> | DocumentSnapshot<any>) => void>();
      const errorListeners = new Set<(err: Error | any) => void>();
      
      listeners.add(onNext as any);
      errorListeners.add(onError);

      const subObj: ActiveSubscription = {
        unsubscribe: () => {}, // placeholder overridden right after creation
        listeners,
        errorListeners,
        lastSnapshot: null,
        type: 'path' in target ? 'document' : 'query',
        target
      };

      // Set subscription BEFORE executing the dynamic snapshot triggers to handle synchronous callbacks
      this.subscriptions.set(key, subObj);
      this.activeCount++;

      let unsubscribeFn: () => void = () => {};
      let isSubscribing = true;
      let connectionTimeout: any = null;

      const performSubscribe = () => {
        if (!isSubscribing) return;
        
        if ('path' in target) {
          unsubscribeFn = monitoredOnSnapshotDoc(
            target as DocumentReference<T>,
            (snap) => {
              subObj.lastSnapshot = snap;
              subObj.listeners.forEach((cb) => cb(snap));
            },
            (err) => {
              subObj.errorListeners.forEach((cb) => cb(err));
            },
            listenerName
          );
        } else {
          unsubscribeFn = monitoredOnSnapshot(
            target as Query<T>,
            (snap) => {
              subObj.lastSnapshot = snap;
              subObj.listeners.forEach((cb) => cb(snap));
            },
            (err) => {
              subObj.errorListeners.forEach((cb) => cb(err));
            },
            listenerName
          );
        }
        subObj.unsubscribe = unsubscribeFn;
      };

      // IMPLEMENTATION: 5s Safe-Delay for Reconnections
      const timeSinceLastDisconnect = Date.now() - this.lastDisconnectTime;
      if (timeSinceLastDisconnect < this.CONNECTION_DEBOUNCE_MS) {
        const delay = this.CONNECTION_DEBOUNCE_MS - timeSinceLastDisconnect;
        if (import.meta.env.DEV) console.log(`⏳ [FirestoreListenerManager] Safe-Delay: Odlaganje konekcije za ${listenerName} za ${delay}ms...`);
        connectionTimeout = setTimeout(performSubscribe, delay);
      } else {
        performSubscribe();
      }

      subObj.unsubscribe = () => {
        isSubscribing = false;
        if (connectionTimeout) clearTimeout(connectionTimeout);
        unsubscribeFn();
      };

      // Enterprise Quota overload warning (> 5 concurrently open streams)
      if (this.activeCount > 5) {
        console.warn(
          `⚠️ [FirestoreListenerManager] KRITIČNO: Detektovano je ${this.activeCount} aktivnih real-time konekcija! ` +
          `Ovo prelazi preporučeni limit od 5 istovremenih konekcija na klijentu. ` +
          `Razmislite o zameni nekih snapshot-a sa smart pollingom (TanStack Query) kako biste izbegli Firebase Quota limits.`
        );
      }
    } else {
      // Sub is already initialized, reuse connection
      sub.listeners.add(onNext);
      sub.errorListeners.add(onError);

      // Instantly deliver the last memoized snapshot to bypass loading states/flickering
      if (sub.lastSnapshot) {
        onNext(sub.lastSnapshot);
      }
    }

    // Return the specific unsubscribe to remove this consumer
    return () => {
      const activeSub = this.subscriptions.get(key);
      if (!activeSub) return;

      activeSub.listeners.delete(onNext);
      activeSub.errorListeners.delete(onError);

      // If no listeners left, fully disconnect the Firestore stream
      if (activeSub.listeners.size === 0) {
        activeSub.unsubscribe();
        this.subscriptions.delete(key);
        this.activeCount = Math.max(0, this.activeCount - 1);
        this.lastDisconnectTime = Date.now();
        
        // Remove from queryRegistry
        this.queryRegistry = this.queryRegistry.filter(entry => entry.key !== key);
        
        if (import.meta.env.DEV) console.log(`🔌 [FirestoreListenerManager] Uspšno uništena neiskorišćena konekcija za ključ: ${key}. Preostalo aktivnih: ${this.activeCount}`);
      }
    };
  }

  public getActiveCount(): number {
    return this.activeCount;
  }
}

export const listenerManager = FirestoreListenerManager.getInstance();

export interface UseFirestoreListenerOptions {
  key?: string;
  name?: string;
}

/**
 * Custom React Hook that securely connects to Firestore with auto-deduplication,
 * hydration-mismatch protection, and strict component unmount state safety.
 */
export function useFirestoreListener<T>(
  target: Query<T> | DocumentReference<T> | null,
  options: UseFirestoreListenerOptions = {}
) {
  const [data, setData] = useState<QuerySnapshot<T> | DocumentSnapshot<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | any | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Preserve references using refs so callback state mutation doesn't trigger effect re-run loops
  const onNextRef = useRef<(snap: QuerySnapshot<T> | DocumentSnapshot<T>) => void>(() => {});
  const onErrorRef = useRef<(err: Error | any) => void>(() => {});
  const targetRef = useRef<Query<T> | DocumentReference<T> | null>(target);

  // Update target reference on every render so effect always uses current instance without triggering re-runs
  targetRef.current = target;

  onNextRef.current = (snap: any) => {
    setData(snap);
    setLoading(false);
  };

  onErrorRef.current = (err: any) => {
    setError(err);
    setLoading(false);
  };

  const [isTabVisible, setIsTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );

  // Compute a stable lookup key for the target. Changes only when query properties or paths physically change.
  const registryKey = target ? listenerManager.getRegistryKey(target, options.key) : "";

  // 1. Safe Client Execution (Guards Hydration Mismatch)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1.1 Document Visibility listener
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 2. Main Subscription Lifecycle
  useEffect(() => {
    const currentTarget = targetRef.current;
    if (!isMounted || !currentTarget || !registryKey || !isTabVisible) return;

    const callbackNext = (snap: any) => onNextRef.current(snap);
    const callbackError = (err: any) => onErrorRef.current(err);

    const unsubscribe = listenerManager.subscribe(
      currentTarget,
      callbackNext,
      callbackError,
      { ...options, key: registryKey }
    );

    // Strict Unmount Cleanup to avoid memory leaks
    return () => {
      unsubscribe();
    };
  }, [isMounted, registryKey, options.name, isTabVisible]);

  return { data, loading, error, activeConnections: listenerManager.getActiveCount() };
}
