import { Worker, Job } from "bullmq";
import { env } from "../config/env.ts";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { Logger } from "../utils/logger.ts";
import { JobType } from "./queue.service.ts";
import { GoogleIndexingService } from "./google-indexing.service.ts";
import { DLQService } from "./dlq.service.ts";

export class GoogleIndexingWorker {
  private static worker: Worker | null = null;

  static async init() {
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      Logger.withContext().warn("⚠️ Redis missing. Google Indexing BullMQ Worker skipped.");
      return;
    }

    Logger.withContext().info("🚀 Google Indexing BullMQ Worker Starting...");

    this.worker = new Worker(
      "google",
      async (job: Job) => {
        if (job.name === JobType.GOOGLE_INDEXING_PING) {
          const { url, type } = job.data as { url: string; type: "URL_UPDATED" | "URL_DELETED" };
          await GoogleIndexingService.ping(url, type);
        }
      },
      {
        connection: defaultConnection!,
        concurrency: 5, // Process up to 5 pings in parallel
        lockDuration: 60000, // 1 minute is enough for a ping
        lockRenewTime: 15000,
      }
    );

    this.worker.on("failed", async (job, err) => {
      Logger.withContext().error(`❌ Google Indexing job ${job?.id} failed`, { error: err.message });
      if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
        await DLQService.handleFinalFailure(job, err);
      }
    });

    this.worker.on("completed", (job) => {
      // Clean success logging
    });
  }

  static async gracefulShutdown() {
    if (this.worker) {
      await this.worker.close();
      Logger.withContext().info("Google Indexing Worker shut down.");
    }
  }
}
