import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { jobsService, JobsListResponse } from "@/src/modules/jobs/services/jobsService";
import { JobResponse, JobApplication } from "@/src/modules/jobs/types/models";
import { queryKeys } from "@/src/lib/queryKeysFactory";

interface InitialStatePayload {
  searchResult?: {
    docs?: unknown[];
    items?: unknown[];
    lastVisibleId?: string | null;
    lastVisible?: string | null;
    hasMore?: boolean;
    totalHits?: number;
  };
}

interface CustomWindow extends Window {
  INITIAL_STATE?: InitialStatePayload | null;
}

export function useJobs(filters: Record<string, unknown>, options?: Record<string, unknown>) {
  return useInfiniteQuery<JobsListResponse>({
    queryKey: queryKeys.jobs.list(filters),
    queryFn: async ({ pageParam = null }) => {
      // Consume INITIAL_STATE if it exists and this is the first page of the exact hub
      const customWindow = typeof window !== "undefined" ? (window as unknown as CustomWindow) : undefined;
      if (
        !pageParam &&
        customWindow &&
        customWindow.INITIAL_STATE?.searchResult
      ) {
        const state = customWindow.INITIAL_STATE.searchResult;
        // Verify it looks like jobs payload
        if (state && (Array.isArray(state.docs) || Array.isArray(state.items))) {
          if (import.meta.env.DEV) console.log("[useJobs] Using hydrated INITIAL_STATE");
          const payload: JobsListResponse = {
            items: (state.docs || state.items || []) as JobResponse[],
            lastVisible: null,
            hasMore: false,
          };
          // Clear it so we don't reuse it for different calls later
          customWindow.INITIAL_STATE = null;
          return payload;
        }
      }
      return jobsService.fetchJobs(filters, pageParam as string | null) as Promise<JobsListResponse>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: () => undefined,
    staleTime: 5 * 60 * 1000, // 5 min
    ...options,
  });
}

export function usePremiumJobs(
  filters?: Record<string, unknown>,
  limit: number = 6,
  options?: Record<string, unknown>,
) {
  return useInfiniteQuery<JobsListResponse>({
    queryKey: [...queryKeys.jobs.premium(), filters, limit],
    queryFn: async ({ pageParam = null }) =>
      jobsService.fetchJobs(
        { ...filters, isPremium: true, status: "active" },
        pageParam as string | null,
        limit,
      ) as Promise<JobsListResponse>,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: JobsListResponse) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) as boolean,
  });
}

export function useUrgentJobs(
  filters?: Record<string, unknown>,
  limit: number = 6,
  options?: Record<string, unknown>,
) {
  return useInfiniteQuery<JobsListResponse>({
    queryKey: [...queryKeys.jobs.urgent(), filters, limit],
    queryFn: async ({ pageParam = null }) =>
      jobsService.fetchJobs(
        { ...filters, isUrgent: true, status: "active" },
        pageParam as string | null,
        limit,
      ) as Promise<JobsListResponse>,
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: JobsListResponse) =>
      lastPage?.hasMore ? lastPage.lastVisible : undefined,
    staleTime: 5 * 60 * 1000,
    enabled: (options?.enabled ?? true) as boolean,
  });
}

export function useJobDetails(id: string) {
  return useQuery<JobResponse, Error>({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: async () => jobsService.fetchJobById(id) as Promise<JobResponse>,
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 10 min
  });
}

