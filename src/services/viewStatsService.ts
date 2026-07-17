import { apiClient } from '@/src/lib/apiClient';
import { safeLocalStorage, safeSessionStorage } from '@/src/lib/safeStorage';

const VIEW_STORAGE_PREFIX = 'sg_viewed_';
const QUEUE_STORAGE_KEY = 'sg_metrics_queue';
const FLUSH_INTERVAL_MS = 10 * 60 * 1000; // 10 minuta

export interface UserAnalyticsData {
  views: number;
  clicks: number;
  inquiries: number;
  byDay: Record<string, { views: number; clicks: number; inquiries: number }>;
}

export const viewStatsService = {
  queue: [] as { collectionName: string; targetId: string; type: string; authorId?: string; source: string }[],
  isFlushing: false,

  init() {
    if (typeof window === 'undefined') return;
    
    // Učitaj nesačuvane metrike iz storage-a
    try {
      const saved = safeLocalStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch { /* intentionally empty */ }

    setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    
    // Pokušaj flush pre gašenja
    window.addEventListener('beforeunload', () => {
      if (this.queue.length > 0) {
        this.saveQueue();
        const payload = JSON.stringify(this.queue);
        navigator.sendBeacon('/api/metrics/bulk', new Blob([payload], { type: 'application/json' }));
      }
    });

    // Event listener na visibility change (kada ode u background)
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });
  },

  saveQueue() {
    try {
      safeLocalStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch { /* intentionally empty */ }
  },

  async flush() {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;
    
    const elementsToFlush = [...this.queue];
    this.queue = [];
    this.saveQueue();

    try {
      await apiClient.post('/metrics/bulk', { events: elementsToFlush }, { keepalive: true });
    } catch (err) {
      console.warn('[STATS] Batch flush failed, returning to queue', err);
      // Vraćamo u queue samo ako nije prevelik (npr limit 1000)
      if (this.queue.length < 1000) {
        this.queue = [...elementsToFlush, ...this.queue];
        this.saveQueue();
      }
    } finally {
      this.isFlushing = false;
    }
  },

  async incrementThrottled(collectionName: string, docId: string, fieldName: string = 'viewsCount', authorId?: string) {
    if (!docId || !collectionName) return;

    // 2. Dodavanje u buffer (queue)
    const metricTypeMapping: Record<string, string> = {
      'viewsCount': 'view',
      'clicks': 'click',
      'clicksCount': 'click',
      'inquiryCount': 'inquiry',
      'inquiries': 'inquiry'
    };

    const type = metricTypeMapping[fieldName] || 'click';
    
    // Detect Source
    let source = 'direct';
    const params = new URLSearchParams(window.location.search);
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    
    if (params.get('ref') === 'algolia') {
      source = 'internal';
    } else if (referrer && !referrer.includes(window.location.hostname)) {
      source = 'external';
    } else if (referrer && referrer.includes('/pretraga')) {
      source = 'internal';
    }

    this.queue.push({ collectionName, targetId: docId, type, authorId, source });
    this.saveQueue();
  },

  async getUserAnalytics(userId: string, days: number = 30): Promise<UserAnalyticsData | []> {
    try {
      return await apiClient.get<UserAnalyticsData>(`/metrics/user/${userId}?days=${days}`);
    } catch (error) {
      console.error("[STATS] Error fetching user analytics:", error);
      return [];
    }
  },

  async incrementView(collectionName: string, docId: string) {
    return this.incrementThrottled(collectionName, docId, 'viewsCount');
  }
};

// Initialize if in browser
if (typeof window !== 'undefined') {
  viewStatsService.init();
}
