import { createQueue } from "../utils/queue.ts";
import { TraceContext } from "../utils/trace.ts";
import { getRedis } from "../utils/redis.ts";
import { logger } from "../utils/logger.ts";

/**
 * Tipi zadataka podržani u sistemu.
 */
export enum JobType {
  OUTBOX_PROCESS = "outbox:process",
  SYNC_COLLECTION = "sync:collection",
  EMAIL_SEND = "email:send",
  IMAGE_OPTIMIZE = "image:optimize",
  ANALYTICS_TRACK = "analytics:track",
  SYSTEM_HOUSEKEEPING = "system:housekeeping",
  DLQ_SCAVENGE_CRON = "system:dlq_scavenge_cron",
  OUTBOX_SCAVENGE_CRON = "outbox:scavenge_cron",
  ALGOLIA_BATCH_CRON = "algolia:batch_cron",
  CHAT_BUFFER_CRON = "chat:buffer_cron",
  GOOGLE_INDEXING_PING = "google:indexing_ping",
}

/**
 * Prioriteti zadataka.
 */
export enum JobPriority {
  HIGH = 1,
  MEDIUM = 5,
  LOW = 10,
}

export interface OutboxJobPayload {
  outboxId?: string;
  type?: string;
  [key: string]: unknown;
}

export interface SyncJobPayload {
  collection?: string;
  id?: string;
  targetId?: string;
  type?: string;
  data?: any;
  correlationId?: string;
}

export interface EmailJobPayload {
  to: string;
  template: string;
  data: any;
}

export type JobPayloadMap = {
  [JobType.OUTBOX_PROCESS]: OutboxJobPayload;
  [JobType.SYNC_COLLECTION]: SyncJobPayload;
  [JobType.EMAIL_SEND]: EmailJobPayload;
  [JobType.IMAGE_OPTIMIZE]: { collection: string; docId: string; images: string[] };
  [JobType.ANALYTICS_TRACK]: { event: string; userId?: string; props?: any };
  [JobType.SYSTEM_HOUSEKEEPING]: { action?: string };
  [JobType.DLQ_SCAVENGE_CRON]: Record<string, never>;
  [JobType.OUTBOX_SCAVENGE_CRON]: Record<string, never>;
  [JobType.ALGOLIA_BATCH_CRON]: Record<string, never>;
  [JobType.CHAT_BUFFER_CRON]: Record<string, never>;
  [JobType.GOOGLE_INDEXING_PING]: { url: string; type: "URL_UPDATED" | "URL_DELETED" };
};

export class QueueService {
  private static queues = new Map<string, import("bullmq").Queue>();

  private static getQueue(name: string) {
    console.log(`[QueueService] getQueue requested: ${name}`);
    if (!this.queues.has(name)) {
      const queue = createQueue(name);
      if (queue) {
        console.log(`[QueueService] Queue ${name} created successfully.`);
        this.queues.set(name, queue);
      } else {
        logger.warn(`[QueueService] Queue ${name} could not be created.`);
        return null;
      }
    }
    return this.queues.get(name);
  }

  /**
   * Dodaje zadatak u red.
   */
  static async addJob<T extends JobType>(
    type: T,
    data: JobPayloadMap[T],
    options: {
      priority?: JobPriority;
      delay?: number;
      jobId?: string;
      repeat?: any;
    } = {},
  ) {
    const queueName = type.split(":")[0]; // npr. 'outbox', 'sync'
    
    // Automatically push outbox messages to fallback Redis queue for bypassing Firestore scanning
    if (type === JobType.OUTBOX_PROCESS) {
      const redis = getRedis();
      if (redis) {
        try {
          await redis.rpush("outbox:local_queue", JSON.stringify(data));
          await redis.ltrim("outbox:local_queue", -5000, -1);
        } catch (rErr: unknown) {
          console.error("[QueueService] Failed to queue outbox in backup Redis list:", rErr instanceof Error ? rErr.message : String(rErr));
        }
      }
    }

    const queue = this.getQueue(queueName);

    if (!queue) {
      logger.warn(
        `[QueueService] Skipping addJob(${type}) because Redis is not configured.`,
      );
      return null;
    }

    const traceId = TraceContext.getTraceId();

    return await queue.add(
      type,
      {
        ...data,
        metadata: {
          traceId,
          addedAt: new Date().toISOString(),
        },
      },
      {
        priority: options.priority || JobPriority.MEDIUM,
        delay: options.delay,
        jobId: options.jobId,
        repeat: options.repeat,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    );
  }
}
