import { queryClient } from './queryClient';
import { queryKeys } from '@/src/lib/queryKeysFactory';

export const jobLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { jobsService } = await import('@/src/modules/jobs/services/jobsService');
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  const filters: Record<string, string> = { ...searchParams };
  
  if (params.zanimanje && params.zanimanje !== 'all') filters.title = params.zanimanje;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: ({ pageParam = null }) => jobsService.fetchJobs(filters, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const masterLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { mastersService } = await import('@/src/modules/masters/services/mastersService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  
  if (params.zanimanje && params.zanimanje !== 'all') filters.profession = params.zanimanje;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.masters.list(filters),
    queryFn: ({ pageParam = null }) => mastersService.fetchMasters(filters, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const companiesLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { companiesService } = await import('@/src/modules/companies/services/companiesService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: ({ pageParam = null }) => companiesService.fetchFiltered(filters, 24, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const machinesLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { machinesService } = await import('@/src/modules/machines/services/machinesService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  
  if (params.kategorija && params.kategorija !== 'all') filters.category = params.kategorija;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.machines.list(filters),
    queryFn: ({ pageParam = null }) => machinesService.fetchFiltered(filters, 20, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const accommodationsLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { accommodationsService } = await import('@/src/modules/accommodations/services/accommodationsService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.tip && params.tip !== 'all') filters.type = params.tip;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.accommodations.list(filters),
    queryFn: ({ pageParam = null }) => accommodationsService.fetchFiltered(filters, 20, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const cateringLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { cateringService } = await import('@/src/modules/catering/services/cateringService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.catering.list(filters),
    queryFn: ({ pageParam = null }) => cateringService.fetchFiltered(filters, 20, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const realEstateLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { realEstateService } = await import('@/src/modules/real_estate/services/realEstateService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  if (params.namena && params.namena !== 'all') filters.purpose = params.namena;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.realEstate.list(filters),
    queryFn: ({ pageParam = null }) => realEstateService.fetchFiltered(filters, 20, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};

export const marketplaceLoader = async ({ params, request }: import('react-router-dom').LoaderFunctionArgs) => {
  const { marketplaceService } = await import('@/src/modules/marketplace/services/marketplaceService');
  const url = new URL(request.url);
  const filters: Record<string, string> = { ...Object.fromEntries(url.searchParams.entries()) };
  
  if (params.kategorija && params.kategorija !== 'all') filters.category = params.kategorija;
  if (params.grad && params.grad !== 'all') filters.location = params.grad;

  await queryClient.prefetchInfiniteQuery({
    queryKey: queryKeys.marketplace.list(filters),
    queryFn: ({ pageParam = null }) => marketplaceService.getItems(filters, 24, pageParam),
    initialPageParam: null,
  });
  
  return filters;
};
