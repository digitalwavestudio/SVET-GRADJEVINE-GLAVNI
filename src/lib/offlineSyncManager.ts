import { apiClient } from '@/src/lib/apiClient';
import { queryClient } from '@/src/lib/queryClient';
import { toast } from 'react-hot-toast';

export interface SyncItem {
  id: string;
  type: 'deleteAd' | 'toggleFavorite' | 'clearAllFavorites';
  payload: {
    id?: string;
    type?: string;
    [key: string]: unknown;
  };
  createdAt: number;
}

const OUTBOX_KEY = 'svet_gradevine_offline_outbox';

class OfflineSyncManager {
  private isSyncing = false;
  private onlineHandler: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.onlineHandler = () => { this.flushOutbox(); };
      window.addEventListener('online', this.onlineHandler);
      // Initial check on load
      setTimeout(() => {
        if (navigator.onLine) {
          this.flushOutbox();
        }
      }, 2000);
    }
  }

  public getOutbox(): SyncItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(OUTBOX_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[OfflineSyncManager] Failed to read outbox storage', e);
      return [];
    }
  }

  private saveOutbox(items: SyncItem[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('[OfflineSyncManager] Failed to write outbox storage', e);
    }
  }

  public addToOutbox(type: SyncItem['type'], payload: SyncItem['payload']) {
    const items = this.getOutbox();
    const newItem: SyncItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: Date.now()
    };
    items.push(newItem);
    this.saveOutbox(items);

    toast.success(
      'Sačuvano offline. Akcija je dodata u red i biće izvršena čim se povežete na internet.',
      {
        duration: 4000,
        icon: '⚠️',
        style: {
          background: '#0d121a',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      }
    );
  }

  public async flushOutbox() {
    if (this.isSyncing) return;
    if (!navigator.onLine) return;

    const items = this.getOutbox();
    if (items.length === 0) return;

    this.isSyncing = true;
    const remainingItems: SyncItem[] = [];

    toast.loading('Sinhronizacija offline izmena je u toku...', {
      id: 'offline-sync-loading',
      style: {
        background: '#0d121a',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    });

    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        if (item.type === 'deleteAd') {
          await apiClient.patch(`/ads/${item.payload.id}`, { status: 'deleted' });
        } else if (item.type === 'toggleFavorite') {
          await apiClient.post('/favorites/toggle', { adId: item.payload.id, adType: item.payload.type });
        } else if (item.type === 'clearAllFavorites') {
          await apiClient.post('/favorites/clear-all');
        }
        successCount++;
      } catch (err: unknown) {
        console.error(`[OfflineSyncManager] Failed to sync item ${item.id}`, err);
        // If it's a validation error or status error, discard. Otherwise keep for next retry
        let errStatus: number | null = null;
        if (err && typeof err === 'object') {
          const errObj = err as Record<string, unknown>;
          if (typeof errObj.status === 'number') {
            errStatus = errObj.status;
          }
        }
        if (errStatus !== null && errStatus >= 400 && errStatus < 500) {
          failCount++;
        } else {
          remainingItems.push(item);
        }
      }
    }

    this.saveOutbox(remainingItems);
    this.isSyncing = false;
    toast.dismiss('offline-sync-loading');

    if (successCount > 0) {
      toast.success(`Uspšno sinhronizovano ${successCount} izmena sa serverom!`, {
        duration: 3500,
        style: {
          background: '#0d121a',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      });
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }

    if (failCount > 0) {
      toast.error(`${failCount} izmena nije moglo biti sinhronizovano zbog konflikta podataka.`, {
        duration: 4000,
        style: {
          background: '#0d121a',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      });
    }
  }

  public dispose() {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();
