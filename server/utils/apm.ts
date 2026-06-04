import { Logger } from "./logger.ts";

const logger = new Logger({ service: "APM" });
const SLOW_QUERY_THRESHOLD_MS = 500; // Queries slow if > 500ms

export async function profile<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;

    if (duration >= SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(`🐢 Slow Query Detected: ${name}`, {
        durationMs: duration,
        thresholdMs: SLOW_QUERY_THRESHOLD_MS,
        operation: name,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`❌ Query Failed: ${name}`, {
      durationMs: duration,
      operation: name,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
