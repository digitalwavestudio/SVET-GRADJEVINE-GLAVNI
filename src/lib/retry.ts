import { ApiError } from "@svet-gradjevine/api";

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Odlučuje da li je greška prolazna i vredi je ponoviti.
 * - ApiError 4xx (klijentska greška) -> NE retry-uj (trajna)
 * - ApiError 5xx (serverska greška) -> retry-uj (prolazna)
 * - Ostale greške (mreža, timeout, DNS) nemaju status -> retry-uj
 */
const isRetryable = (err: unknown): boolean => {
  if (err instanceof ApiError) {
    return err.status >= 500 && err.status < 600;
  }
  return true;
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; signal?: AbortSignal },
): Promise<T> => {
  const maxAttempts = opts?.maxAttempts ?? MAX_ATTEMPTS;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (opts?.signal?.aborted) {
      throw new Error("Request aborted");
    }
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts || !isRetryable(err)) {
        break;
      }
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastErr;
};
