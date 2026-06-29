
export enum SyncTaskType {
  ALGOLIA_JOB_SYNC = "algolia_job_sync",
  ALGOLIA_JOB_DELETE = "algolia_job_delete",
  ALGOLIA_AD_SYNC = "algolia_ad_sync",
  ALGOLIA_AD_DELETE = "algolia_ad_delete",
  ALGOLIA_PROFILE_SYNC = "algolia_profile_sync",
  ALGOLIA_PROFILE_DELETE = "algolia_profile_delete",
  USER_RELATIONAL_SYNC = "user_relational_sync",
  JOB_APPLICATION_SYNC = "job_application_sync"
}

export interface SyncTask {
  id?: string;
  type: SyncTaskType;
  payload: Record<string, unknown>;
  priority?: number;
}
