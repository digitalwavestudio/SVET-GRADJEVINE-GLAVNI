import { Job } from "bullmq";
import { db } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { TraceContext } from "../utils/trace.ts";

export class DLQService {
  private static logger = new Logger({ service: "DLQService" });

  /**
   * Premesta neuspeli job iz BullMQ u Firestore za manuelni pregled.
   */
  static async handleFinalFailure(job: Job, error: Error) {
    const traceId = job.data?.metadata?.traceId || TraceContext.generateId();

    await TraceContext.run(traceId, async () => {
      this.logger.error(
        `[DLQ] Moving job ${job.id} to manual review. Reason: ${error.message}`,
        {
          queue: job.queueName,
          jobId: job.id,
          attempts: job.attemptsMade,
        },
      );

      try {
        await db.collection("dlq").add({
          jobId: job.id || "unknown",
          queue: job.queueName,
          jobType: job.name,
          payload: job.data,
          error: error.message,
          stack: error.stack,
          attemptsMade: job.attemptsMade,
          metadata: {
            traceId,
            finishedAt: new Date().toISOString(),
          },
          status: "pending_review",
        });

        this.logger.info(
          `[DLQ] Job ${job.id} successfully recorded for manual review.`,
        );
      } catch (err: any) {
        this.logger.error(
          "[DLQ] Critical failure while saving to DLQ repository",
          { error: err.message },
        );
      }
    });
  }
}
