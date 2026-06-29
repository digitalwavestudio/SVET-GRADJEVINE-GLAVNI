import { setupActivitySubscriber } from "../subscribers/activity.subscriber.ts";
import { initPaymentSubscriber } from "../subscribers/payment.subscriber.ts";
import { setupNotificationSubscriber } from "../subscribers/notification.subscriber.ts";
import { initializeImageSubscribers } from "../subscribers/image.subscriber.ts";
import { setupSeoSubscriber } from "../subscribers/seo.subscriber.ts";
import { setupIndexingSubscriber } from "../subscribers/indexing.subscriber.ts";
import { setupBotAnalyticsSubscriber } from "../subscribers/bot-analytics.subscriber.ts";
import { setupSitemapQueueListeners } from "../services/sitemap.worker.ts";
import { setupStatsSubscriber } from "../subscribers/stats.subscriber.ts";
import { setupMediaSubscriber } from "../subscribers/media.subscriber.ts";
import { setupRfqSubscriber } from "../subscribers/rfq.subscriber.ts";
import { DashboardService } from "../services/dashboard.service.ts";
import { DashboardPrewarmService } from "../services/dashboard-prewarm.service.ts";

export function initializeEventSubscribers() {
  setupActivitySubscriber();
  initPaymentSubscriber();
  setupNotificationSubscriber();
  initializeImageSubscribers();
  setupSeoSubscriber();
  setupIndexingSubscriber();
  setupBotAnalyticsSubscriber();
  setupSitemapQueueListeners();
  setupStatsSubscriber();
  setupMediaSubscriber();
  setupRfqSubscriber();
  
  // Register dashboard cache eviction pub/sub
  DashboardService.registerPubSubEviction();

  // Start background cache pre-warming for premium users
  DashboardPrewarmService.startScheduler();
  
  console.info("[Events] All systemic subscribers initialized.");
}
