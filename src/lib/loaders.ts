import type { QueryClient } from '@tanstack/react-query';
import { queryClient as globalQueryClient } from './queryClient';
import { queryKeys } from '@/src/lib/queryKeysFactory';
import { jobsService } from '@/src/modules/jobs/services/jobsService';
import { statsService } from '@/src/services/statsService';
import { mastersService } from '@/src/modules/masters/services/mastersService';
import { companiesService } from '@/src/modules/companies/services/companiesService';

function getQC(context: unknown): QueryClient {
  return (context as { queryClient: QueryClient } | undefined)?.queryClient || globalQueryClient;
}

export const jobLoader = ({ params, request, context }: import('react-router-dom').LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const filters: Record<string, string> = { ...searchParams };

  if (params.zanimanje && params.zanimanje !== 'all') filters.title = params.zanimanje;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  const qc = getQC(context);

  qc.prefetchInfiniteQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: ({ pageParam = null }) => jobsService.fetchJobs(filters, pageParam),
    initialPageParam: null,
  });
  qc.prefetchQuery({
    queryKey: ['stats', 'jobs'],
    queryFn: () => statsService.getCachedStats('jobs'),
    staleTime: 30 * 60 * 1000,
  });
  qc.prefetchQuery({
    queryKey: ['count', 'companies'],
    queryFn: () => statsService.getCachedCount('companies'),
    staleTime: 30 * 60 * 1000,
  });

  return filters;
};

export const masterLoader = ({ params, request, context }: import('react-router-dom').LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.zanimanje && params.zanimanje !== 'all') filters.profession = params.zanimanje;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  getQC(context).prefetchInfiniteQuery({
    queryKey: queryKeys.masters.list(filters),
    queryFn: ({ pageParam = null }) => mastersService.fetchMasters(filters, pageParam),
    initialPageParam: null,
  });

  return filters;
};

export const companiesLoader = ({ params, request, context }: import('react-router-dom').LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  getQC(context).prefetchInfiniteQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: ({ pageParam = null }) => companiesService.fetchFiltered(filters, 24, pageParam),
    initialPageParam: null,
  });

  return filters;
};




