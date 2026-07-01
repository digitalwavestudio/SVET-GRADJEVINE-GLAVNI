import { Worker, Job } from "bullmq";
import { db, admin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { eventBus } from "../events/event-bus.ts";
import { Logger, logger } from "../utils/logger.ts";
import { TraceContext } from "../utils/trace.ts";
import { defaultConnection } from "../utils/queue.ts";
import { JobType } from "./queue.service.ts";
 
export class OutboxWorker {
  private static worker: Worker;
  private static MAX_ATTEMPTS = 5;

  static async start() {
    if (!defaultConnection) {
      Logger.withContext().warn("Redis missing — outbox worker ne radi.");
      return;
    }

    Logger.withContext().info("Outbox Worker starting...");

    this.worker = new Worker(
      "outbox",
      async (job: Job) => {
        if (job.name === JobType.OUTBOX_PROCESS) {
          await this.processSingleMessage(job.data);
        }
      },
      {
        connection: defaultConnection,
        concurrency: 5,
      },
    );

  }

  public static async processSingleMessage(msg: any) {
    await TraceContext.run(msg.traceId, async () => {
        const iLogger = Logger.withContext(msg.correlationId);

        try {
          iLogger.info(`Processing message: ${msg.type}`, { msgId: msg.id });

          if (
            msg.type === "AD_UPDATED" &&
            msg.payload.oldData &&
            msg.payload.newData
          ) {
            const volatileFields = [
              "viewsCount", "clicksCount", "favoritesCount",
              "impressions", "lastActive", "updatedAt",
            ];
            const oldKeys = Object.keys(msg.payload.oldData);
            const newKeys = Object.keys(msg.payload.newData);
            const allKeys = new Set([...oldKeys, ...newKeys]);

            let onlyVolatileChanged = true;
            let hasChanges = false;

            for (const key of allKeys) {
              const oldVal = msg.payload.oldData[key];
              const newVal = msg.payload.newData[key];
              let changed = false;

              if (typeof oldVal === "object" || typeof newVal === "object") {
                changed = JSON.stringify(oldVal || null) !== JSON.stringify(newVal || null);
              } else {
                changed = oldVal !== newVal;
              }

              if (changed) {
                hasChanges = true;
                if (!volatileFields.includes(key)) {
                  onlyVolatileChanged = false;
                  break;
                }
              }
            }

            if (hasChanges && onlyVolatileChanged) {
              iLogger.info(`Skipping EventBus for ${msg.id} (only volatile fields changed)`);
              return;
            }
          }

          eventBus.emit(msg.type, msg.payload);

          iLogger.info(`Successfully processed message ${msg.id}`);
        } catch (error: any) {
          const nextAttempts = (msg.attempts || 0) + 1;
          const isTerminalFailure = nextAttempts >= this.MAX_ATTEMPTS;

          if (isTerminalFailure) {
            iLogger.error(`Message ${msg.id} moved to DLQ`, { error: error.message });
          } else {
            iLogger.warn(`Retry ${nextAttempts}/${this.MAX_ATTEMPTS} for ${msg.id}`, { error: error.message });
            throw error;
          }
        }
    });
  }

  static async gracefulShutdown() {
    if (this.worker) await this.worker.close();
    Logger.withContext().info("Outbox Worker shut down.");
  }
}
