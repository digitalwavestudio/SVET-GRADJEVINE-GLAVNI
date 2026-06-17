import { Worker, Job as BullJob } from "bullmq";
import { env } from "../config/env.ts";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { JobType } from "./queue.service.ts";
import { ImageService } from "./image.service.ts";
import { Logger } from "../utils/logger.ts";

export class ImageWorker {
  private static worker: Worker | null = null;

  static async init() {
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      Logger.withContext().warn("⚠️ Redis missing. Image BullMQ Worker skipped.");
      return;
    }

    Logger.withContext().info(
      `🚀 Image BullMQ Worker Starting (Using shared connection)...`,
    );

    this.worker = new Worker(
      "image",
      async (job: BullJob) => {
        if (job.name === JobType.IMAGE_OPTIMIZE) {
          const { collection, docId, images } = job.data;
          Logger.withContext().info(
            `[ImageWorker] Processing images for ${collection}/${docId} (${images?.length || 0} images)`,
          );

          try {
            // Sharp can be CPU intensive, concurrency is handled by BullMQ (default 1 here, but we can set higher)
            await ImageService.processAdImages(collection, docId, images);
            Logger.withContext().info(
              `[ImageWorker] Successfully processed images for ${collection}/${docId}`,
            );
          } catch (error: any) {
            Logger.withContext().error(
              `[ImageWorker] Failed to process images for ${collection}/${docId}`,
              { error: error.message },
            );
            throw error; // Let BullMQ handle retries
          }
        }
      },
      {
        connection: {
          host: env.REDIS_HOST || (env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost'),
          port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : (env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port || '6379') : 6379),
          password: env.REDIS_PASSWORD || (env.REDIS_URL ? new URL(env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        },
        concurrency: 2, // Max 2 concurrent Sharp operations per container to avoid OOM/CPU saturation
        lockDuration: 300000, // 5 minutes default
        lockRenewTime: 30000,  // Proactive auto-renew every 30s
      },
    );

    this.worker.on("failed", (job, err) => {
      Logger.withContext().error(`[ImageWorker] Job ${job?.id} failed:`, {
        error: err.message,
      });
    });

    this.worker.on("completed", (job) => {
      Logger.withContext().info(`[ImageWorker] Job ${job.id} completed.`);
    });
  }

  static async gracefulShutdown() {
    if (this.worker) {
      await this.worker.close();
      Logger.withContext().info("Image Worker shut down.");
    }
  }
}
