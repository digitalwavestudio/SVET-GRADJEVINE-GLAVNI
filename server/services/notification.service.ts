import { admin, db } from "../config/firebase.ts";
import { emailService } from "./emailService.ts";
import { Logger } from "../utils/logger.ts";
import { SSEService } from "./sse.service.ts";
import { CacheService } from "./cache.service.ts";

export enum NotificationType {
  SYSTEM = "system",
  AD_STATUS = "ad_status",
  VERIFICATION = "verification",
  PAYMENT = "payment",
  JOB_APPLICATION = "job_application",
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  sendEmail?: boolean;
}

export class NotificationService {
  private static logger = new Logger({ service: "NotificationService" });

  /**
   * Main entry point for sending a notification.
   * Handles both in-app activity storage and external email dispatch.
   */
  static async send(payload: NotificationPayload) {
    try {
      this.logger.info(
        `Sending notification to ${payload.userId}: ${payload.title}`,
      );

      // Deduplication key (30 seconds)
      const dedupKey = `dedup:notif:${payload.userId}:${payload.type}:${payload.title.replace(/\s+/g, "_")}`;
      if (await CacheService.get<boolean>(dedupKey)) {
        this.logger.info(`Duplicate notification bypassed for user ${payload.userId}`);
        return { success: true, bypassed: true };
      }

      const activityPayload = {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Check if user has active SSE connection
      const isActive = SSEService.hasActiveConnection(payload.userId);
      if (isActive) {
        this.logger.info(`User ${payload.userId} has active SSE connection. Publishing through SSE channel instead of direct DB write.`);
        await SSEService.publish(payload.userId, "notification", {
          ...activityPayload,
          createdAt: new Date().toISOString()
        });
      } else {
        const activityRef = db.collection("activities").doc();
        await activityRef.set({
          id: activityRef.id,
          ...activityPayload
        });
      }

      // Add to deduplication cache
      await CacheService.set(dedupKey, true, 30000);

      // Invalidate cache
      await CacheService.delete(`notifications_payload_${payload.userId}`);
      await CacheService.set(`notifications_pending_count:${payload.userId}`, "1", 30 * 24 * 60 * 60 * 1000).catch((e: any) => console.warn("[NotificationService] Cache set pending count:", e));

      // 2. Send External Email if requested
      const { UsersService } = await import("./users.service.ts");
      const userData = await UsersService.getUserById(payload.userId);

      if (payload.sendEmail && userData?.email) {
        await this.dispatchEmail(userData.email, payload, userData);
      }

      // 3. Send Push Notification via FCM
      if (
        userData?.fcmTokens &&
        Array.isArray(userData.fcmTokens) &&
        userData.fcmTokens.length > 0
      ) {
        await this.sendPushNotification(userData.fcmTokens, payload);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send notification:`, error);
      // We don't throw here to avoid breaking the caller (saga/worker),
      // but in production we might want specific retry logic.
    }
  }

  private static async sendPushNotification(
    tokens: string[],
    payload: NotificationPayload,
  ) {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: {
          type: payload.type,
          ...Object.fromEntries(
            Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)]),
          ),
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });

        if (failedTokens.length > 0) {
          // Cleanup stale tokens
          await db
            .collection("users")
            .doc(payload.userId)
            .update({
              fcmTokens: admin.firestore.FieldValue.arrayRemove(
                ...failedTokens,
              ),
            });
        }
      }
    } catch (e) {
      this.logger.error("Push notification failed", e);
    }
  }

  private static async dispatchEmail(
    email: string,
    payload: NotificationPayload,
    userData: any,
  ) {
    const userName = userData.displayName || "Korisnik";

    switch (payload.type) {
      case NotificationType.VERIFICATION:
        if (payload.data?.status === "approved") {
          await emailService.sendVerificationApprovedNotification(
            email,
            userName,
          );
        }
        break;

      case NotificationType.AD_STATUS:
        if (payload.data?.status === "active") {
          await emailService.sendAdApprovedNotification(
            email,
            payload.data.adTitle || "Vaš oglas",
          );
        } else if (payload.data?.status === "rejected") {
          await emailService.sendAdRejectedNotification(
            email,
            payload.data.adTitle || "Vaš oglas",
            payload.data.reason || "Neispunjava uslove",
          );
        }
        break;

      case NotificationType.JOB_APPLICATION:
        await emailService.sendJobApplicationNotification(
          email,
          payload.data?.jobTitle || "",
          payload.data?.candidateName || "Novi kandidat",
        );
        break;

      default:
        // Generic email for other types if needed
        await emailService.sendEmail({
          to: email,
          subject: payload.title,
          html: `<p>${payload.message}</p>`,
        });
    }
  }
}
