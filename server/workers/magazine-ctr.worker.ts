import { MagazineCtrService } from "../services/magazine-ctr.service.ts";
import { Logger } from "../utils/logger.ts";

export class MagazineCtrWorker {
  private static logger = new Logger({ service: "MagazineCtrWorker" });
  private static interval: NodeJS.Timeout | null = null;
  private static readonly FLUSH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

  static start() {
    this.logger.info("Initializing high-performance Magazine CTR clickstream flusher (via BullMQ)");

    import("../utils/system-cron.ts")
      .then(({ SystemCron }) => {
        const cronPattern = process.env.NODE_ENV === "production" ? "*/30 * * * *" : "0 */12 * * *";
        SystemCron.register("magazine_ctr_flush_cron", { pattern: cronPattern }, async () => {
          await this.triggerFlush();
        }).catch(err => this.logger.error("Failed to register Magazine CTR cron", err));
      }).catch(err => this.logger.error("Failed to import SystemCron", err));
  }

  static stop() {
    this.logger.info("Magazine CTR background flusher stopped.");
  }

  private static triggerFlush() {
    if (process.env.NODE_ENV !== "production") return;
    MagazineCtrService.flush().catch((err) => {
      this.logger.error("Periodic clickstream CTR flush failed", err);
    });
  }
}
