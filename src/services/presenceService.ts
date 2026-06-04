import { getAuth } from "firebase/auth";
import { apiClient } from '@/src/lib/apiClient';
import { safeSessionStorage } from '@/src/lib/safeStorage';

export interface UserPresenceInfo {
  isOnline: boolean;
  lastSeen?: Date;
}

export const presenceService = {
  /**
   * Updates the user's status via API
   */
  async updatePresence(status: 'online' | 'offline' = 'online'): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      // Throttling: Only update if more than 3 minutes passed
      const lastUpdate = safeSessionStorage.getItem(`presence_last_${user.uid}`);
      const now = Date.now();
      if (lastUpdate && (now - parseInt(lastUpdate)) < 3 * 60 * 1000 && status === 'online') {
        return;
      }

      await apiClient.post('/users/presence', { status });

      safeSessionStorage.setItem(`presence_last_${user.uid}`, now.toString());
    } catch (e) {
      console.warn('[PRESENCE] Update failed:', e);
    }
  },

  async getUserStatus(userId: string): Promise<UserPresenceInfo> {
    try {
      const data = await apiClient.get<{ status: string; lastActive?: string | number | Date | null }>(`/users/${userId}/presence`);
      if (data) {
        return { 
          isOnline: data.status === 'online', 
          lastSeen: data.lastActive ? new Date(data.lastActive) : undefined 
        };
      }
      return { isOnline: false };
    } catch (e) {
      return { isOnline: false };
    }
  },

  _listeners: new Map<string, { count: number; unsubscribe: () => void; lastData: { state: string; lastChanged: Date | undefined } | null }>(),
  _callbacks: new Map<string, Set<(isOnline: boolean, lastSeen?: Date) => void>>(),

  _batchQueue: new Set<string>(),
  _batchTimeout: null as NodeJS.Timeout | null,

  async _flushBatch(): Promise<void> {
    if (this._batchQueue.size === 0) return;
    const userIds = Array.from(this._batchQueue);
    this._batchQueue.clear();

    try {
      const data = await apiClient.post<Record<string, { status: string, lastActive: string | number | Date | null }>>('/users/presence/batch', { userIds });
      
      for (const [userId, presenceData] of Object.entries(data)) {
         const meta = this._listeners.get(userId);
         if (meta) {
           const state = presenceData.status === 'online' ? 'online' : 'offline';
           const lastSeenDate = presenceData.lastActive ? new Date(presenceData.lastActive) : undefined;
           const result = { state, lastChanged: lastSeenDate };
           meta.lastData = result;
           this._callbacks.get(userId)?.forEach(cb => cb(state === 'online', lastSeenDate));
         }
      }
    } catch (e) {
      console.warn('[PRESENCE] Batch update failed:', e);
    }
  },

  subscribeToUserStatus(userId: string, callback: (isOnline: boolean, lastSeen?: Date) => void): () => void {
    if (!userId) return () => {};

    // 1. Initialize callback registry
    if (!this._callbacks.has(userId)) {
      this._callbacks.set(userId, new Set());
    }
    this._callbacks.get(userId)!.add(callback);

    // 2. If we have cached data, emit it immediately
    const existing = this._listeners.get(userId);
    if (existing?.lastData) {
      const data = existing.lastData;
      callback(data.state === 'online', data.lastChanged);
    }

    // 3. Start fetching mechanism (using batch polling to avoid Firestore websockets)
    if (!this._listeners.has(userId)) {
      let isSubscribed = true;

      const fetchStatus = async () => {
         if (!isSubscribed) return;
         this._batchQueue.add(userId);
         if (!this._batchTimeout) {
           this._batchTimeout = setTimeout(() => {
             this._batchTimeout = null;
             this._flushBatch();
           }, 50);
         }
      };

      fetchStatus();
      
      // We do not poll heavily. We poll every two minutes if component stays mounted,
      // avoiding 50 socket connections per page.
      const intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchStatus();
        }
      }, 120000);
      
      const unsubscribe = () => {
        isSubscribed = false;
        clearInterval(intervalId);
      };

      this._listeners.set(userId, { count: 1, unsubscribe, lastData: null });
    } else {
      this._listeners.get(userId)!.count++;
    }

    // 4. Return cleanup
    return () => {
      const meta = this._listeners.get(userId);
      if (meta) {
        meta.count--;
        this._callbacks.get(userId)?.delete(callback);

        if (meta.count <= 0) {
          meta.unsubscribe();
          this._listeners.delete(userId);
          this._callbacks.delete(userId);
        }
      }
    };
  }
};
