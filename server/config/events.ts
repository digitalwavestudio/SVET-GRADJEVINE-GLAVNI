import { setupActivitySubscriber } from "../subscribers/activity.subscriber.ts";
import { initPaymentSubscriber } from "../subscribers/payment.subscriber.ts";
import { setupNotificationSubscriber } from "../subscribers/notification.subscriber.ts";
import { DashboardService } from "../services/dashboard/dashboard.service.ts";

export function initializeEventSubscribers() {
  setupActivitySubscriber();
  initPaymentSubscriber();
  setupNotificationSubscriber();
  
  // Register dashboard cache eviction pub/sub
  DashboardService.registerPubSubEviction();
  
  console.info("[Events] All systemic subscribers initialized.");
}
