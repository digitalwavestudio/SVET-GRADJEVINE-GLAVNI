import { withRetry } from '@/src/lib/retry';
import { JobResponse, JobApplication } from '@/src/modules/jobs/types/models';
import { EntityStatus } from '@/src/modules/core/types/common';
import { jobSchema } from '@svet-gradjevine/shared';
import { notificationService } from '@/src/services/notificationService';
import { isLaunchModeActive } from '@/src/services/platformService';
import { sanitizeInput, sanitizeRichText } from '@/src/lib/sanitize';
import { validateData, validateList } from '@/src/modules/core';
import { z } from 'zod';
import { viewStatsService } from '@/src/services/viewStatsService';
import { packageService } from '@/src/services/packageService';
import { apiClient } from '@/src/lib/apiClient';
import { safeRedirect } from '@/src/lib/urlUtils';
import { JobApplicationContract } from '@/src/modules/jobs/types/jobContracts';

export interface Job extends JobResponse {
  searchKeywords?: string[];
  searchableText?: string;
}

export interface JobsListResponse {
  items: JobResponse[];
  lastVisible: string | null;
  hasMore: boolean;
  totalHits?: number;
  total?: number;
  activeJobs?: number;
}

export interface UserApplicationsResponse {
  applications: JobApplication[];
  lastVisibleId: string | null;
  hasMore: boolean;
}

interface JobSearchApiResponse {
  docs?: unknown[];
  lastVisible?: string | null;
  hasMore?: boolean;
  totalHits?: number;
}

const JOBS_COLLECTION = 'listings';

const jobExtendedSchema = jobSchema.extend({
  id: z.string(),
  createdAt: z.unknown().optional(),
  updatedAt: z.unknown().optional(),
  searchableText: z.string().optional()
}) as unknown as z.ZodSchema<JobResponse>;

