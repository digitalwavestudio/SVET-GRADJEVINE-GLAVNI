import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { Logger } from "../utils/logger.ts";
import { MetricsService } from "../services/metrics.service.ts";

export function setupStatsSubscriber() {
  const logger = new Logger({ service: "StatsSubscriber" });

  // APPLICATION_SUBMITTED -> Uvećaj prijave
  eventBus.on(
    DomainEvents.APPLICATION_SUBMITTED,
    async (payload) => {
      try {
        const { employerId } = payload;
        await MetricsService.recordEvent("inquiry", "user_stats", employerId, employerId);
      } catch (e) {
        logger.error(`Failed to increment stats for payload`, e);
      }
    }
  );

  // AD_VIEWED -> Uvećaj preglede
  eventBus.on(
    DomainEvents.AD_VIEWED,
    async (payload) => {
       try {
        const { authorId } = payload;
        await MetricsService.recordEvent("view", "user_stats", authorId, authorId);
      } catch (e) {
        logger.error(`Failed to increment view stats for payload`, e);
      }
    }
  );
}
