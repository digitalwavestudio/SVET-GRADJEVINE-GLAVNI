import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/src/lib/apiClient';

export function useAdminSettings(isAdmin: boolean) {
  const [launchMode, setLaunchMode] = useState(true);
  const [isUpdatingLaunchMode, setIsUpdatingLaunchMode] = useState(false);
  const isMountedFn = useRef(true);

  useEffect(() => {
    isMountedFn.current = true;
    return () => {
      isMountedFn.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchSettings = async () => {
      try {
        const data = await apiClient.get<any>('/admin/settings/platform');
        if (data && isMountedFn.current) {
          setLaunchMode(data?.launchMode ?? true);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [isAdmin]);

  const toggleLaunchMode = async () => {
    if (isUpdatingLaunchMode) return;
    if (isMountedFn.current) setIsUpdatingLaunchMode(true);
    const newVal = !launchMode;
    try {
      await apiClient.patch('/admin/settings/platform', { updates: { launchMode: newVal } });
      if (isMountedFn.current) setLaunchMode(newVal);
      alert("Status registracija uspešno promenjen!");
    } catch (error: any) {
      console.error("Error setting launch mode:", error);
      alert("Greška: " + error.message);
    } finally {
      if (isMountedFn.current) setIsUpdatingLaunchMode(false);
    }
  };

  return {
    launchMode,
    isUpdatingLaunchMode,
    toggleLaunchMode
  };
}
