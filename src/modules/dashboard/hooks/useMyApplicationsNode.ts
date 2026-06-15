import { useUserApplications, useJobsDetails } from '@/src/modules/jobs';
import { useAuth } from '@/src/context/AuthContext';
import { useMemo, useRef } from 'react';

// Custom enterprise-grade highly optimized deep equality utility to prevent rendering churn
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if ((a as Record<string, unknown>).constructor !== (b as Record<string, unknown>).constructor) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      const length = a.length;
      if (length !== b.length) return false;
      for (let i = length; i-- !== 0;) {
        if (!deepEqual(a[i], b[i])) return false;
      }
      return true;
    }
    const keys = Object.keys(a as Record<string, unknown>);
    const length = keys.length;
    if (length !== Object.keys(b as Record<string, unknown>).length) return false;
    for (let i = length; i-- !== 0;) {
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    }
    for (let i = length; i-- !== 0;) {
      const key = keys[i];
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) return false;
    }
    return true;
  }
  return a !== a && b !== b;
}

export function useMyApplicationsNode(searchQuery?: string) {
  const { user } = useAuth();
  
  const role = user?.role === 'poslodavac' ? 'employer' : 'applicant';
  
  const applicationsQuery = useUserApplications(user?.id, role, searchQuery);
  
  const rawApplications = applicationsQuery.data || [];
  
  // Cache and stabilize jobIds using deep comparison to prevent useJobsDetails from repeating network queries
  const jobIdsRef = useRef<string[]>([]);
  const jobIds = useMemo(() => {
    const rawIds = [...new Set(rawApplications.map(a => a.jobId))];
    if (deepEqual(jobIdsRef.current, rawIds)) {
      return jobIdsRef.current;
    }
    jobIdsRef.current = rawIds;
    return rawIds;
  }, [rawApplications]);
  
  // StaleTime optimized under the hood in useJobsDetails, query dependent on jobIds
  const jobsQuery = useJobsDetails(jobIds);

  const rawJobs = jobsQuery.data || [];

  // Wait for both applications & dependent jobs data to reach stability inside TanStack Cache
  const isStabilized = !applicationsQuery.isLoading && !jobsQuery.isLoading;

  const stabilizedRef = useRef<{
    applications: typeof rawApplications;
    jobs: typeof rawJobs;
  }>({
    applications: [],
    jobs: [],
  });

  const { applications, jobs } = useMemo(() => {
    const prev = stabilizedRef.current;

    // Transition/Intermediary state shield: Keep using previous stable references while fetching
    if (!isStabilized && prev.applications.length > 0) {
      return prev;
    }

    const appsChanged = !deepEqual(prev.applications, rawApplications);
    const jobsChanged = !deepEqual(prev.jobs, rawJobs);

    if (appsChanged || jobsChanged) {
      stabilizedRef.current = {
        applications: appsChanged ? rawApplications : prev.applications,
        jobs: jobsChanged ? rawJobs : prev.jobs,
      };
    }

    return stabilizedRef.current;
  }, [rawApplications, rawJobs, isStabilized]);

  return {
    applications,
    jobs,
    loadingApps: applicationsQuery.isLoading,
    loadingJobs: jobsQuery.isLoading,
    isFetchingNextPage: applicationsQuery.isFetchingNextPage,
    hasNextPage: applicationsQuery.hasNextPage,
    fetchNextPage: applicationsQuery.fetchNextPage,
    refetch: applicationsQuery.refetch
  };
}