export function useJobsDetails(ids: string[]) {
  return useQuery<JobResponse[], Error>({
    queryKey: [...queryKeys.jobs.details(), ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const jobs = await jobsService.fetchJobsBatch(ids);
      return jobs.filter((j): j is JobResponse => !!j);
    },
    enabled: ids.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserApplications(
  userId?: string,
  role?: "applicant" | "employer" | "both",
  searchQuery?: string,
) {
  const LIMIT = 15;
  const actualRole = role || "both";

  const result = useInfiniteQuery<{
    applications: JobApplication[];
    lastVisibleId: string | null;
    hasMore: boolean;
  }, Error>({
    queryKey: [
      ...queryKeys.jobs.userApplications(userId || "", role || ""),
      searchQuery || "",
    ],
    queryFn: async ({
      pageParam = null,
    }): Promise<{
      applications: JobApplication[];
      lastVisibleId: string | null;
      hasMore: boolean;
    }> => {
      if (!userId)
        return { applications: [], lastVisibleId: null, hasMore: false };

      const cursor = pageParam as string | null;

      if (actualRole === "applicant" || actualRole === "employer") {
        const res = await jobsService.fetchUserApplications(
          userId,
          actualRole,
          cursor || undefined,
          LIMIT,
          searchQuery,
        );
        return {
          applications: res.applications || [],
          lastVisibleId: res.lastVisibleId || null,
          hasMore: res.hasMore || false,
        };
      } else {
        const [appRes, empRes] = await Promise.all([
          jobsService.fetchUserApplications(
            userId,
            "applicant",
            cursor || undefined,
            LIMIT,
            searchQuery,
          ),
          jobsService.fetchUserApplications(
            userId,
            "employer",
            cursor || undefined,
            LIMIT,
            searchQuery,
          ),
        ]);
        const combined = [
          ...(appRes.applications || []),
          ...(empRes.applications || []),
        ];
        const hasMore = appRes.hasMore || empRes.hasMore;
        const nextC = empRes.lastVisibleId || appRes.lastVisibleId || null;
        return {
          applications: combined,
          lastVisibleId: nextC,
          hasMore,
        };
      }
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.lastVisibleId : undefined,
    enabled: !!userId,
  });

  const applications = result.data
    ? result.data.pages.flatMap((page) => page?.applications || [])
    : [];

  return {
    data: applications,
    isLoading: result.isLoading,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    refetch: result.refetch,
  };
}

export function useCheckApplied(jobId: string, userId: string) {
  return useQuery<boolean, Error>({
    queryKey: queryKeys.jobs.applied(jobId, userId),
    queryFn: async () => {
      if (!jobId || !userId) return false;
      return jobsService.checkIfAlreadyApplied(jobId, userId);
    },
    enabled: !!jobId && !!userId,
    staleTime: 5 * 60 * 1000, // 1 hour
  });
}

export function useSimilarJobs(
  jobId: string,
  _locationSlug?: string,
  _professionSlug?: string,
) {
  const filters: Record<string, unknown> = { status: 'active' };

  return useQuery<JobResponse[], Error>({
    queryKey: queryKeys.jobs.similar(jobId),
    queryFn: async () => {
      const response = await jobsService.fetchJobs(filters, null, 15);
      return (response.items || []).filter(j => j.id !== jobId).slice(0, 10);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface ApplyToJobVariables {
  jobId: string;
  applicantId: string;
  jobTitle?: string;
  employerId?: string;
  applicantName?: string;
  applicantEmail?: string;
  coverLetter?: string;
  applicantPhone?: string;
}

export function useJobMutations() {
  const queryClient = useQueryClient();

  const updateJob = useMutation<void, Error, { id: string; updates: Partial<JobResponse> }, { previousJob: JobResponse | undefined }>({
    mutationFn: ({ id, updates }) =>
      jobsService.updateJob(id, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.jobs.detail(id) });

      // Snapshot the previous value
      const previousJob = queryClient.getQueryData<JobResponse>(queryKeys.jobs.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData<JobResponse>(queryKeys.jobs.detail(id), (old) => ({
        ...(old as JobResponse),
        ...updates,
      }));

      // Return a context object with the snapshotted value
      return { previousJob };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value if the mutation fails
      if (context?.previousJob) {
        queryClient.setQueryData(
          queryKeys.jobs.detail(variables.id),
          context.previousJob,
        );
      }
    },
  });

  const applyToJob = useMutation<void, Error, ApplyToJobVariables, { previousStatus: boolean | undefined; queryKey: string[] }>({
    mutationFn: (data: ApplyToJobVariables) => jobsService.applyToJob(data),
    onMutate: async (variables) => {
      // Optimistically update 'applied' status
      const rawQueryKey = queryKeys.jobs.applied(
        variables.jobId,
        variables.applicantId,
      );
      const queryKey = [...rawQueryKey] as string[];
      await queryClient.cancelQueries({ queryKey });
      const previousStatus = queryClient.getQueryData<boolean>(queryKey);
      queryClient.setQueryData(queryKey, true);
      return { previousStatus, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousStatus);
      }
    },
  });

  const deleteJob = useMutation<void, Error, string>({
    mutationFn: (id: string) => jobsService.deleteJob(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.jobs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
    },
  });

  const incrementViews = useMutation<void, Error, string>({
    mutationFn: (id: string) => jobsService.incrementViews(id),
  });

  type AppQueryData = { pages: { applications: JobApplication[] }[] } | JobApplication[];
  
  interface ApplicationMutationContext {
    previousApps: unknown;
    queryKey: readonly string[];
    previousAppsBoth?: AppQueryData;
    previousJobApps?: AppQueryData;
    queryKeyJobApps?: readonly string[] | null;
  }

  const updateApplicationStatus = useMutation<
    void, 
    Error, 
    { 
      appId: string; 
      status: "pending" | "reviewed" | "accepted" | "rejected";
      jobId?: string;
      userId?: string;
      role?: string;
    },
    ApplicationMutationContext
  >({
    mutationFn: ({ appId, status }) => jobsService.updateApplicationStatus(appId, status),
    onMutate: async ({ appId, status, userId, role, jobId }) => {
      if (!userId) {
        return {
          previousApps: undefined,
          queryKey: [],
        };
      }
      const targetRole = role || "employer";
      const queryKey = queryKeys.jobs.userApplications(userId, targetRole);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousApps = queryClient.getQueryData<unknown>(queryKey);

      // Optimistically update status of specific application
      // We must handle both array and InfiniteData shapes
      queryClient.setQueryData<AppQueryData>(queryKey, (old) => {
        if (!old) return old;

        const updateApp = (app: JobApplication) => 
          app.id === appId ? { ...app, status } : app;

        if ('pages' in old) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              applications: page.applications.map(updateApp),
            })),
          };
        } else if (Array.isArray(old)) {
          return old.map(updateApp);
        }
        return old;
      });

      // Handle 'both' role for dashboard sync
      const previousAppsBoth = targetRole !== "both" ? queryClient.getQueryData<AppQueryData>(queryKeys.jobs.userApplications(userId, "both")) : undefined;
      if (targetRole !== "both") {
        queryClient.setQueryData<AppQueryData>(queryKeys.jobs.userApplications(userId, "both"), (old) => {
          if (!old) return old;
          const updateApp = (app: JobApplication) => app.id === appId ? { ...app, status } : app;
          if ('pages' in old) {
             return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                applications: page.applications.map(updateApp),
              })),
            };
          } else if (Array.isArray(old)) {
            return old.map(updateApp);
          }
          return old;
        });
      }

      // Optimistically update job applications
      const queryKeyJobApps = jobId ? queryKeys.jobs.jobApplications(jobId) : null;
      const previousJobApps = queryKeyJobApps ? queryClient.getQueryData<AppQueryData>(queryKeyJobApps) : undefined;
      if (queryKeyJobApps) {
        await queryClient.cancelQueries({ queryKey: queryKeyJobApps });
        queryClient.setQueryData<AppQueryData>(queryKeyJobApps, (old) => {
          if (!old) return old;
          const updateApp = (app: JobApplication) => app.id === appId ? { ...app, status } : app;
          if ('pages' in old) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                applications: page.applications.map(updateApp),
              })),
            };
          } else if (Array.isArray(old)) {
            return old.map(updateApp);
          }
          return old;
        });
      }

      return { previousApps, queryKey, previousAppsBoth, previousJobApps, queryKeyJobApps };
    },
    onError: (err, variables, context) => {
      if (context?.queryKey && context?.previousApps) {
        queryClient.setQueryData(context.queryKey, context.previousApps);
      }
      if (context?.previousAppsBoth) {
        queryClient.setQueryData(queryKeys.jobs.userApplications(variables.userId || "", "both"), context.previousAppsBoth);
      }
      if (context?.queryKeyJobApps && context?.previousJobApps) {
        queryClient.setQueryData(context.queryKeyJobApps, context.previousJobApps);
      }
    },
  });

  return {
    updateJob: updateJob.mutateAsync,
    deleteJob: deleteJob.mutateAsync,
    incrementViews: incrementViews.mutateAsync,
    applyToJob: applyToJob.mutateAsync,
    updateApplicationStatus: updateApplicationStatus.mutateAsync,
  };
}
