import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryKeysFactory';

// Maps feature paths to dynamic imports
const prefetchMap: Record<string, () => Promise<any>> = {
  'job': () => import('@/src/modules/jobs'),
  'company': () => import('@/src/modules/companies'),
  'realestate': () => import('@/src/modules/real_estate')
};

/**
  * Smart prefetching system based on user pointers (hover events).
  * Automatically downloads the split code bundles and issues a `prefetchQuery` in the background.
  * Ensures that once the user clicks, the data is already hydrated in memory.
  */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetch = useCallback(async (
    type: any,
    id?: string
  ) => {
    // 1. Prefetch the dynamic Javascript chunk/module synchronously
    const importFn = prefetchMap[type];
    if (importFn) {
      importFn().catch((err) => console.debug('[Prefetch] Module chunk prefetch deferred:', err));
    }

    // 2. Prefetch the query details from Firestore and cache it with 30s staleTime
    if (id) {
      const staleTime = 30 * 1000; // 30 seconds staleTime
      try {
        if (import.meta.env.DEV) console.log(`⚡ [SmartPrefetch] Background prefetching query for group "${type}" (ID: "${id}")`);
        
        switch (type) {
          case 'job': {
            const { jobsService } = await import('@/src/modules/jobs/services/jobsService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.jobs.detail(id),
              queryFn: () => jobsService.fetchJobById(id),
              staleTime,
            });
            break;
          }
          case 'company': {
            const { companiesService } = await import('@/src/modules/companies/services/companiesService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.companies.detail(id),
              queryFn: () => companiesService.getById(id),
              staleTime,
            });
            break;
          }
          case 'realestate': {
            const { realEstateService } = await import('@/src/modules/real_estate/services/realEstateService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.realEstate.detail(id),
              queryFn: () => realEstateService.getById(id),
              staleTime,
            });
            break;
          }

        }
      } catch (err) {
        console.debug(`[SmartPrefetch] Failed prefetching data for ${type}:${id}`, err);
      }
    }
  }, [queryClient]);

  return prefetch;
};
