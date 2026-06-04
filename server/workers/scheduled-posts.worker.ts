import { db, admin } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { ArticleStatus } from "../../src/types/magazine.ts";
import { Logger } from "../utils/logger.ts";

export class ScheduledPostsWorker {
  private static logger = new Logger({ service: "ScheduledPostsWorker" });
  private static interval: NodeJS.Timeout | null = null;

  static start() {
    this.logger.info("Initializing Scheduled Posts Worker (runs every 10 minutes via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        const cronPattern = process.env.NODE_ENV === "production" ? "*/10 * * * *" : "0 */12 * * *";
        SystemCron.register("scheduled_posts_cron", { pattern: cronPattern }, async () => {
          await this.processScheduledPosts();
        }).catch(err => this.logger.error("Failed to register Scheduled Posts cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static stop() {
    // Handled natively by SystemCron
  }

  static async processScheduledPosts() {
    if (process.env.NODE_ENV !== "production") return;
    const now = new Date();
    
    // Fetch articles with status 'scheduled' where scheduledAt <= now
    const snapshot = await db.collection("articles")
      .where("status", "==", ArticleStatus.SCHEDULED)
      .where("scheduledAt", "<=", now)
      .limit(50)
      .get();

    if (snapshot.empty) {
      return;
    }

    this.logger.info(`Found ${snapshot.docs.length} scheduled articles to publish.`);

    const batch = db.batch();
    const slugs: string[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const ref = doc.ref;
      slugs.push(data.slug);

      // 1. Update status to published
      batch.update(ref, {
        status: ArticleStatus.PUBLISHED,
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 2. Put event in Outbox for asynchronous index sync & notifications
      const outboxRef = db.collection("outbox").doc();
      batch.set(outboxRef, {
        type: "ARTICLE_UPDATED",
        payload: { id: doc.id, slug: data.slug, status: ArticleStatus.PUBLISHED },
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        version: "1.0"
      });
    });

    await batch.commit();

    this.logger.info(`Successfully published ${snapshot.docs.length} articles.`);

    // 3. Clear/Invalidate Cache (gazi radijus keša)
    await CacheService.invalidateByPrefix("magazine_list_");
    for (const slug of slugs) {
      if (slug) {
        await CacheService.invalidateByPrefix(`article_slug_${slug}`);
      }
    }

    this.logger.info("Evicted cache for published articles.");
  }
}
