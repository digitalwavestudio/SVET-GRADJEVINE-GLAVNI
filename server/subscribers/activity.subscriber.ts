import { eventBus, DomainEvents } from "../events/event-bus.ts";
import crypto from "crypto";
import { db, admin } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";
import { SSEService } from "../services/sse.service.ts";
import { PublicActivityService } from "../services/public-activity.service.ts";

export function setupActivitySubscriber() {
  eventBus.on(
    DomainEvents.AD_CREATED,
    async (payload) => {
      try {
        await PublicActivityService.writeForAdCreated(payload);
      } catch (err) {
        console.error("[PublicActivity] Failed to write for AD_CREATED:", err);
      }
    },
  );
  eventBus.on(
    DomainEvents.APPLICATION_SUBMITTED,
    async (payload) => {
      const {
        applicationId,
        jobId,
        employerId,
        applicantName,
      } = payload;
      try {
        console.info(
          `[EventSubscriber] Sending notification for APPLICATION_SUBMITTED: ${applicationId}`,
        );

        // 1. Deduplication key (60 seconds) to prevent duplicate triggers
        const dedupKey = `dedup:activity:${employerId}:JOB_APPLICATION:${jobId || ""}`;
        if (await CacheService.get<boolean>(dedupKey)) {
          console.info(`[EventSubscriber] Duplicate JOB_APPLICATION bypassed for user ${employerId}`);
          return;
        }

        const message = `${applicantName} je aplicirao/la na vaš oglas.`;
        const activityPayload = {
          userId: employerId,
          type: "JOB_APPLICATION",
          targetId: jobId || "",
          targetType: "jobs",
          title: "Nova prijava za posao",
          message,
          metadata: { applicationId: applicationId || "", candidateName: applicantName },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        };

        // 2. Active Session (SSE) Check - Bypass Firestore write if user holds an active SSE channel
        const isActive = SSEService.hasActiveConnection(employerId);
        if (isActive) {
          console.info(`[EventSubscriber] User ${employerId} has active SSE channel. Publishing notification instead of raw DB write.`);
          await SSEService.publish(employerId, "notification", {
            ...activityPayload,
            createdAt: new Date().toISOString()
          });
        } else {
          const activityId = crypto.randomUUID();
          await db.collection("activities").doc(activityId).set(activityPayload);
        }

        // Set deduplication cache
        await CacheService.set(dedupKey, true, 60000);

        // 3. Cached FCM Token retrieval (10 minutes TTL)
        const fcmTokens = await CacheService.getOrSet<string[]>(
          `fcm_tokens:${employerId}`,
          async () => {
            const userDoc = await db.collection("users").doc(employerId).get();
            if (!userDoc.exists) return [];
            const userData = userDoc.data();
            return (userData?.fcmTokens && Array.isArray(userData.fcmTokens))
              ? userData.fcmTokens.filter((token: any) => typeof token === "string" && token.length > 0)
              : [];
          },
          24 * 60 * 60 * 1000
        );

        if (fcmTokens && fcmTokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            notification: {
              title: "Nova prijava za posao",
              body: message,
            },
            data: {
              url: `/dashboard/applications/${applicationId || ""}`,
            },
          });
        }
      } catch (err) {
        console.error(
          `[EventSubscriber] Notification failed for APPLICATION_SUBMITTED ${applicationId}:`,
          err,
        );
      }
    },
  );

  eventBus.on(
    DomainEvents.AD_CREATED,
    async (payload) => {
      const { category, id, uid, title, userId } = payload; // uid is mapped to userId or uid check
      const safeUid = uid || userId;
      if (!safeUid) return;
      try {
        console.info(
          `[EventSubscriber] Sending notifications for AD_CREATED: ${id}`,
        );

        // 1. Deduplication key (60 seconds)
        const dedupKey = `dedup:activity:${safeUid}:ad_created:${id}`;
        if (await CacheService.get<boolean>(dedupKey)) {
          console.info(`[EventSubscriber] Duplicate AD_CREATED bypassed for user ${safeUid}`);
          return;
        }

        const activityPayload = {
          userId: safeUid,
          type: "ad_created",
          targetId: id,
          targetType: category,
          title: title || "Novi oglas",
          message: `Uspešno ste postavili oglas!`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        };

        // 2. Active Session SSE Check
        const isActive = SSEService.hasActiveConnection(safeUid);
        if (isActive) {
          console.info(`[EventSubscriber] User ${safeUid} has active SSE channel. Publishing notification instead of raw DB write.`);
          await SSEService.publish(safeUid, "notification", {
            ...activityPayload,
            createdAt: new Date().toISOString()
          });
        } else {
          const activityId = crypto.randomUUID();
          await db.collection("activities").doc(activityId).set(activityPayload);
        }

        // Set deduplication cache
        await CacheService.set(dedupKey, true, 60000);

        console.info(
          `[Notification] Ad created notified to user ${safeUid} for ad ${id}`,
        );
      } catch (err) {
        console.error(
          `[EventSubscriber] Notification failed for AD_CREATED ${id}:`,
          err,
        );
      }
    },
  );

  eventBus.on(
    DomainEvents.USER_VERIFIED,
    async (payload) => {
      const { userId } = payload;
      try {
        console.info(
          `[EventSubscriber] Sending notifications for USER_VERIFIED: ${userId}`,
        );

        // 1. Deduplication key (60 seconds)
        const dedupKey = `dedup:activity:${userId}:USER_VERIFIED:constant`;
        if (await CacheService.get<boolean>(dedupKey)) {
          console.info(`[EventSubscriber] Duplicate USER_VERIFIED bypassed for user ${userId}`);
          return;
        }

        const activityPayload = {
          userId,
          type: "USER_VERIFIED",
          title: "Nalog verifikovan",
          message: `Vaš nalog je uspešno verifikovan od strane administratora!`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        };

        // 2. Active Session SSE Check
        const isActive = SSEService.hasActiveConnection(userId);
        if (isActive) {
          console.info(`[EventSubscriber] User ${userId} has active SSE channel. Publishing notification instead of raw DB write.`);
          await SSEService.publish(userId, "notification", {
            ...activityPayload,
            createdAt: new Date().toISOString()
          });
        } else {
          const activityId = crypto.randomUUID();
          await db.collection("activities").doc(activityId).set(activityPayload);
        }

        // Set deduplication cache
        await CacheService.set(dedupKey, true, 60000);

        console.info(
          `[Notification] User verified notified for user ${userId}`,
        );
      } catch (err) {
        console.error(
          `[EventSubscriber] Notification failed for USER_VERIFIED ${userId}:`,
          err,
        );
      }
    },
  );

  eventBus.on(
    DomainEvents.AD_UPDATED,
    async (payload) => {
      try {
        const wasPremium = !!(payload.oldData as any)?.isPremium;
        const isPremiumNow = !!(payload.newData as any)?.isPremium;
        if (!wasPremium && isPremiumNow) {
          await PublicActivityService.writeForAdUpgraded({
            id: payload.id,
            category: payload.category,
            uid: payload.uid,
            title: payload.title,
          });
        }
      } catch (err) {
        console.error("[PublicActivity] Failed to write for AD_UPDATED premium:", err);
      }
    },
  );
}
