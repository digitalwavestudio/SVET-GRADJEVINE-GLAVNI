interface MutationGuardOptions {
  actionName: string;
  context?: Record<string, unknown>;
}

export async function mutationGuard<T>(
  action: () => Promise<T>,
  options: MutationGuardOptions
): Promise<T> {
  try {
    return await action();
  } catch (error: unknown) {
    if (typeof window !== "undefined") {
      const errMsg = (error && typeof error === 'object' && 'message' in error) 
        ? String((error as { message: unknown }).message) 
        : "Unknown mutation error";

      // Send error to our DLQ logging endpoint
      fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "error",
          source: "MutationGuard",
          message: errMsg,
          context: {
            action: options.actionName,
            ...options.context,
            criticalLevel: "CRITICAL_ACTION_FAILED"
          },
          url: window.location.href,
        })
      }).catch(e => console.error("Could not send DLQ log for mutation error", e));
    }
    throw error;
  }
}
