import { db, admin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { Logger } from "../utils/logger.ts";
import { AlertingService } from "./alerting.service.ts";
import { QueueService, JobType, JobPriority } from "./queue.service.ts";
import { LockManager } from "./lock.service.ts";
import { Worker, Job } from "bullmq";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { RegionService } from "./region.service.ts";

/**
 * DLQ Recovery Worker (Enterprise Auto-pilot)
 * Hvata zaglavljene procese, proverava timeout-e i sprovodi
 * retry cikluse sa eksponencijalnim backoff-om.
 */
export class DLQRecoveryWorker {
  private static logger = new Logger({ service: "DLQRecoveryWorker" });
  private static worker: Worker | null = null;
  private static MAX_RETRY_ATTEMPTS = 8;
  private static TASK_MAX_RETRY = 5;
  private static PURE_DLQ_MAX_RETRY = 3;

  static async start() {
    this.logger.info("🚀 DLQ Recovery Worker (Auto-pilot) Starting...");

    const sharedClient = getRawRedis();
    if (!sharedClient) {
      this.logger.warn("⚠️ Redis missing. DLQ BullMQ Worker not started.");
      return; 
    }

    this.worker = new Worker(
      "system",
      async (job: Job) => {
        if (job.name === JobType.DLQ_SCAVENGE_CRON) {
          await this.scavengeDLQ();
        }
      },
      { 
        connection: defaultConnection!,
        concurrency: 5,
        lockDuration: 300000,
        lockRenewTime: 30000
      }
    );

    this.worker.on("failed", (job, err) => {
      this.logger.error(`❌ DLQ Scavenger job failed`, { error: err.message });
    });

    if (RegionService.isLeaderRegion()) {
      await QueueService.addJob(
        JobType.DLQ_SCAVENGE_CRON,
        {},
        {
          jobId: "cron-dlq_scavenger",
          repeat: { pattern: "*/30 * * * *" }, // svaka 30 min
          priority: JobPriority.LOW,
        }
      );
    }
  }

  static async scavengeDLQ() {
    const lockKey = "lock:dlq_recovery_worker";
    const lockId = await LockManager.acquire(lockKey, 2 * 60 * 1000);
    if (!lockId) {
      return; // Netko drugi radi recovery
    }

    try {
      const { CacheService } = await import("./cache.service.ts");
      const isEmpty = await CacheService.get<boolean>("dlq_is_empty");
      if (isEmpty === true) {
        this.logger.info("[DLQ Worker] Skipping scavenge: Redis Shield indicates no DLQ items (5m TTL).");
        return;
      }

      const now = Date.now();

      const recoverOutboxCount = await this.recoverOutbox(now);
      const recoverTasksCount = await this.recoverOutboxTasks(now);
      const pureDlqCount = await this.recoverPureDLQ(now);

      const totalFound = recoverOutboxCount + recoverTasksCount + pureDlqCount;
      if (totalFound === 0) {
         this.logger.info("[DLQ Worker] No items found in any queue. Activating 5-minute No-Backlog Cache Shield.");
         await CacheService.set("dlq_is_empty", true, 5 * 60 * 1000); 
      } else {
         await CacheService.set("dlq_is_empty", false, 60 * 60 * 1000); 
      }

    } catch (err: any) {
      if (
        err?.message?.includes("Quota limit exceeded") ||
        err?.details?.includes("Quota limit exceeded")
      ) {
        this.logger.warn("[DLQRecovery] Quota exceeded. Skipping ...");
      } else {
        this.logger.error("[DLQRecovery] Error during DLQ scavenge:", err);
      }
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  private static async recoverOutbox(now: number): Promise<number> {
    // Oporavak iz "outbox" kolekcije (podaci iz Sagas i UnifiedAds)
    const outboxSnap = await db
      .collection("outbox")
      .where("status", "in", ["dlq", "processing", "failed_permanently"])
      .limit(50)
      .get();

    if (outboxSnap.empty) return 0;

    for (const doc of outboxSnap.docs) {
      const data = doc.data();
      const timestamp = data.updatedAt
        ? new Date(data.updatedAt).getTime()
        : data.processedAt
          ? new Date(data.processedAt).getTime()
          : 0;

      // Ako je 'processing' ali je unutar 10 minuta (jako dugacak timeout),
      // ignorisemo i pustamo ga jos
      if (data.status === "processing" && now - timestamp < 10 * 60 * 1000)
        continue;

      const retryCount = data.recoveries || 0;

      if (retryCount >= this.MAX_RETRY_ATTEMPTS) {
        if (data.status !== "failed_permanently") {
           await doc.ref.update({ status: "failed_permanently" });
           AlertingService.sendGeneralAlert(
             `🚨 [DLQ Auto-pilot] UPOZORENJE! Outbox doc ${doc.id} dostigao max retries (${this.MAX_RETRY_ATTEMPTS}). Zahteva ljudsku intervenciju! Error: ${data.lastError}`,
           );
           this.logger.error(`[DLQRecovery] Terminal failure outbox doc ${doc.id}`);
        } else {
          // Deep Auto-fallback za failed_permanently (Re-attempt after 24h)
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            this.logger.warn(`[DLQRecovery] 🔄 Deep Auto-Fallback: Replaying permanently failed outbox doc ${doc.id} after 24h.`);
            await doc.ref.update({
              status: "pending",
              recoveries: 0,
              attempts: 0,
              updatedAt: new Date().toISOString(),
              note: "Deep Auto-Fallback Replay"
            });
            QueueService.addJob(
              JobType.OUTBOX_PROCESS,
              { id: doc.id, ...data },
              { jobId: `outbox-deep_retry-${doc.id}-${Date.now()}` }
            );
          }
        }
        continue;
      }

      // Exponential backoff: 1m, 2m, 4m, 8m, 16m...
      const delay = Math.pow(2, retryCount) * 60 * 1000;
      if (now - timestamp < delay) continue;

      this.logger.warn(
        `[DLQRecovery] 🛠️ Retrying OUTBOX doc ${doc.id} (Attempt ${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`,
      );

      await doc.ref.update({
        status: "pending",
        recoveries: retryCount + 1,
        attempts: 0, // Reset za standardni outbox.worker
        updatedAt: new Date().toISOString(),
      });

      // Pokusaj slanja u BullMQ
      QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id: doc.id, ...data },
        {
          jobId: `outbox-retry-${doc.id}-${retryCount}`,
        },
      );
    }
    return outboxSnap.size;
  }

  private static async recoverOutboxTasks(now: number): Promise<number> {
    // Oporavak zadataka iz 'outbox_tasks' (fan-out sync, itd.)
    const taskSnap = await db
      .collection("outbox_tasks")
      .where("status", "in", ["failed", "processing", "failed_permanently"])
      .limit(50)
      .get();

    if (taskSnap.empty) return 0;

    for (const doc of taskSnap.docs) {
      const data = doc.data();
      // Ovi koriste stringovan updatedAt
      const timestamp = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;

      if (data.status === "processing" && now - timestamp < 10 * 60 * 1000)
        continue;

      const retryCount = data.retryCount || 0;

      if (retryCount >= this.TASK_MAX_RETRY) {
        if (data.status !== "failed_permanently") {
          await doc.ref.update({ status: "failed_permanently" });
          AlertingService.sendGeneralAlert(
            `🚨 [DLQ Auto-pilot] UPOZORENJE! OutboxTask doc ${doc.id} nepopravljiv nakon ${this.TASK_MAX_RETRY} pokušaja. Intervencija nužna! Error: ${data.error}`,
          );
        } else {
          // Deep Auto-fallback
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            this.logger.warn(`[DLQRecovery] 🔄 Deep Auto-Fallback: Replaying permanently failed outbox_task doc ${doc.id} after 24h.`);
            await doc.ref.update({
              status: "pending",
              retryCount: 0,
              updatedAt: new Date().toISOString(),
              note: "Deep Auto-Fallback Replay"
            });
          }
        }
        continue;
      }

      const delay = Math.pow(2, retryCount) * 60 * 1000;
      if (now - timestamp < delay) continue;

      this.logger.warn(
        `[DLQRecovery] 🛠️ Retrying outbox_tasks DOC ${doc.id} (Attempt ${retryCount + 1}/${this.TASK_MAX_RETRY})`,
      );

      await doc.ref.update({
        status: "pending", // Ovo vraca posao starom Housekeeping procesu
        retryCount: retryCount + 1,
        updatedAt: new Date().toISOString(),
      });
    }
    return taskSnap.size;
  }

  private static async recoverPureDLQ(now: number): Promise<number> {
    // Oporavak iz eksplicitnog 'dlq' skladista kreiranog kroz DLQService za BullMQ puknuca
    const pureDlqSnap = await db
      .collection("dlq")
      .where("status", "in", ["pending_review", "failed_permanently"])
      .limit(50)
      .get();

    if (pureDlqSnap.empty) return 0;

    for (const doc of pureDlqSnap.docs) {
      const data = doc.data();
      const addedAt = new Date(
        data.metadata?.finishedAt || Date.now(),
      ).getTime();
      const lastRetryAt = data.requeuedAt
        ? new Date(data.requeuedAt).getTime()
        : addedAt;

      const recoveries = data.recoveries || 0;
      if (recoveries >= this.PURE_DLQ_MAX_RETRY) {
        if (data.status !== "failed_permanently") {
          await doc.ref.update({ status: "failed_permanently" });
          AlertingService.sendGeneralAlert(
            `🚨 [DLQ Auto-pilot] BullMQ Fatal Panic na jobu ${data.jobId} iz reda ${data.queue} nakon ${this.PURE_DLQ_MAX_RETRY} totalnih ciklusa!`,
          );
        } else {
          // Deep Auto-fallback
          if (now - lastRetryAt > 24 * 60 * 60 * 1000) {
            this.logger.warn(`[DLQRecovery] 🔄 Deep Auto-Fallback: Replaying permanently failed pure dlq doc ${doc.id} after 24h.`);
            await doc.ref.update({
              status: "pending_review",
              recoveries: 0,
              requeuedAt: admin.firestore.FieldValue.serverTimestamp(),
              note: "Deep Auto-Fallback Replay"
            });
            if (data.jobType && data.payload) {
              await QueueService.addJob(data.jobType as JobType, data.payload, {
                jobId: `dlq-deep_retry-${data.jobId}-${Date.now()}`,
              });
            }
          }
        }
        continue;
      }

      // 2m, 4m, 8m
      const delay = Math.pow(2, recoveries) * 2 * 60 * 1000;
      if (now - lastRetryAt < delay) continue;

      this.logger.warn(
        `[DLQRecovery] 🛠️ Re-injecting DLQ JOB ${data.jobId} into queue ${data.queue} (Recovery cycle ${recoveries + 1})`,
      );

      if (data.jobType && data.payload) {
        await QueueService.addJob(data.jobType as JobType, data.payload, {
          jobId: `dlq-retry-${data.jobId}-${recoveries}`,
        });
      }

      await doc.ref.update({
        status: "pending_review",
        recoveries: recoveries + 1,
        requeuedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return pureDlqSnap.size;
  }

  static async stop() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
