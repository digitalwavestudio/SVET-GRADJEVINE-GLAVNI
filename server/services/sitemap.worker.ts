import { Worker, Job } from "bullmq";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { admin } from "../config/firebase.ts";
import { SitemapService } from "./sitemap.service.ts";
import { env } from "../config/env.ts";
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { logger } from "../utils/logger.ts";

export const SITEMAP_QUEUE_NAME = "sitemap-queue";

export interface SitemapJobPayload {
  trigger: string;
  category?: string;
  id?: string;
}

export class SitemapWorkerService {
  private worker: Worker | null = null;
  private isProcessing = false;

  constructor() {
    if (env.NODE_ENV !== "production") {
      console.info(
        "[SitemapWorker] Sandboxed Dev Mode: Skipping worker initialization to shield connections and Firestore Quotas.",
      );
      return;
    }

    const sharedClient = getRawRedis();
    if (!sharedClient) {
      logger.warn(
        "[SitemapWorker] Skipping worker initialization, redis connection missing.",
      );
      return;
    }

    this.worker = new Worker<SitemapJobPayload>(
      SITEMAP_QUEUE_NAME,
      async (job: Job<SitemapJobPayload>) => {
        return this.processSitemapJob(job);
      },
      { connection: defaultConnection!,
        concurrency: 1,
        lockDuration: 300000,
        lockRenewTime: 30000,
      },
    );

    this.worker.on("completed", (job) => {
      console.info(
        `[SitemapWorker] Job ${job.id} completed successfully (Trigger: ${job.data.trigger})`,
      );
    });

    this.worker.on("failed", (job, err) => {
      console.error(`[SitemapWorker] Job ${job?.id} failed processing`, err);
    });
  }

  private async processSitemapJob(job: Job<SitemapJobPayload>) {
    console.info(
      `[SitemapWorker] Starting sitemap regeneration triggered by ${job.data.trigger} - Category: ${job.data.category || "ALL"}`,
    );

    try {
      const bucket = admin.storage().bucket();

      // We will regenerate segments based on what changed
      // If it's a specific category, we can just regenerate that category's sitemap
      const category = job.data.category;

      const manifest = await SitemapService.getSitemapManifest();

      if (category && manifest[category] !== undefined) {
        console.info(`[SitemapWorker] Regenerating all pages for segment: ${category}`);
        const count = Number(manifest[category]) || 0;
        const pages = Math.ceil(count / (SitemapService as any).CHUNK_SIZE) || 1;
        let lastDoc = null;
        
        for (let page = 1; page <= pages; page++) {
          const filename = `sitemaps/sitemap-${category}-${page}.xml`;
          const writeStream = bucket.file(filename).createWriteStream({ contentType: "application/xml" });
          
          if (["companies", "masters"].includes(category)) {
             // For users segments
             const res: { xml: string, lastDoc: any } = category === "companies" ? 
                await SitemapService.generateCompaniesSitemap(page, lastDoc) : 
                await SitemapService.generateMastersSitemap(page, lastDoc);
             await bucket.file(filename).save(res.xml, { contentType: "application/xml" });
             lastDoc = res.lastDoc;
          } else {
             await SitemapService.streamCollectionSitemapToStream(category, page, writeStream);
          }
        }
      } else if (category === "magazine") {
        const count = Number(manifest.magazine) || 0;
        const pages = Math.ceil(count / (SitemapService as any).CHUNK_SIZE) || 1;
        let lastDoc = null;
        for (let page = 1; page <= pages; page++) {
          const res = await SitemapService.generateMagazineSitemap(page, lastDoc);
          await bucket.file(`sitemaps/sitemap-magazine-${page}.xml`).save(res.xml, { contentType: "application/xml" });
          lastDoc = res.lastDoc;
        }
      } else if (category === "pseo") {
        const xml = await SitemapService.generatePseoSitemap();
        await bucket
          .file(`sitemaps/sitemap-pseo-1.xml`)
          .save(xml, { contentType: "application/xml" });
      } else {
        // Full Refresh
        const staticXml = await SitemapService.generateStaticSitemap();
        await bucket.file(`sitemaps/sitemap-static-1.xml`).save(staticXml, { contentType: "application/xml" });

        const pseoXml = await SitemapService.generatePseoSitemap();
        await bucket.file(`sitemaps/sitemap-pseo-1.xml`).save(pseoXml, { contentType: "application/xml" });

        for (const [coll, countObj] of Object.entries(manifest)) {
          const count = Number(countObj) || 0;
          const pages = Math.ceil(count / (SitemapService as any).CHUNK_SIZE) || 1;
          let lastDoc = null;
          for (let page = 1; page <= pages; page++) {
            const filename = `sitemaps/sitemap-${coll}-${page}.xml`;
            if (coll === "magazine") {
               const res = await SitemapService.generateMagazineSitemap(page, lastDoc);
               await bucket.file(filename).save(res.xml, { contentType: "application/xml" });
               lastDoc = res.lastDoc;
            } else if (["companies", "masters"].includes(coll)) {
               const res: { xml: string, lastDoc: any } = coll === "companies" ? 
                  await SitemapService.generateCompaniesSitemap(page, lastDoc) : 
                  await SitemapService.generateMastersSitemap(page, lastDoc);
               await bucket.file(filename).save(res.xml, { contentType: "application/xml" });
               lastDoc = res.lastDoc;
            } else {
              const writeStream = bucket.file(filename).createWriteStream({ contentType: "application/xml" });
              await SitemapService.streamCollectionSitemapToStream(coll, page, writeStream);
            }
          }
        }
      }

      // Also always update the index
      const indexXml = await SitemapService.generateIndex();
      await bucket
        .file(`sitemaps/sitemap-index.xml`)
        .save(indexXml, { contentType: "application/xml" });
    } catch (error) {
      console.error(`[SitemapWorker] Error updating GC sitemaps:`, error);
      throw error;
    }
  }

  public async getStoredSitemap(filename: string): Promise<string | null> {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(`sitemaps/${filename}`);
      const [exists] = await file.exists();
      if (!exists) return null;

      const [buffer] = await file.download();
      return buffer.toString("utf-8");
    } catch (e) {
      console.error(
        `[SitemapWorker] Failed to read ${filename} from storage`,
        e,
      );
      return null;
    }
  }

  private static sharedQueue: import("bullmq").Queue | null = null;

  public async triggerRegeneration(payload: SitemapJobPayload) {
    if (defaultConnection) {
      if (!SitemapWorkerService.sharedQueue) {
        const { Queue } = await import("bullmq");
        SitemapWorkerService.sharedQueue = new Queue(SITEMAP_QUEUE_NAME, {
          connection: defaultConnection!,
        });
      }
      
      await SitemapWorkerService.sharedQueue.add("regenerate-sitemap", payload, {
        removeOnComplete: true,
        attempts: 2,
      });
      console.info(
        `[SitemapWorker] Queued sitemap regeneration for ${payload.category || "all"}`,
      );
    }
  }
}

export const sitemapWorkerService = new SitemapWorkerService();

export function setupSitemapQueueListeners() {
  // ENTERPRISE BLUEPRINT WAVE 2:
  // Reactive rebuild model killed to prevent Amplified Read Storms.
  // Sitemap regeneration is now handled via controlled scheduled Cron/Batch jobs.
  console.info(
    "[SitemapWorker] Reactive listeners disabled for SEO/Sitemap. Using scheduled generation instead.",
  );
}
