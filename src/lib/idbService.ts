import { openDB } from 'idb';

const DB_NAME = 'sg_pwa_dashboard_db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('dashboard_cache')) {
        db.createObjectStore('dashboard_cache', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' });
      }
    },
  });
};

export const saveDashboardCache = async (userId: string, data: unknown) => {
  try {
    const db = await initDB();
    await db.put('dashboard_cache', { userId, data, ts: Date.now() });
  } catch (e) {
    console.error('IDB save error', e);
  }
};

export const getDashboardCache = async (userId: string, ttlMs = 300000) => {
  try {
    const db = await initDB();
    const cached = await db.get('dashboard_cache', userId);
    if (!cached) return null;
    if (Date.now() - cached.ts > ttlMs) {
      return { data: cached.data, isStale: true };
    }
    return { data: cached.data, isStale: false };
  } catch (e) {
    console.error('IDB load error', e);
    return null;
  }
};

export const clearDashboardCache = async (userId?: string) => {
  try {
    const db = await initDB();
    if (userId) {
      await db.delete('dashboard_cache', userId);
    } else {
      await db.clear('dashboard_cache');
    }
  } catch (e) {
    console.error('IDB clear error', e);
  }
};
