import { Job } from "@svet-gradjevine/shared";
import { JobsCoreService } from "./jobs/jobs-core.service.ts";
import { JobsSearchService } from "./jobs/jobs-search.service.ts";
import { JobsApplicationsService } from "./jobs/jobs-applications.service.ts";

export class JobsService {
  static async getPublicJobs(limit: number = 100, cursor?: string): Promise<{
    docs: any[];
    lastVisible: string | null;
    hasMore: boolean;
    warning?: string;
  }> {
    return JobsCoreService.getPublicJobs(limit, cursor) as any;
  }

  static async searchJobs(
    validatedInfo: any,
    ipStr: string,
    useAlgoliaOptions: { appId?: string; apiKey?: string } = {},
  ): Promise<{
    docs: any[];
    lastVisible: string | null;
    hasMore: boolean;
    totalHits?: number;
  }> {
    return JobsSearchService.searchJobs(validatedInfo, ipStr, useAlgoliaOptions) as any;
  }

  static async getJobById(id: string) {
    return JobsCoreService.getJobById(id);
  }

  static async createJob(rawPayload: unknown, uid: string) {
    return JobsCoreService.createJob(rawPayload, uid);
  }

  static async updateJob(id: string, updates: Partial<Job>, uid: string) {
    return JobsCoreService.updateJob(id, updates, uid);
  }

  static async deleteJob(id: string, uid: string) {
    return JobsCoreService.deleteJob(id, uid);
  }

  static async applyForJob(
    validatedData: any,
    userParams: { uid: string; email: string; name: string },
  ) {
    return JobsApplicationsService.applyForJob(validatedData, userParams);
  }

  static async getApplications(jobId: string, uid: string) {
    return JobsApplicationsService.getApplications(jobId, uid);
  }

  static async getUserApplications(uid: string, role: string, limitCount = 15, cursor?: string) {
    return JobsApplicationsService.getUserApplications(uid, role, limitCount, cursor);
  }

  static async updateApplicationStatus(
    appId: string,
    status: string,
    uid: string,
  ) {
    return JobsApplicationsService.updateApplicationStatus(appId, status, uid);
  }

  static async checkIfAlreadyApplied(jobId: string, uid: string) {
    return JobsApplicationsService.checkIfAlreadyApplied(jobId, uid);
  }
}
