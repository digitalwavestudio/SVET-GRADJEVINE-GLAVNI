import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryKeysFactory';

// Maps feature paths to dynamic imports
const prefetchMap: Record<string, () => Promise<any>> = {
  'job': () => import('@/src/modules/jobs'),
  'company': () => import('@/src/modules/companies'),
  'machine': () => import('@/src/modules/machines'),
  'accommodation': () => import('@/src/modules/accommodations'),
  'catering': () => import('@/src/modules/catering'),
  'realestate': () => import('@/src/modules/real_estate'),
  'marketplace': () => import('@/src/modules/marketplace')
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
          case 'machine': {
            const { machinesService } = await import('@/src/modules/machines/services/machinesService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.machines.detail(id),
              queryFn: () => machinesService.getById(id),
              staleTime,
            });
            break;
          }
          case 'accommodation': {
            const { accommodationsService } = await import('@/src/modules/accommodations/services/accommodationsService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.accommodations.detail(id),
              queryFn: () => accommodationsService.getById(id),
              staleTime,
            });
            break;
          }
          case 'catering': {
            const { cateringService } = await import('@/src/modules/catering/services/cateringService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.catering.detail(id),
              queryFn: () => cateringService.getById(id),
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
          case 'marketplace': {
            const { marketplaceService } = await import('@/src/modules/marketplace/services/marketplaceService');
            await queryClient.prefetchQuery({
              queryKey: queryKeys.marketplace.detail(id),
              queryFn: () => marketplaceService.getItemById(id),
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
