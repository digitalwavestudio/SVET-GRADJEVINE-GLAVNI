/**
 * Enterprise-level Client-Side Telemetry Logger for failed dashboard mutations & client anomalies.
 */

export async function trackMutationError(error: unknown, mutation: unknown) {
  try {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    
    let errorMsg = '';
    let errorName = 'Error';
    let errorStack: string | null = null;
    let errorStatus: string | number | null = null;

    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      errorMsg = typeof errObj.message === 'string' ? errObj.message : String(error);
      errorName = typeof errObj.name === 'string' ? errObj.name : 'Error';
      errorStack = typeof errObj.stack === 'string' ? errObj.stack : null;
      errorStatus = (typeof errObj.status === 'string' || typeof errObj.status === 'number') ? errObj.status : null;
      if (!errorStatus && errObj.data && typeof errObj.data === 'object') {
        const errData = errObj.data as Record<string, unknown>;
        errorStatus = (typeof errData.status === 'string' || typeof errData.status === 'number') ? errData.status : null;
      }
    } else {
      errorMsg = String(error);
    }

    // Filter out minor network fluctuations on the client to save network bandwidth
    if (
      isOffline ||
      errorMsg.includes('Failed to fetch') ||
      errorMsg.includes('NetworkError') ||
      errorMsg.includes('Network Error') ||
      errorMsg.includes('chunk') ||
      errorMsg.includes('dynamically imported module')
    ) {
      // Offline or network flap, ignore to prevent clutter
      return;
    }

    let mutationKey: string[] = [];
    let mutationVars: unknown = null;

    if (mutation && typeof mutation === 'object') {
      const mutObj = mutation as Record<string, unknown>;
      if (mutObj.options && typeof mutObj.options === 'object') {
        const opts = mutObj.options as Record<string, unknown>;
        if (Array.isArray(opts.mutationKey)) {
          mutationKey = opts.mutationKey.map(String);
        }
      }
      if (mutObj.state && typeof mutObj.state === 'object') {
        const stateObj = mutObj.state as Record<string, unknown>;
        mutationVars = stateObj.variables;
      }
    }
    
    // Check if mutation is dashboard-related or critical operation
    const isDashboardOrCritical = 
      mutationKey.includes('dashboard') ||
      mutationKey.includes('wallet') ||
      mutationKey.includes('jobs') ||
      mutationKey.includes('ads') ||
      mutationKey.includes('messages') ||
      mutationKey.includes('postAd');

    if (!isDashboardOrCritical) {
      return;
    }

    const payload = {
      type: 'mutation_error',
      severity: 'error',
      clientVersion: '1.4.2-enterprise',
      error: {
        name: errorName,
        message: errorMsg,
        stack: errorStack,
        status: errorStatus,
      },
      mutation: {
        mutationKey,
        variables: mutationVars ? sanitizeVariables(mutationVars) : null,
      },
      url: typeof window !== 'undefined' ? window.location.pathname + window.location.search : 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Fire-and-forget asynchronous dispatch
    fetch('/api/metrics/telemetry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(err => {
      console.warn('[Telemetry] Failed to dispatch log to backend:', err);
    });
  } catch (err) {
    console.error('[Telemetry] Error in trackMutationError handler:', err);
  }
}

/**
 * Clean and sanitize sensitive variables before sending them in telemetry
 */
function sanitizeVariables(vars: unknown): unknown {
  if (!vars || typeof vars !== 'object') return vars;
  try {
    const copy = { ...vars } as Record<string, unknown>;
    const sensitiveKeys = ['password', 'token', 'secret', 'creditCard', 'cvv', 'cardNumber'];
    
    for (const key of Object.keys(copy)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        copy[key] = '[REDACTED_SENSITIVE]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = sanitizeVariables(copy[key]);
      }
    }
    return copy;
  } catch {
    return '[UNABLE_TO_SANITIZE]';
  }
}
