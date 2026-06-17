import { Queue, Worker, Job } from "bullmq";
import { getRawRedis } from "./redis.ts";
import { defaultConnection } from "./queue.ts";
import { LoggerService } from "../services/logger.service.ts";
import { env } from "../config/env.ts";

let cronQueue: Queue | null = null;
let cronWorker: Worker | null = null;

const tasks = new Map<string, () => Promise<void> | void>();

export const SystemCron = {
  async init() {
    if (!defaultConnection) {
      LoggerService.warn("[SystemCron] Redis connection configuration missing, cron skipping.");
      return;
    }

    // Inicijalizujemo BullMQ Queue za Cron
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      LoggerService.warn("[SystemCron] Redis connection failed, cron skipping.");
      return;
    }

    cronQueue = new Queue("system-cron", { connection: {
          host: env.REDIS_HOST || (env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost'),
          port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : (env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port || '6379') : 6379),
          password: env.REDIS_PASSWORD || (env.REDIS_URL ? new URL(env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        } });

    // Worker koji ce pokretati zadatke
    cronWorker = new Worker(
      "system-cron",
      async (job: Job) => {
        const task = tasks.get(job.name);
        if (task) {
          LoggerService.info(`[SystemCron] Executing job: ${job.name}`);
          await task();
        } else {
          LoggerService.warn(`[SystemCron] Unknown job executed: ${job.name}`);
        }
      },
      { 
        connection: {
          host: env.REDIS_HOST || (env.REDIS_URL ? new URL(env.REDIS_URL).hostname : 'localhost'),
          port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : (env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port || '6379') : 6379),
          password: env.REDIS_PASSWORD || (env.REDIS_URL ? new URL(env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        }, 
        concurrency: 10,
        lockDuration: 300000, // 5 minutes default
        lockRenewTime: 30000,  // Proactive auto-renew every 30s
      } // Allow concurrent executions of different tasks
    );

    cronWorker.on("failed", (job, err) => {
      LoggerService.error(`[SystemCron] Job ${job?.name} failed`, err);
    });

    LoggerService.info("[SystemCron] Initialized BullMQ Cron Engine");
  },

  /**
   * Registruje zadatak koji će se ponavljati. Sigurno kroz ceo klaster.
   * @param name Jedinstveno ime zadatka
   * @param repeatOptions BullMQ repeat opcije
   * @param task Funkcija koja se izvrsava
   */
  async register(name: string, repeatOptions: { pattern?: string; every?: number }, task: () => any) {
    if (process.env.NODE_ENV !== "production" && !process.env.RUN_CRONS) {
      LoggerService.info(`[SystemCron] Skipping registration of ${name} in non-production mode.`);
      return;
    }
    tasks.set(name, task);

    // Pošto Redis (BullMQ) čuva informaciju o repeatable job-u trajno (dok se ne obriše), 
    // čak i ako drugi containeri pozovu ovo, BullMQ pametno deduplicira prema imenu i opcijama.
    if (cronQueue) {
      await cronQueue.add(name, {}, {
        repeat: repeatOptions,
        removeOnComplete: true,
        removeOnFail: 3, // cuvamo zadnja 3 u slucaju fail-a za debug
      });
      LoggerService.info(`[SystemCron] Registered repeatable job: ${name} with options: ${JSON.stringify(repeatOptions)}`);
    } else {
       // Ako SystemCron nije initovan (npr dev mod bez redisa), zadatak se ne izvršava ili bacamo grešku.
       LoggerService.warn(`[SystemCron] Cannot register ${name}, Queue not initialized.`);
    }
  },

  async gracefulShutdown() {
    if (cronWorker) {
      await cronWorker.close();
    }
    if (cronQueue) {
      await cronQueue.close();
    }
  }
};
