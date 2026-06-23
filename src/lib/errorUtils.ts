import { getLazyAuth } from '@/src/lib/firebase';
import { logger } from '@/src/lib/logger';

let _authInstance: any = null;
getLazyAuth().then(a => { _authInstance = a; });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Global state to track quota and network
let isQuotaExceeded = false;
let isOffline = !navigator.onLine;

const quotaListeners: Array<(exceeded: boolean) => void> = [];
const offlineListeners: Array<(offline: boolean) => void> = [];

export function subscribeToQuotaStatus(callback: (exceeded: boolean) => void) {
  quotaListeners.push(callback);
  return () => {
    const index = quotaListeners.indexOf(callback);
    if (index !== -1) quotaListeners.splice(index, 1);
  };
}

export function subscribeToOfflineStatus(callback: (offline: boolean) => void) {
  offlineListeners.push(callback);
  return () => {
    const index = offlineListeners.indexOf(callback);
    if (index !== -1) offlineListeners.splice(index, 1);
  };
}

export function getQuotaExceeded() {
  return isQuotaExceeded;
}

export function getOfflineStatus() {
  return isOffline;
}

export function setQuotaExceeded(status: boolean) {
  if (isQuotaExceeded !== status) {
    isQuotaExceeded = status;
    quotaListeners.forEach(cb => cb(status));
  }
}

export function setOfflineStatus(status: boolean) {
  if (isOffline !== status) {
    isOffline = status;
    offlineListeners.forEach(cb => cb(status));
  }
}

// Setup network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setOfflineStatus(false));
  window.addEventListener('offline', () => setOfflineStatus(true));
}

export function handleFirestoreError(
  error: unknown, 
  operationType: OperationType | string, 
  path: string | null = null,
  shouldThrow: boolean = true
): void {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  const isQuota = errMessage.toLowerCase().includes('quota') || JSON.stringify(error).toLowerCase().includes('quota');
  
  const isOfflineError = errMessage.toLowerCase().includes('offline') || errMessage.toLowerCase().includes('failed to fetch');
  
  if (isOfflineError) {
    setOfflineStatus(true);
  }

  if (isQuota) {
    setQuotaExceeded(true);
    // Silent log for quota to avoid console clutter and user frustration
    console.warn(`[INFO] Optimizacija pristupa bazi aktivna (kvota) za: ${operationType} na ${path}`);
    return; // STOP RIGHT HERE - NO MORE LOGGING OR THROWING
  }

  const cu = _authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: cu?.uid,
      email: cu?.email,
      emailVerified: cu?.emailVerified,
      isAnonymous: cu?.isAnonymous,
      tenantId: (cu as unknown as { tenantId?: string })?.tenantId || null,
      providerInfo: cu?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType: operationType as OperationType,
    path
  };
  
  if (errMessage.includes('insufficient permissions') || errMessage.includes('permission-denied')) {
    console.error(`[PERMISSION DENIED] ${operationType} on ${path}`, errInfo);
    logger.error(`Permission Denied: ${operationType} on ${path}`, errInfo);
  } else {
    console.error(`[FIRESTORE ERROR] ${operationType} on ${path}`, errMessage);
    logger.error(`Firestore Error: ${operationType} on ${path}`, errInfo);
  }
  
  if (shouldThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}
