import { GoogleAuth } from "google-auth-library";
import { Logger } from "../utils/logger.ts";
import { env } from "../config/env.ts";
import { Worker, Job } from "bullmq";
import { defaultConnection } from "../utils/queue.ts";
import { getRawRedis } from "../utils/redis.ts";
import { JobType } from "./queue.service.ts";

export class GoogleIndexingService {
  private static authInstance: GoogleAuth | null = null;
  private static worker: Worker | null = null;

  // ── IndexNow ──────────────────────────────────────────

  private static INDEXNOW_KEY = env.INDEXNOW_KEY || "svetgradjevine-default-key";
  private static INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

  private static async notifyIndexNow(url: string) {
    try {
      const payload = {
        host: "svetgradjevine.com",
        key: this.INDEXNOW_KEY,
        keyLocation: `https://svetgradjevine.com/${this.INDEXNOW_KEY}.txt`,
        urlList: [url],
      };

      const res = await fetch(this.INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(`[IndexNow] Failed with status ${res.status}`);
      } else {
        Logger.withContext().info(`[IndexNow] Notification sent for ${url}`);
      }
    } catch (e) {
      console.error("[IndexNow] Error calling IndexNow:", e);
    }
  }

  // ── Google Indexing API ───────────────────────────────

  private static getAuthClient(): GoogleAuth | null {
    if (this.authInstance) return this.authInstance;

    const keyPath = env.GOOGLE_INDEXING_CREDENTIALS_PATH;
    if (!keyPath) {
      Logger.withContext().warn("[GoogleIndexing] GOOGLE_INDEXING_CREDENTIALS_PATH not set. Using simulation mode.");
      return null;
    }

    try {
      this.authInstance = new GoogleAuth({
        keyFile: keyPath,
        scopes: ["https://www.googleapis.com/auth/indexing"],
      });
      return this.authInstance;
    } catch (err: any) {
      Logger.withContext().error(`[GoogleIndexing] Failed to init GoogleAuth: ${err.message}`);
      return null;
    }
  }

  private static async ping(url: string, type: "URL_UPDATED" | "URL_DELETED") {
    try {
      Logger.withContext().info(`[GoogleIndexing] Pinging ${type} for ${url}`);

      const auth = this.getAuthClient();
      if (!auth) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        Logger.withContext().info(`[GoogleIndexing] (Simulated) ${url}`);
        return;
      }

      const client = await auth.getClient();
      const response = await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: { url, type },
      });

      Logger.withContext().info(`[GoogleIndexing] Success (${response.status}): ${url}`);
    } catch (err: any) {
      Logger.withContext().error(`[GoogleIndexing] Error for ${url}: ${err.message}`);
    }
  }

  // ── Public API ────────────────────────────────────────

  static async submitUrl(url: string, type: "URL_UPDATED" | "URL_DELETED") {
    Promise.allSettled([
      this.ping(url, type),
      this.notifyIndexNow(url),
    ]).catch((err) => {
      console.error("[GoogleIndexing] submitUrl failed", err);
    });
  }

  static async processQueue() {
    const sharedClient = getRawRedis();
    if (!sharedClient) {
      Logger.withContext().warn("Redis missing. Google Indexing worker skipped.");
      return;
    }

    Logger.withContext().info("Google Indexing worker starting...");

    this.worker = new Worker(
      "google",
      async (job: Job) => {
        if (job.name === JobType.GOOGLE_INDEXING_PING) {
          const { url, type } = job.data as { url: string; type: "URL_UPDATED" | "URL_DELETED" };
          await this.ping(url, type);
        }
      },
      {
        connection: defaultConnection!,
        concurrency: 5,
        lockDuration: 60000,
        lockRenewTime: 15000,
      }
    );

  }

  static async shutdownQueue() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      Logger.withContext().info("Google Indexing worker shut down.");
    }
  }
}
