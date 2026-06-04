import { db, admin } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { LockManager } from "../services/lock.service.ts";
import { MagazineAiWriterService } from "../services/magazine-ai-writer.service.ts";
import { MagazineCrudService } from "../services/magazine/magazine-crud.service.ts";
import { NotificationService, NotificationType } from "../services/notification.service.ts";
import { ArticleStatus } from "../../src/types/magazine.ts";
import { Logger } from "../utils/logger.ts";

export class AutonomousEditorialWorker {
  private static logger = new Logger({ service: "AutonomousEditorialWorker" });
  private static interval: NodeJS.Timeout | null = null;
  private static checkIntervalMs = 10 * 60 * 1000; // Check every 10 minutes

  static start() {
    this.logger.info("Initializing Autonomous Editorial Worker (via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        // Runs Every Tuesday at 03:00 AM
        SystemCron.register("autonomous_editorial_cron", { pattern: "0 3 * * 2" }, async () => {
          await this.runTask();
        }).catch(err => this.logger.error("Failed to register Autonomous Editorial cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));

    this.logger.info("Autonomous Editorial Worker successfully loaded.");
  }

  static stop() {
    this.logger.info("Autonomous Editorial Worker stopped.");
  }

  /**
   * Slot checker for Cron execution: Every Tuesday at 03:00 AM (local node time)
   */
  private static async checkAndTriggerScheduledPost() {
    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 2 is Tuesday
    const hour = now.getHours();

    // Check if it's Tuesday between 03:00 and 03:30
    if (day === 2 && hour === 3) {
      const todayDateStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
      const executionKey = `editorial_ran_day_${todayDateStr}`;

      // Check key to guarantee execution once per Tuesday slot
      const alreadyRan = await CacheService.get<boolean>(executionKey);
      if (alreadyRan) return;

      this.logger.info("Autonomous Tuesday 03:00 AM slot matched. Initializing task...");
      await CacheService.set(executionKey, true, 24 * 60 * 60 * 1000); // mark as executed today

      await this.runTask();
    }
  }

  /**
   * Safe execution task wrap with concurrent lock checker
   */
  static async runTask() {
    if (process.env.NODE_ENV !== "production") return;
    const lockKey = "autonomous_editorial_task";
    // Acquire a distributed execution block for 10 minutes
    const lockId = await LockManager.acquire(lockKey, 10 * 60 * 1000);
    if (!lockId) {
      this.logger.info("Autonomous editorial execution locked by another node cluster. Skipping duplicate job.");
      return;
    }

    try {
      this.logger.info("Acquired Redis Lock. Running Auto-Agent Editorial Generation Pipeline...");

      // A. Pull metrics and generate optimized structural article draft
      const result = await MagazineAiWriterService.generateAutonomousArticle({});
      if (!result || !result.success) {
        throw new Error("Editorial Multi-Agent Pipeline could not produce draft article");
      }

      const { article, audit } = result;

      // Ensure slug compatibility
      const targetSlug = article.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");

      const articlePayload = {
        title: article.title,
        slug: targetSlug,
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        tags: article.tags,
        status: ArticleStatus.DRAFT,
        readTimeEstimate: Math.max(3, Math.ceil(article.content.split(/\s+/).length / 180)),
        featuredImage: "",
        gallery: [],
        author: "AI Autopilot",
        seo: {
          title: article.seoTitle,
          description: article.metaDescription,
          keywords: article.tags
        }
      };

      // B. Save to Database securely without direct client queries (Server Side only)
      const newArticleId = await MagazineCrudService.createArticle(articlePayload);
      this.logger.info(`Draft Article registered in Firebase with ID: ${newArticleId}`);

      // C. Safe Notification Dispatch to Admin
      await this.notifyAdmins(newArticleId, article.title, audit?.score ?? 100);

    } catch (err: unknown) {
      this.logger.error("Failed to run autonomous editorial task:", err);
    } finally {
      await LockManager.release(lockKey, lockId);
      this.logger.info("Released Redis lock.");
    }
  }

  /**
   * Helper to fetch administrators and dispatch both in-app and email notifications
   */
  private static async notifyAdmins(articleId: string, articleTitle: string, score: number) {
    try {
      const adminsSnap = await db.collection("users").where("role", "==", "admin").limit(5).get();
      if (adminsSnap.empty) {
        this.logger.warn("No administrative users found to notify about new AI draft.");
        return;
      }

      this.logger.info(`Notifying ${adminsSnap.size} admins of new AI draft article: "${articleTitle}"`);

      for (const adminDoc of adminsSnap.docs) {
        await NotificationService.send({
          userId: adminDoc.id,
          type: NotificationType.SYSTEM,
          title: "✍️ Novi AI Članak Spreman za Odobrenje",
          message: `Digitalni Autopilot je uspešno generisao novi stručni članak na platformi! Naslov: "${articleTitle}" (SEO Score: ${score}/100). Pregledajte i odobrite u CMS-u.`,
          data: {
            articleId,
            seoScore: score,
            action: "/admin/magazine"
          },
          sendEmail: true
        });
      }
    } catch (err: unknown) {
      this.logger.error("Failed to notify administrators:", err);
    }
  }
}
