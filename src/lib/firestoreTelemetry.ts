import { trackAction } from './performance';
import { exportService } from './exportService';

interface QueryProfile {
  id: string;
  collection: string;
  operation: string;
  duration: number;
  resultSize: number;
  timestamp: string;
}

interface FirestoreMetrics {
  reads: number;
  writes: number;
  listeners: number;
  activeThreads: string[];
  cacheHits: number;
  serverReads: number;
  errors: number;
  slowQueries: QueryProfile[];
  missingIndexes: string[];
}

class FirestoreTelemetry {
  private metrics: FirestoreMetrics = {
    reads: 0,
    writes: 0,
    listeners: 0,
    activeThreads: [],
    cacheHits: 0,
    serverReads: 0,
    errors: 0,
    slowQueries: [],
    missingIndexes: []
  };

  private static instance: FirestoreTelemetry;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Periodically report aggregated metrics to Firebase Performance
      setInterval(() => this.flush(), 60000); // Every 1 minute
    }
  }

  public static getInstance(): FirestoreTelemetry {
    if (!FirestoreTelemetry.instance) {
      FirestoreTelemetry.instance = new FirestoreTelemetry();
    }
    return FirestoreTelemetry.instance;
  }

  recordRead(count: number = 1, fromCache: boolean = false) {
    this.metrics.reads += count;
    if (fromCache) {
      this.metrics.cacheHits += count;
    } else {
      this.metrics.serverReads += count;
    }
    
    // Detect N+1: If we have many small reads in a short window
    if (count === 1 && Math.random() < 0.1) {
       // Random sampling to avoid overhead
    }
  }

  recordWrite(count: number = 1) {
    this.metrics.writes += count;
  }

  incrementListener(name: string) {
    this.metrics.listeners++;
    this.metrics.activeThreads.push(name);
    trackAction('fs_listener_start', { name });
  }

  decrementListener(name: string) {
    this.metrics.listeners = Math.max(0, this.metrics.listeners - 1);
    this.metrics.activeThreads = this.metrics.activeThreads.filter(t => t !== name);
    trackAction('fs_listener_stop', { name });
  }

  recordError(operation: string, collection: string, error?: unknown) {
    this.metrics.errors++;
    
    let errorMsg = 'any';
    if (error && typeof error === 'object' && 'message' in error) {
      errorMsg = String((error as { message: unknown }).message);
    } else if (error) {
      errorMsg = String(error);
    }
    
    trackAction('fs_error', { operation, collection, error: errorMsg });
    
    // Remote Telemetry
    exportService.reportError(
      (error instanceof Error || typeof error === 'string') ? error : `Firestore ${operation} failed on ${collection}`,
      {
        type: 'firestore_error',
        operation,
        collection,
        severity: 'medium'
      }
    );
    
    // Detect missing index error
    if (errorMsg.includes('requires an index')) {
      const indexLink = errorMsg.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
      if (indexLink && !this.metrics.missingIndexes.includes(indexLink)) {
        this.metrics.missingIndexes.push(indexLink);
        trackAction('fs_missing_index', { collection, link: indexLink });
      }
    }
  }

  recordQueryProfile(profile: QueryProfile) {
    if (profile.duration > 500) { // Slow query threshold 500ms
      this.metrics.slowQueries.push(profile);
      // Keep only last 50 slow queries
      if (this.metrics.slowQueries.length > 50) this.metrics.slowQueries.shift();
      
      trackAction('fs_slow_query', {
        collection: profile.collection,
        operation: profile.operation,
        duration: profile.duration.toFixed(0),
        size: profile.resultSize.toString()
      });
    }

    // Export query details to BigQuery via exportService
    exportService.enqueue({
      type: 'performance',
      name: `fs_query_${profile.collection}_${profile.operation}`,
      duration: profile.duration,
      metadata: {
        collection: profile.collection,
        size: profile.resultSize,
        isSlow: profile.duration > 500
      }
    });
  }

  getSnapshot() {
    return { ...this.metrics };
  }

  private flush() {
    if (this.metrics.reads > 0 || this.metrics.writes > 0) {
      const isAbusive = this.metrics.reads > 100; // Sample threshold

      // Firebase Performance Trace
      trackAction('fs_metrics_flush', {
        reads: this.metrics.reads.toString(),
        writes: this.metrics.writes.toString(),
        listeners: this.metrics.listeners.toString(),
        cacheHitRate: (this.metrics.reads > 0 ? (this.metrics.cacheHits / this.metrics.reads).toFixed(2) : '0')
      });

      // BigQuery Export
      exportService.enqueue({
        type: 'firestore',
        reads: this.metrics.reads,
        writes: this.metrics.writes,
        listeners: this.metrics.listeners,
        cacheHit: this.metrics.cacheHits > 0,
        isAbusive
      });
      
      // Reset after flush for the next interval
      this.metrics.reads = 0;
      this.metrics.writes = 0;
      this.metrics.cacheHits = 0;
      this.metrics.serverReads = 0;
      this.metrics.errors = 0;
    }
  }
}

export const firestoreTelemetry = FirestoreTelemetry.getInstance();
