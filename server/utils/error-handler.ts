export type OperationType =
  | "create"
  | "update"
  | "delete"
  | "list"
  | "get"
  | "write";

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  userId?: string,
) {
  const errInfo: FirestoreErrorInfo = {
    error: getErrorMessage(error),
    authInfo: {
      userId: userId || null,
    },
    operationType,
    path,
  };
  const errStr = JSON.stringify(errInfo);
  console.error("Firestore Error: ", errStr);
  throw new Error(errStr);
}

/**
 * Safely extracts error message from an unknown error object.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) return String(error.message);
  if (typeof error === 'string') return error;
  return 'Interna serverska greška';
}
