import { Queue, Worker, Job } from "bullmq";
import { getRawRedis } from "./redis.ts";
import { defaultConnection } from "./queue.ts";
import { logger } from "./logger.ts";
import { env } from "../config/env.ts";

let cronQueue: Queue | null = null;
let cronWorker: Worker | null = null;

const tasks = new Map<string, () => Promise<void> | void>();

export const SystemCron = {
  async init() {
    if (!defaultConnection) {
      logger.warn("[SystemCron] Redis connection configuration missing, cron skipping.");
      return;
    }

    // Inicijalizujemo BullMQ Queue za Cron
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      logger.warn("[SystemCron] Redis connection failed, cron skipping.");
      return;
    }

    cronQueue = new Queue("system-cron", { connection: defaultConnection! });

    // Worker koji ce pokretati zadatke
    cronWorker = new Worker(
      "system-cron",
      async (job: Job) => {
        const task = tasks.get(job.name);
        if (task) {
          logger.info(`[SystemCron] Executing job: ${job.name}`);
          await task();
        } else {
          logger.warn(`[SystemCron] Unknown job executed: ${job.name}`);
        }
      },
      { connection: defaultConnection!, 
        concurrency: 10,
        lockDuration: 300000,
        lockRenewTime: 30000,
      }
    );

    cronWorker.on("failed", (job, err) => {
      logger.error(`[SystemCron] Job ${job?.name} failed`, err);
    });

    logger.info("[SystemCron] Initialized BullMQ Cron Engine");
  },

  /**
   * Registruje zadatak koji će se ponavljati. Sigurno kroz ceo klaster.
   * @param name Jedinstveno ime zadatka
   * @param repeatOptions BullMQ repeat opcije
   * @param task Funkcija koja se izvrsava
   */
  async register(name: string, repeatOptions: { pattern?: string; every?: number }, task: () => any) {
    if (env.NODE_ENV !== "production" && !env.RUN_CRONS) {
      logger.info(`[SystemCron] Skipping registration of ${name} in non-production mode.`);
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
      logger.info(`[SystemCron] Registered repeatable job: ${name} with options: ${JSON.stringify(repeatOptions)}`);
    } else {
       // Ako SystemCron nije initovan (npr dev mod bez redisa), zadatak se ne izvršava ili bacamo grešku.
       logger.warn(`[SystemCron] Cannot register ${name}, Queue not initialized.`);
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
