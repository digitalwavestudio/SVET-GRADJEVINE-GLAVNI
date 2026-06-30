import { ApiClient } from '@svet-gradjevine/api';
import { getLazyAuth } from './firebase';
import { safeLocalStorage } from './safeStorage';

const getDeviceId = () => {
    let deviceId = safeLocalStorage.getItem('sg_device_id');
    if (!deviceId) {
        deviceId = crypto.randomUUID ? crypto.randomUUID() : 'dev-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        safeLocalStorage.setItem('sg_device_id', deviceId);
    }
    return deviceId;
};

const baseClient = new ApiClient({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  getToken: async () => {
    const authInst = await getLazyAuth();
    if (authInst) {
      if (authInst.authStateReady) {
        await authInst.authStateReady();
      }
      if (authInst.currentUser) {
        return await authInst.currentUser.getIdToken();
      }
    }
    return null;
  },
  getHeaders: async () => {
    return {
      'x-device-id': getDeviceId()
    };
  }
});

export const activeRequests = new Set<AbortController>();

export const apiClient = baseClient;
