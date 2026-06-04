import { GoogleAuth } from "google-auth-library";
import { Logger } from "../utils/logger.ts";

export class GoogleIndexingService {
  private static authInstance: GoogleAuth | null = null;

  private static getAuthClient(): GoogleAuth | null {
    if (this.authInstance) {
      return this.authInstance;
    }

    const keyPath = process.env.GOOGLE_INDEXING_CREDENTIALS_PATH;
    if (!keyPath) {
      Logger.withContext().warn("[GoogleIndexing] GOOGLE_INDEXING_CREDENTIALS_PATH environment variable is not set. Google Indexing API will skip actual calls (Simulation Fallback Mode).");
      return null;
    }

    try {
      this.authInstance = new GoogleAuth({
        keyFile: keyPath,
        scopes: ["https://www.googleapis.com/auth/indexing"],
      });
      return this.authInstance;
    } catch (err: any) {
      Logger.withContext().error(`[GoogleIndexing] Failed to initialize GoogleAuth client: ${err.message}`);
      return null;
    }
  }

  /**
   * Pings Google Indexing API to notify about URL updates or deletions.
   * This ensures blazing fast index updates for our marketplace.
   */
  static async ping(url: string, type: "URL_UPDATED" | "URL_DELETED") {
    try {
      Logger.withContext().info(`[GoogleIndexing] Pinging ${type} for ${url}`);

      const auth = this.getAuthClient();
      if (!auth) {
        // Fallback simulation for local/dev/preview environments so that indexing events are generated and logged without crash
        await new Promise((resolve) => setTimeout(resolve, 50));
        Logger.withContext().info(
          `[GoogleIndexing] (Simulated) Successfully notified Google about ${url}`,
        );
        return;
      }

      const client = await auth.getClient();
      const response = await client.request({
        url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
        method: "POST",
        data: {
          url,
          type,
        },
      });

      Logger.withContext().info(
        `[GoogleIndexing] Successfully notified Google about ${url}. Response Status: ${response.status}`,
      );
    } catch (err: any) {
      Logger.withContext().error(
        `[GoogleIndexing] Error pinging index API for ${url}: ${err.message}`,
      );
    }
  }
}
