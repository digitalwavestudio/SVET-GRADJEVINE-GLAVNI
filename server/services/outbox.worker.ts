// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { Worker, Job } from "bullmq";
import { db, admin } from "../config/firebase.ts";
import { env } from "../config/env.ts";
import { MonitoringService } from "./monitoring.service.ts";
import { eventBus } from "../events/event-bus.ts";
import { SchemaRegistry } from "./schema-registry.service.ts";
import { Logger, logger } from "../utils/logger.ts";
import { TraceContext } from "../utils/trace.ts";
import { defaultConnection } from "../utils/queue.ts";
import { QueueService, JobType, JobPriority } from "./queue.service.ts";
import { RegionService } from "./region.service.ts";
import { DLQService } from "./dlq.service.ts";
import { getRedis, getRawRedis } from "../utils/redis.ts";

export class SlidingWindowRateLimiter {
  private timestamps: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = 15, windowMs: number = 1000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  checkAndAcquire(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length < this.limit) {
      this.timestamps.push(now);
      return true;
    }
    return false;
  }
}

export const outboxRateLimiter = new SlidingWindowRateLimiter(15, 1000);

export class OutboxWorker {
  private static worker: Worker;
  private static scavengerInterval: NodeJS.Timeout;
  private static MAX_ATTEMPTS = 5;

  // Resilience, lock-escalation & lock-contention management properties
  private static consecutiveContentionFailures = 0;
  private static currentBackoffMs = 0;
  private static isRedisFallbackActive = false;

  private static handleContentionError(error: any) {
    const errorMsg = error?.message || String(error);
    const isContention = 
      errorMsg.includes("lock contention") ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("Trip Circuit Breaker") ||
      errorMsg.includes("Quota exceeded") ||
      errorMsg.includes("overloaded") ||
      errorMsg.includes("ABORTED") ||
      errorMsg.includes("CONCURRENCY_ERROR");

    if (isContention) {
      this.consecutiveContentionFailures++;
      this.currentBackoffMs = Math.min(30000, this.consecutiveContentionFailures * 2000);
      
      logger.warn(`[OutboxWorker] Lock contention/load error detected! Back-off delay set to ${this.currentBackoffMs}ms. Consecutive errors: ${this.consecutiveContentionFailures}`);

      // Bypass threshold
      if (this.consecutiveContentionFailures >= 3 && !this.isRedisFallbackActive) {
        this.isRedisFallbackActive = true;
        console.error(`🚨 [OutboxWorker] Highly increased lock-contention detected in Firestore. Diverting scavenger runs to local regional Redis lists to prevent database scan overhead.`);
      }
    }
  }

  private static handleContentionSuccess() {
    if (this.consecutiveContentionFailures > 0) {
      this.consecutiveContentionFailures = 0;
      this.currentBackoffMs = 0;
      if (this.isRedisFallbackActive) {
        this.isRedisFallbackActive = false;
        console.log("🛡️ [OutboxWorker] Firestore lock-contention resolved. Resuming generic database scanning.");
      }
    }
  }

  static async start() {
    const isProd = env.NODE_ENV === "production";
    const sharedClient = getRawRedis();

    if (!defaultConnection || !sharedClient) {
      Logger.withContext().warn(
        "⚠️ Redis missing or connection unavailable. Outbox worker running in fallback mode with local in-memory scavenger.",
      );
      
      const intervalMs = isProd ? 15 * 60 * 1000 : 3000; // 15 min u prod, 3 sekunde u dev za brzi odziv
      this.scavengerInterval = setInterval(() => {
        this.scavengePendingLocal().catch((err) =>
          console.error("[OutboxWorker] Local scavenger interval error:", err),
        );
      }, intervalMs);
      return;
    }

    Logger.withContext().info("🚀 Outbox BullMQ Worker Starting...");

    // 1. Inicijalizacija BullMQ Worker-a
    this.worker = new Worker(
      "outbox",
      async (job: Job) => {
        if (job.name === JobType.OUTBOX_PROCESS) {
          await this.processSingleMessage(job.data);
        } else if (job.name === JobType.OUTBOX_SCAVENGE_CRON) {
          await this.scavengePending();
        }
      },
      {
        connection: defaultConnection,
        concurrency: 5, // Procesiraj uporedo 5 poruka
        lockDuration: 300000, // 5 minutes default
        lockRenewTime: 30000,  // Proactive auto-renew every 30s
      },
    );

    this.worker.on("failed", async (job, err) => {
      const logger = new Logger({ jobId: job?.id });
      logger.error(`❌ Job failed in Outbox Worker`, { error: err.message });

      // Ako je posao potrošio sve pokušaje (attempts) i nije scavenge cron krug, ide u DLQ na manuelni pregled
      if (job && job.name === JobType.OUTBOX_PROCESS && job.attemptsMade >= (job.opts.attempts || 1)) {
        await DLQService.handleFinalFailure(job, err);
      }
    });

    // 2. Scavenger - BullMQ Repeatable cron job
    if (RegionService.isLeaderRegion()) {
      const repeatPattern = isProd ? "*/30 * * * *" : "0 */2 * * *"; // svaka 30 min u prod, svaka 2 sata u dev sandbox-u
      await QueueService.addJob(
        JobType.OUTBOX_SCAVENGE_CRON,
        {},
        {
          jobId: "cron-outbox_scavenger",
          repeat: { pattern: repeatPattern },
          priority: JobPriority.LOW,
        }
      );
      
      // Pokreni immediate scavenger na startu samo u production režimu
      if (isProd) {
        await QueueService.addJob(
          JobType.OUTBOX_SCAVENGE_CRON,
          {},
          {
            jobId: `cron-outbox_scavenger-${Date.now()}`,
            delay: 30000,
          }
        );
      }
    }
  }

