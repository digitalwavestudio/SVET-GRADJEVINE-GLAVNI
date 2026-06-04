export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delayMs: number; backoff: boolean } = {
    maxAttempts: 3,
    delayMs: 1000,
    backoff: true,
  },
): Promise<T> {
  let attempts = 0;
  while (attempts < options.maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= options.maxAttempts) throw error;

      const delay = options.backoff
        ? options.delayMs * Math.pow(2, attempts - 1)
        : options.delayMs;
      console.warn(
        `[Retry] Attempt ${attempts} failed. Retrying in ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry failed");
}