export const jobsService = {
  // --- APPLICATIONS FETCHING ---
  async fetchApplications(jobId: string): Promise<JobApplication[]> {
    return withRetry(async () => {
      const data = await apiClient.get<JobApplication[]>(`/jobs/applications/${jobId}`);
      return data || [];
    });
  },

  async fetchUserApplications(
    userId: string,
    role: 'applicant' | 'employer',
    cursor?: string,
    limit = 15,
    searchQuery?: string
  ): Promise<UserApplicationsResponse> {
    return withRetry(async () => {
      let url = `/jobs/applications/user/${role}?limit=${limit}`;
      if (cursor) url += `&cursor=${cursor}`;
      if (searchQuery) url += `&searchQ=${encodeURIComponent(searchQuery)}`;
      const res = await apiClient.get<UserApplicationsResponse | null>(url);
      return {
        applications: res?.applications || [],
        lastVisibleId: res?.lastVisibleId || null,
        hasMore: res?.hasMore || false,
      };
    });
  },

  // --- FETCHING ---
  async fetchByCompany(companyId: string): Promise<JobResponse[]> {
    return withRetry(async () => {
      const data = await apiClient.post<JobSearchApiResponse>('/jobs/search', { filters: { companyId }, pageSize: 100 });
      return validateList(jobExtendedSchema, data?.docs || []);
    });
  },

  async fetchJobs(
    filters: Record<string, unknown> | null | undefined,
    _lastVisible?: string | { id: string } | null,
    _pageSize?: number
  ): Promise<JobsListResponse> {
    return withRetry(async () => {
      const metaKeys = ['status', 'pageSize', 'lastVisibleId'];
      const filterKeys = Object.keys(filters || {}).filter(k => !metaKeys.includes(k));
      const isEmptyFilter = !filters || filterKeys.length === 0;

      const allowedFilterKeys = ['status', 'searchQuery', 'locationSlug', 'professionSlug', 'sector', 'engagement', 'experience', 'minSalary', 'maxSalary', 'isPremium', 'isUrgent', 'isPremiumPartner', 'isVerified', 'showAllStatuses', 'companyId'];
      const f = filters || {} as Record<string, unknown>;
      const cleanFilters: Record<string, unknown> = {};
      for (const key of allowedFilterKeys) {
        if (f[key] !== undefined) cleanFilters[key] = f[key];
      }
      const data = isEmptyFilter && !filters?.searchQuery
        ? await apiClient.get<JobSearchApiResponse>('/jobs?pageSize=100')
        : await apiClient.post<JobSearchApiResponse>('/jobs/search', { 
            searchQuery: (filters?.searchQuery as string | undefined) || "", 
            filters: cleanFilters, 
            pageSize: 50
          });

      return {
        items: validateList(jobExtendedSchema, data?.docs || []),
        lastVisible: data?.lastVisible || null,
        hasMore: data?.hasMore || false,
        totalHits: data?.totalHits as number | undefined,
        total: data?.total as number | undefined,
        activeJobs: data?.activeJobs as number | undefined,
      };
    });
  },

  // --- ACTIONS ---
  async createJob(jobData: Partial<Job>): Promise<string> {
    return withRetry(async () => {
      const currentUser = (await import('firebase/auth')).getAuth().currentUser;
      if (!currentUser) throw new Error('Niste prijavljeni.');

      // 1. Provera kredita
      const { hasCredits, available } = await packageService.checkCredits(currentUser.uid);
      if (!hasCredits) {
        throw new Error(`Nemate dovoljno kredita za objavu oglasa (Trenutno: ${available}). Molimo dokupite kredite.`);
      }

      const sanitizedJob = {
        ...jobData,
        title: sanitizeInput(jobData.title || ''),
        description: sanitizeRichText(jobData.description || ''),
      };

      const data = await apiClient.post<{ jobId: string }>('/jobs/create', { job: sanitizedJob });
      
      // 2. Konzumacija kredita nakon uspešne potvrde
      await packageService.consumeCredit(currentUser.uid);

      if (!data?.jobId) {
        throw new Error('Sistem nije vratio ID kreiranog posla.');
      }

      return data.jobId;
    });
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    return withRetry(async () => {
      await apiClient.patch(`/jobs/${id}`, updates);
    });
  },

  async deleteJob(id: string): Promise<void> {
    return withRetry(async () => {
      await apiClient.delete(`/jobs/${id}`);
    });
  },

  async applyToJob(contract: {
    jobId: string;
    applicantId: string;
    jobTitle?: string;
    employerId?: string;
    coverLetter?: string;
    applicantPhone?: string;
    applicantName?: string;
    applicantEmail?: string;
  }): Promise<void> {
    return withRetry(async () => {
      await apiClient.post<void>('/jobs/apply', {
        jobId: contract.jobId,
        jobTitle: contract.jobTitle,
        employerId: contract.employerId,
        coverLetter: contract.coverLetter,
        applicantPhone: contract.applicantPhone
      });
    });
  },

  async updateApplicationStatus(appId: string, status: 'pending' | 'reviewed' | 'accepted' | 'rejected'): Promise<void> {
    return withRetry(async () => {
      await apiClient.patch<void>(`/jobs/applications/${appId}`, { status });
    });
  },

  async fetchSpecialJobs(filters: Record<string, unknown>): Promise<{ premium: JobResponse[]; urgent: JobResponse[] }> {
    return { premium: [], urgent: [] };
  },

  async fetchSimilarJobs(jobId: string, locationSlug?: string, professionSlug?: string): Promise<JobResponse[]> {
    return [];
  },

  async checkIfAlreadyApplied(jobId: string, applicantId: string): Promise<boolean> {
    return withRetry(async () => {
      try {
        const data = await apiClient.get<{ applied: boolean }>(`/jobs/applied/${jobId}`);
        return !!data?.applied;
      } catch (e) {
        return false;
      }
    });
  },

  async approveJob(id: string): Promise<void> {
    return this.updateJob(id, { status: EntityStatus.ACTIVE });
  },

  async togglePremium(id: string, isPremium: boolean): Promise<void> {
    if (isPremium && await isLaunchModeActive()) throw new Error("Launch mode active");
    return this.updateJob(id, { isPremium });
  },

  async toggleUrgent(id: string, isUrgent: boolean): Promise<void> {
    if (isUrgent && await isLaunchModeActive()) throw new Error("Launch mode active");
    return this.updateJob(id, { isUrgent });
  },

  async changeStatus(id: string, status: string): Promise<void> {
    return this.updateJob(id, { status: status as EntityStatus });
  },

  async fetchJobById(id: string): Promise<JobResponse | null> {
    return withRetry(async () => {
      try {
        const data = await apiClient.get<JobResponse & { redirect?: string }>(`/jobs/${id}`);
        // If the API returns a smooth error with redirect (200 OK wrapped, or handled by apiClient), 
        // handle it before zod validation
        if (data?.redirect && safeRedirect(data.redirect)) {
           window.location.href = data.redirect;
           return null;
        }
        return validateData(jobExtendedSchema, data);
      } catch (e: unknown) {
        console.error("SDK fetch failed", e);
        // Sometimes the error object carries the response body from the API
        const errObj = e as { response?: { data?: { redirect?: string } }; data?: { redirect?: string } };
        const errorData = errObj?.response?.data || errObj?.data || errObj;
        if (errorData && typeof errorData === 'object' && 'redirect' in errorData && typeof errorData.redirect === 'string' && safeRedirect(errorData.redirect)) {
            window.location.href = errorData.redirect;
        }
        return null;
      }
    });
  },

  async fetchJobsBatch(ids: string[]): Promise<JobResponse[]> {
    return withRetry(async () => {
      try {
        if (!ids || ids.length === 0) return [];
        const data = await apiClient.post<JobResponse[]>('/ads/batch', { ids });
        return data || [];
      } catch (e) {
        console.error("SDK fetchBatch failed", e);
        return [];
      }
    });
  },

  async incrementViews(id: string, collectionName: string = JOBS_COLLECTION): Promise<void> {
    await viewStatsService.incrementView(collectionName, id);
  }
};
