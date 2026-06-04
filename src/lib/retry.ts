export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelayMs = 1000
): Promise<T> => {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      
      let errorMsgStr = '';
      let errorCodeStr: string | null = null;
      let errorStatusNum: number | null = null;

      if (error && typeof error === 'object') {
        const errObj = error as Record<string, unknown>;
        if (typeof errObj.message === 'string') errorMsgStr = errObj.message;
        if (typeof errObj.code === 'string') errorCodeStr = errObj.code;
        if (typeof errObj.status === 'number') errorStatusNum = errObj.status;
      } else {
        errorMsgStr = String(error);
      }
      
      const isNetworkError = 
        errorMsgStr.includes('Failed to fetch') || 
        errorMsgStr.includes('Network Error') ||
        errorCodeStr === 'unavailable' ||
        errorCodeStr === 'deadline-exceeded' ||
        (errorStatusNum !== null && errorStatusNum >= 500 && errorStatusNum < 600);

      // Do not retry 4xx errors or logical app errors unless they are mapped to 5xx
      if (!isNetworkError && attempt > 1) {
         throw error;
      }
      
      if (attempt > retries) {
        console.error('Max retries reached. Error:', error);
        throw new Error(errorMsgStr || 'Serverska greška, pokušajte ponovo');
      }
      
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Pokušaj nije uspeo (${errorMsgStr}), ponovni pokušaj za ${exponentialDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, exponentialDelay));
    }
  }
  throw new Error('Serverska greška, pokušajte ponovo');
};

