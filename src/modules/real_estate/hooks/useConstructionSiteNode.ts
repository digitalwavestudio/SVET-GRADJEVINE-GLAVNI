import { useQuery } from '@tanstack/react-query';
import { User } from '@/src/modules/core/types/user';
import { WorkerStatus, CalendarEvent, ResourceStatus } from '@/src/modules/real_estate/components/construction/types';
import { apiClient } from '@/src/lib/apiClient';

interface SiteData {
  id: string;
  name: string;
  authorId: string;
  createdAt: string;
  status?: string;
}

interface AllDataResponse {
  sites: SiteData[];
  events: CalendarEvent[];
  diaryLogs: Record<number, string>;
  siteWorkers: Record<string, WorkerStatus[]>;
  siteResources: Record<string, ResourceStatus[]>;
  siteMetrics?: Record<string, any[]>;
}

export function useConstructionSite(user: User | null, activeSiteId?: string) {
  return useQuery({
    queryKey: ['construction', 'all-data', user?.id, activeSiteId],
    queryFn: async () => {
      if (!user) return null;
      return apiClient.get<AllDataResponse>(`/construction/all-data`, {
        params: { activeSiteId: activeSiteId || '' }
      } as Record<string, unknown>);
    },
    enabled: !!user?.id,
  });
}
