import { apiClient } from './apiClient';
import { auth } from '../firebase';

export interface TelemetryItem {
  type: 'firestore' | 'performance' | 'error' | 'event' | 'auth';
  timestamp: string;
  [key: string]: any;
}

class ExportService {
  private batch: TelemetryItem[] = [];
  private static instance: ExportService;
  private sessionId: string;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private beforeUnloadHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  private constructor() {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    if (typeof window !== 'undefined') {
      this.beforeUnloadHandler = () => this.flushSync();
      this.visibilityHandler = () => {
        if (document.visibilityState === 'hidden') {
          this.flushSync();
        }
      };
      window.addEventListener('beforeunload', this.beforeUnloadHandler);
      window.addEventListener('visibilitychange', this.visibilityHandler);
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  enqueue(item: Omit<TelemetryItem, 'timestamp'>) {
    const fullItem = {
      ...item,
      timestamp: new Date().toISOString()
    } as TelemetryItem;
    
    this.batch.push(fullItem);
    
    // Auto-flush when 20 logs accumulate to protect network bandwidth & DB load
    if (this.batch.length >= 20) {
      this.flush();
    }
  }

  /**
   * Dedicated method for high-priority error reporting
   */
  public reportError(error: Error | string, context: Record<string, any> = {}) {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    this.enqueue({
      type: 'error',
      message,
      stack,
      ...context,
      url: typeof window !== 'undefined' ? window.location.href : 'any',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'any'
    });

    // Do NOT call this.flush() immediately here to ensure strict batching 
    // and prevent self-inflicted DDoS at extreme scale.
  }

  async flush() {
    if (this.batch.length === 0) return;

    const currentBatch = [...this.batch];
    this.batch = [];

    try {
      const user = auth.currentUser;
      await apiClient.post('/telemetry/export', {
        userId: user?.uid,
        sessionId: this.sessionId,
        batch: currentBatch
      });
    } catch (err) {
      // If export fails, put items back at the start of the batch to retry
      // (limit retry to avoid infinite memory growth)
      if (this.batch.length < 500) {
        this.batch = [...currentBatch, ...this.batch];
      }
      console.warn('[Telemetry] Export failed, items queued for retry', err);
    }
  }

  /**
   * Use beacon API or simple fetch for reliable last-minute export
   */
  private flushSync() {
    if (this.batch.length === 0) return;
    
    const currentBatch = [...this.batch];
    this.batch = [];

    const user = auth.currentUser;
    const payload = JSON.stringify({
      userId: user?.uid,
      sessionId: this.sessionId,
      batch: currentBatch
    });

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Wrap JSON in a Blob with appropriate application/json Content-Type
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/export', blob);
      } else {
        // Fallback to sync fetch (deprecated but occasionally useful for shutdown)
        fetch('/api/telemetry/export', {
            method: 'POST',
            body: payload,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true
        });
      }
    } catch (e) {
      // Restore batch if failed, so next attempts can try
      this.batch = [...currentBatch, ...this.batch].slice(0, 500);
    }
  }

  public dispose() {
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    if (this.visibilityHandler) {
      window.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.flushInterval !== null) {
      clearInterval(this.flushInterval);
    }
  }
}

export const exportService = ExportService.getInstance();
