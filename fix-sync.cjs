const fs = require('fs');

const typeContent = `
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
`;
fs.writeFileSync('server/services/sync/sync-types.ts', typeContent);

let syncService = fs.readFileSync('server/services/sync.service.ts', 'utf8');
syncService = syncService.replace(/export enum SyncTaskType \{[\s\S]*?\}\s*export interface SyncTask \{[\s\S]*?\}/, 'export { SyncTaskType, SyncTask } from "./sync/sync-types.ts";');
fs.writeFileSync('server/services/sync.service.ts', syncService);

let syncAlgolia = fs.readFileSync('server/services/sync/sync-algolia.service.ts', 'utf8');
syncAlgolia = syncAlgolia.replace('import { SyncTaskType } from "../sync.service.ts";', 'import { SyncTaskType } from "./sync-types.ts";');
fs.writeFileSync('server/services/sync/sync-algolia.service.ts', syncAlgolia);

let syncProcessor = fs.readFileSync('server/services/sync/sync-processor.service.ts', 'utf8');
syncProcessor = syncProcessor.replace('import { SyncTaskType } from "../sync.service.ts";', 'import { SyncTaskType } from "./sync-types.ts";');
fs.writeFileSync('server/services/sync/sync-processor.service.ts', syncProcessor);

console.log("Moved SyncTaskType to break circular dependency");