  /**
   * Lokalni fallback koji odmah procesuira 'pending' poruke bez BullMQ reda (za dev / env bez Redis-a).
   */
  private static async scavengePendingLocal() {
    const isProd = env.NODE_ENV === "production";
    const { CacheService } = await import("./cache.service.ts");
    const hasPending = await CacheService.get<boolean>("outbox_has_pending");
    if (hasPending === false || (!isProd && hasPending === null)) {
      return;
    }

    const lockKey = "lock:outbox_scavenger_local";
    let lockId: string | null = null;
    try {
      const { LockManager } = await import("./lock.service");
      lockId = await LockManager.acquire(lockKey, 5 * 60 * 1000);
      if (!lockId) return; // Neko drugi vec obradjuje
      
      // Apply stepped back-off throttling delay before the processing run under lock contention
      if (this.currentBackoffMs > 0) {
        console.log(`[OutboxWorker] Throttled run local: sleeping for ${this.currentBackoffMs}ms back-off delay before processing...`);
        await new Promise((resolve) => setTimeout(resolve, this.currentBackoffMs));
      }

      const messages: any[] = [];

      if (this.isRedisFallbackActive) {
        const redis = getRedis();
        if (redis) {
          try {
            console.log(`⚡ [OutboxWorker] Local fallback: Bypassing Firestore scan. Popping pending outbox items from regional local Redis lists.`);
            for (let i = 0; i < 10; i++) {
              const raw = await redis.lpop("outbox:local_queue");
              if (!raw) break;
              try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.id) messages.push(parsed);
              } catch (e) {
                // Ignore raw corruption
              }
            }
          } catch (rErr: any) {
            console.error("[OutboxWorker] Local fallback Redis pop error:", rErr?.message);
          }
        }
      }

