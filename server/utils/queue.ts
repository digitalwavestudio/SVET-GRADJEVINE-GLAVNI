import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { env } from "../config/env.ts";
import { getRawRedis } from "./redis.ts";
import { logger } from "../utils/logger.ts";

const getQueueConnectionOptions = () => {
  if (env.REDIS_URL) {
    try {
      const url = new URL(env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
        maxRetriesPerRequest: null,
      };
    } catch (e) {
      console.error("[Queue] Invalid REDIS_URL environment variable:", e);
    }
  }
  if (env.REDIS_HOST) {
    return {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT || "6379") || 6379,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    };
  }
  return undefined;
};

const connectionOptions = getQueueConnectionOptions();

export const defaultConnection = connectionOptions;

/**
 * Pomoćna funkcija za kreiranje reda sa standardnim podešavanjima.
 * BullMQ sam upravlja konekcijama kroz options objekat kako bi se izbeglo blokiranje.
 */
export function createQueue(name: string) {
  if (!connectionOptions) {
    logger.warn(
      `[Queue] Skipping queue ${name} initialization because Redis is missing.`,
    );
    return null;
  }
  if (env.NODE_ENV !== "production") console.info(`[Queue] Initializing queue: ${name}`);
  return new Queue(name, {
    connection: connectionOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: { count: 100 }, // Keep only the last 100 failures to prevent Redis OOM
    },
  });
}

/**
 * Pomoćna funkcija za kreiranje radnika sa deljenom konekcijom.
 */
export function createWorker(name: string, processor: import("bullmq").Processor, options: Omit<import("bullmq").WorkerOptions, "connection"> = {}) {
  if (!connectionOptions) {
    logger.warn(`[Queue] Skipping worker ${name} initialization because Redis is missing.`);
    return null;
  }
  
  return new Worker(name, processor, {
    lockDuration: 300000, // 5 minutes default
    lockRenewTime: 30000,  // Proactive auto-renew every 30s
    ...options,
    connection: connectionOptions,
  });
}
