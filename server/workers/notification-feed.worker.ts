import { db } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { Logger } from "../utils/logger.ts";
import { getRedis } from "../utils/redis.ts";

export class NotificationFeedWorker {
  private static logger = new Logger({ service: "NotificationFeedWorker" });

  static start() {
    this.logger.info("Initializing Notification Feed Worker (runs every 15 minutes via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        const cronPattern = process.env.NODE_ENV === "production" ? "*/15 * * * *" : "0 */12 * * *";
        SystemCron.register("notification_feed_coalesce_cron", { pattern: cronPattern }, async () => {
          await this.processNotificationFeeds();
        }).catch(err => this.logger.error("Failed to register Notification Feed cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static async processNotificationFeeds() {
    if (process.env.NODE_ENV !== "production") return;
    const redis = getRedis();
    if (!redis) {
      this.logger.info("Redis not configured. Skipping background notification feed updates.");
      return;
    }

    try {
      // Query active notification users tracked in Redis
      const users: string[] = await redis.smembers("active_notification_users");
      if (users.length === 0) {
        this.logger.info("No active notification users tracked in Redis yet.");
        return;
      }

      this.logger.info(`Refreshing notification feed for ${users.length} active users.`);

      // Process users in chunks of 10 to avoid sequential N+1 query latency
      const chunkSize = 10;
      for (let i = 0; i < users.length; i += chunkSize) {
        const chunk = users.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map(async (uid) => {
            try {
              const [snap, countSnap] = await Promise.all([
                db
                  .collection("activities")
                  .where("userId", "==", uid)
                  .orderBy("createdAt", "desc")
                  .limit(20)
                  .get(),
                db
                  .collection("activities")
                  .where("userId", "==", uid)
                  .where("read", "==", false)
                  .count()
                  .get(),
              ]);

              const activities = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              const unreadCount = countSnap.data().count;

              const payloadState = {
                activities,
                unreadCount,
                lastUpdated: Date.now(),
              };

              const cacheKey = `notifications_payload_${uid}`;
              await CacheService.set(cacheKey, payloadState, 24 * 60 * 60 * 1000); // long TTL since worker will refresh it

              // Sync unread count flag in Redis
              const statusVal = unreadCount === 0 ? "0" : "1";
              await CacheService.set(`notifications_pending_count:${uid}`, statusVal, 30 * 24 * 60 * 60 * 1000).catch((e: any) => console.warn("[NotificationFeed] Set pending count flag:", e?.message));
            } catch (err: any) {
              this.logger.warn(`Failed to execute notification refresh for ${uid}: ${err.message || err}`);
            }
          })
        );
      }

      this.logger.info("Finished Notification Feed Coalesce background refresh cycle.");
    } catch (e: any) {
      this.logger.error("Critical error in processNotificationFeeds helper", e);
    }
  }
}
