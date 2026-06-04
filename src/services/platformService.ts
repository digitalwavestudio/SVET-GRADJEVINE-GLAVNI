import { apiClient } from '@/src/lib/apiClient';

let cachedLaunchMode: boolean | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export interface PlatformSettingsResponse {
  launchMode?: boolean;
}

export const isLaunchModeActive = async (): Promise<boolean> => {
  const now = Date.now();
  if (cachedLaunchMode !== null && (now - lastFetch < CACHE_DURATION)) {
    return cachedLaunchMode;
  }

  try {
    const data = await apiClient.get<PlatformSettingsResponse>('/settings/platform');
    if (data) {
        cachedLaunchMode = data.launchMode ?? true;
        lastFetch = now;
        return cachedLaunchMode;
    }
    return true; // Default to true if not found
  } catch (error) {
    console.error("Failed to fetch platform settings", error);
    return true;
  }
};
