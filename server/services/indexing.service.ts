import { GoogleIndexingService } from "./google-indexing.service.ts";
import { env } from "../config/env.ts";
import { Logger, logger } from "../utils/logger.ts";

export class IndexingService {
  private static INDEXNOW_KEY =
    env.INDEXNOW_KEY || "svetgradjevine-default-key";
  private static INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

  /** Pushes URL updates to major search engines in real-time. */
  static async pushToIndex(url: string, action: "URL_UPDATED" | "URL_DELETED") {
    logger.debug(`[IndexingService] Pushing to indexers: ${url} (${action})`);

    // Fire and forget, we don't want to block
    Promise.allSettled([
      this.notifyGoogle(url, action),
      this.notifyIndexNow(url),
    ]).catch((err) => {
      console.error("[IndexingService] Failed to notify indexers", err);
    });
  }

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
        console.error(
          `[IndexingService] IndexNow failed with status ${res.status}`
        );
      } else {
        logger.debug(`[IndexingService] IndexNow notification sent for ${url}`);
      }
    } catch (e) {
      console.error("[IndexingService] Error calling IndexNow:", e);
    }
  }

  private static async notifyGoogle(
    url: string,
    action: "URL_UPDATED" | "URL_DELETED"
  ) {
    try {
      await GoogleIndexingService.ping(url, action);
    } catch (e) {
      console.error(
        "[IndexingService] Error within unified Google Indexing delegate:",
        e
      );
    }
  }
}
