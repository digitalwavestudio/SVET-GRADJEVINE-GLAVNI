import { create } from 'zustand';

interface AdminStore {
  activeTab: 'overview' | 'moderation' | 'users' | 'verify' | 'finances' | 'support' | 'abuse' | 'marketing' | 'broadcast' | 'branding' | 'sync' | 'audit' | 'settings' | 'observability' | 'housekeeping' | 'resilience' | 'magazine';
  setActiveTab: (tab: AdminStore['activeTab']) => void;
  // Local UI filters for tabs
  usersSearchQuery: string;
  setUsersSearchQuery: (query: string) => void;
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  activeTab: 'overview',
  setActiveTab: (tab) => {
    // Memory leak protection: Prevent timeouts/intervals from leaking between heavy tabs
    // Note: We use setTimeout to queue the cleanup after current callstack
    if (get().activeTab !== tab && typeof window !== 'undefined') {
      const highestId = window.setTimeout(() => {});
      for (let i = 0; i < highestId; i++) {
        window.clearTimeout(i);
        window.clearInterval(i);
      }
    }
    set({ activeTab: tab });
  },
  
  usersSearchQuery: '',
  setUsersSearchQuery: (query) => set({ usersSearchQuery: query }),
}));
