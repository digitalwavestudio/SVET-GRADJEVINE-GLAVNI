import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';

interface SyncIndicatorProps {
  isFetching?: boolean;
  isLoading?: boolean;
  adId?: string;
  category?: string;
}

export function SyncIndicator({ isFetching, isLoading, adId, category }: SyncIndicatorProps) {
  const { data: qData, isFetching: isChecking } = useQuery<{ status?: string; globalSystemStatus?: string } | null>({
    queryKey: ['ad-sync-status', adId || 'anonymous', category || 'all'],
    queryFn: async () => {
      const res = await apiClient.get<unknown>(`/ads/${adId}/sync-status?category=${category}`);
      return (res as { status?: string; globalSystemStatus?: string }) || null;
    },
    enabled: !!adId,
    staleTime: Infinity,    // Smanjeno N+1 opterećenje: keširamo trajno tokom životnog ciklusa komponente
    gcTime: 5 * 60 * 1000,  // Čuvanje u kešu 5 min
  });

  const syncStatus = qData?.status || null;
  const globalStatus = qData?.globalSystemStatus || 'idle';

  // Standard query loading state
  if (isFetching && !isLoading) {
    return (
      <div className="absolute top-0 right-0 -mt-10 mr-4 z-[50]">
        <div className="flex items-center gap-2 bg-secondary/10 border border-secondary/20 px-3 py-1.5 rounded-full backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
          <span className="text-[9px] font-black text-secondary uppercase tracking-widest">
            SINKRONIZACIJA
          </span>
        </div>
      </div>
    );
  }

  // Ad-specific Sync Status
  if (adId && syncStatus) {
    return (
      <div className="flex items-center gap-2 group/sync">
        {syncStatus === 'live' ? (
          <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-wider">
              Live
            </span>
          </div>
        ) : syncStatus === 'indexing' || globalStatus === 'reconciling' ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/20 animate-pulse transition-all duration-500">
            <Loader2 className="w-2.5 h-2.5 text-amber-500 animate-spin" />
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] whitespace-nowrap">
              Ažuriranje pretrage u toku...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-2.5 h-2.5 text-red-500" />
            <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-wider">
              Sync Error
            </span>
          </div>
        )}
        
        {isChecking && syncStatus === 'live' && (
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></div>
        )}
      </div>
    );
  }

  return null;
}