      if (!this.isRedisFallbackActive) {
        const shardPromises = Array.from({ length: 3 }).map((_, shardId) =>
          db.collection("outbox")
            .where("status", "==", "pending")
            .where("shardNum", "==", shardId)
            .limit(10)
            .get()
        );
        const snaps = await Promise.all(shardPromises);

        let isEmpty = true;
        for (const s of snaps) {
          if (!s.empty) {
            isEmpty = false;
            messages.push(...s.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          }
        }

        if (isEmpty) {
          // Obavesti cache da je sve ocisceno
          const cacheTtl = isProd ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000; // 30 min in prod, 2 hours in dev sandbox-u
          await CacheService.set("outbox_has_pending", false, cacheTtl);
          return;
        }
        
        // Imamo posla, setuj true (ili osvezi expiration)
        await CacheService.set("outbox_has_pending", true, 30 * 60 * 1000);
      }

      for (const msg of messages) {
        try {
          await this.processSingleMessage(msg);
        } catch (e) {
          // Error is already logged inside processSingleMessage, just continue to next
        }
      }
    } catch (err: any) {
      this.handleContentionError(err);
      if (
        err?.message?.includes("Quota limit exceeded") ||
        err?.details?.includes("Quota limit exceeded")
      ) {
        logger.warn("[OutboxScavengerLocal] Quota exceeded, preskačem...");
      } else {
        console.error("[OutboxScavengerLocal] Error:", err.message);
      }
    } finally {
      const { LockManager } = await import("./lock.service");
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  /**
   * Pronalazi poruke u bazi koje su 'pending' i dodaje ih u BullMQ red.
   */
  public static async scavengePending() {
    const isProd = env.NODE_ENV === "production";
    const { CacheService } = await import("./cache.service.ts");
    const hasPending = await CacheService.get<boolean>("outbox_has_pending");
    if (hasPending === false || (!isProd && hasPending === null)) {
      return;
    }

    const lockKey = "lock:outbox_scavenger";
    let lockId: string | null = null;
    try {
      const { LockManager } = await import("./lock.service");
      lockId = await LockManager.acquire(lockKey, 5 * 60 * 1000);
      if (!lockId) return;

      // Apply stepped back-off throttling delay before the processing run under lock contention
      if (this.currentBackoffMs > 0) {
        console.log(`[OutboxWorker] Throttled run: sleeping for ${this.currentBackoffMs}ms back-off delay before processing...`);
        await new Promise((resolve) => setTimeout(resolve, this.currentBackoffMs));
      }

      const messages: any[] = [];

      if (this.isRedisFallbackActive) {
        const redis = getRedis();
        if (redis) {
          try {
            console.log(`⚡ [OutboxWorker] Scavenger: Bypassing Firestore scan. Popping pending outbox items from regional local Redis lists.`);
            for (let i = 0; i < 20; i++) {
              const raw = await redis.lpop("outbox:local_queue");
              if (!raw) break;
              try {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.id) messages.push(parsed);
              } catch (e) {
                // Ignore raw corruption
              }
            }
          } catch (rErr: any) {
            console.error("[OutboxWorker] Scavenger Redis pop error:", rErr?.message);
          }
        }
      }

      if (!this.isRedisFallbackActive) {
        const shardPromises = Array.from({ length: 3 }).map((_, shardId) =>
          db.collection("outbox")
            .where("status", "==", "pending")
            .where("shardNum", "==", shardId)
            .limit(10)
            .get()
        );
        const snaps = await Promise.all(shardPromises);

        let isEmpty = true;
        for (const s of snaps) {
          if (!s.empty) {
            isEmpty = false;
            messages.push(...s.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          }
        }
          
        if (isEmpty) {
          const cacheTtl = isProd ? 30 * 60 * 1000 : 2 * 60 * 60 * 1000; // 30 min in prod, 2 hours in dev sandbox-u
          await CacheService.set("outbox_has_pending", false, cacheTtl);
          return;
        }
        
        await CacheService.set("outbox_has_pending", true, 30 * 60 * 1000);
      }

      for (const msg of messages) {
        // Dodajemo u red. BullMQ će sprečiti duplikate ako prosledimo msg.id kao JobId
        await QueueService.addJob(JobType.OUTBOX_PROCESS, msg, {
          jobId: `outbox-${msg.id}`,
          priority: JobPriority.HIGH,
        });
      }
    } catch (err: any) {
      this.handleContentionError(err);
      if (
        err?.message?.includes("Quota limit exceeded") ||
        err?.details?.includes("Quota limit exceeded")
      ) {
        logger.warn("[OutboxScavenger] Quota exceeded, preskačem...");
      } else {
        console.error("[OutboxScavenger] Error:", err.message);
      }
    } finally {
      const { LockManager } = await import("./lock.service");
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  /**
   * Logika obrade jedne poruke.
   */
  public static async processSingleMessage(msg: any) {
    await TraceContext.run(msg.traceId, async () => {
      await MonitoringService.tracePhase("sync_outbox", async () => {
        const iLogger = Logger.withContext(msg.correlationId);

        // Client sliding-window rate limiter (15 outbox tasks/second per node)
        if (!outboxRateLimiter.checkAndAcquire()) {
          iLogger.warn(
            `${TraceContext.logPrefix()} ⚠️ Sliding window rate limit exceeded (>15 tasks/s). Postponing and re-queueing outbox task: ${msg.id}`,
          );

          if (defaultConnection) {
            // Re-queue the job with delay
            await QueueService.addJob(JobType.OUTBOX_PROCESS, msg, {
              delay: 1000, // delay by 1 second to wait for the next slot
              jobId: `outbox-throttled-${msg.id}-${Date.now()}`,
            });
            return; // Exit early without updating status to "processed", so it stays pending
          } else {
            // Fallback for local processing: sleep and retry locally
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await this.processSingleMessage(msg);
            return;
          }
        }

        // Apply stepped back-off throttling delay inside message processing to relieve Firestore read/write load
        if (this.currentBackoffMs > 0) {
          iLogger.warn(`⏳ [OutboxWorker] Throttled processing: delaying message ${msg.id} execution by ${this.currentBackoffMs / 2}ms...`);
          await new Promise((resolve) => setTimeout(resolve, this.currentBackoffMs / 2));
        }

        try {
          iLogger.info(
            `${TraceContext.logPrefix()} Processing message: ${msg.type}`,
            { msgId: msg.id },
          );

          // 1. Validacija šeme
          const validation = SchemaRegistry.validate(
            msg.type,
            msg.payload,
            msg.version,
          );
          if (!validation.success) {
            throw new Error(`Schema validation failed: ${validation.error}`);
          }

          // 1.5. Pre-Algolia & EventBus Optimization for Volatile Fields (Zadatak 10)
          // Ako je ovo AD_UPDATED event, i update sadrzi samo polja poput viewsCount,
          // prekidamo obradu i ne zatrpavamo EventBus / Algoliu
          if (
            msg.type === "AD_UPDATED" &&
            msg.payload.oldData &&
            msg.payload.newData
          ) {
            const volatileFields = [
              "viewsCount",
              "clicksCount",
              "favoritesCount",
              "impressions",
              "lastActive",
              "updatedAt",
            ];
            const oldKeys = Object.keys(msg.payload.oldData);
            const newKeys = Object.keys(msg.payload.newData);
            const allKeys = new Set([...oldKeys, ...newKeys]);

            let onlyVolatileChanged = true;
            let hasChanges = false;

            for (const key of allKeys) {
              // Arrays and Objects need stringify comparison, basic primitive check otherwise
              const oldVal = msg.payload.oldData[key];
              const newVal = msg.payload.newData[key];
              let changed = false;

              if (typeof oldVal === "object" || typeof newVal === "object") {
                changed =
                  JSON.stringify(oldVal || null) !==
                  JSON.stringify(newVal || null);
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
              iLogger.info(
                `${TraceContext.logPrefix()} Skipping EventBus processing for ${msg.id} (only volatile fields changed - No-Sync for Algolia)`,
              );
              await db.collection("outbox").doc(msg.id!).update({
                status: "processed",
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                note: "Skipped - pure volatile update",
              });
              return; // EARLY EXIT! Saver za 80% writes!
            }
          }

          // 2. Emitovanje na lokalni Event Bus
          eventBus.emit(msg.type, msg.payload);

          // 3. Update statusa u bazi
          await db.collection("outbox").doc(msg.id!).update({
            status: "processed",
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          const redis = getRedis();
          if (redis) {
            redis.decr("metrics:outbox_stats:pending").catch((e: any) => logger.warn("[Outbox] Redis decr pending metric:", e?.message));
          }

          this.handleContentionSuccess();

          iLogger.info(
            `${TraceContext.logPrefix()} Successfully processed message ${msg.id}`,
          );
        } catch (error: any) {
          this.handleContentionError(error);

          const nextAttempts = (msg.attempts || 0) + 1;
          const isTerminalFailure = nextAttempts >= this.MAX_ATTEMPTS;
          const status = isTerminalFailure ? "dlq" : "pending";

          await db.collection("outbox").doc(msg.id!).update({
            status,
            attempts: nextAttempts,
            lastError: error.message,
          });

          const redis = getRedis();
          if (redis) {
            if (isTerminalFailure) {
            redis.decr("metrics:outbox_stats:pending").catch((e: any) => logger.warn("[Outbox] Redis decr pending metric:", e?.message));
              redis.incr("metrics:outbox_stats:failed").catch((e: any) => logger.warn("[Outbox] Redis incr failed metric:", e?.message));
            }
          }

          if (isTerminalFailure) {
            iLogger.error(
              `${TraceContext.logPrefix()} Message ${msg.id} moved to DLQ`,
              { error: error.message },
            );
          } else {
            iLogger.warn(
              `${TraceContext.logPrefix()} Retry ${nextAttempts}/${this.MAX_ATTEMPTS} for ${msg.id}`,
              { error: error.message },
            );
            throw error; // Bacamo error da bi BullMQ odradio backoff i retry
          }
        }
      }, { type: msg.type, id: msg.id });
    });
  }

  static async gracefulShutdown() {
    if (this.scavengerInterval) clearInterval(this.scavengerInterval);
    if (this.worker) await this.worker.close();
    Logger.withContext().info("Outbox Worker shut down.");
  }
}
