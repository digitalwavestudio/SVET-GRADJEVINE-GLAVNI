import { eventBus, DomainEvents } from "../events/event-bus.ts";
import {
  NotificationService,
  NotificationType,
} from "../services/notification.service.ts";

export function setupNotificationSubscriber() {
  eventBus.on(
    DomainEvents.JOB_APPLICATION_RECEIVED,
    async (payload) => {
      try {
        console.log(`[NotificationSubscriber] JOB_APPLICATION_RECEIVED caught via Outbox:`, payload.applicationId);
        
        // 1. We could use QueueService to enqueue an email task or just call NotificationService
        await NotificationService.send({
          userId: payload.employerId,
          type: NotificationType.JOB_APPLICATION,
          title: "NOVA PRIJAVA NA OGLAS (OUTBOX)",
          message: `Kandidat ${payload.applicantName} se prijavio za oglas "${payload.jobTitle}".`,
          data: { jobTitle: payload.jobTitle, candidateName: payload.applicantName },
          sendEmail: true,
        });

      } catch (error) {
        console.error(
          `[NotificationSubscriber] Failed for JOB_APPLICATION_RECEIVED:`,
          error,
        );
      }
    },
  );

  // 1. User Verified Notification
  eventBus.on(
    DomainEvents.USER_VERIFIED,
    async (payload) => {
      try {
        const { userId } = payload;
        console.log(
          `[NotificationSubscriber] USER_VERIFIED caught for ${userId}`,
        );
        await NotificationService.send({
          userId,
          type: NotificationType.VERIFICATION,
          title: "PROFIL VERIFIKOVAN",
          message: "Vaš profil je uspešno verifikovan. Čestitamo!",
          data: { status: "approved" },
          sendEmail: true,
        });
      } catch (error) {
        console.error(
          `[NotificationSubscriber] Failed for USER_VERIFIED:`,
          error,
        );
      }
    },
  );

  // 2. Ad Status Notifications
  eventBus.on(
    DomainEvents.AD_UPDATED,
    async (payload) => {
      try {
        const { category, id, uid, title, status, reason } = payload;
        if (!uid) return;
        // We only care about status changes that matter to the user
        if (status === "active") {
          await NotificationService.send({
            userId: uid,
            type: NotificationType.AD_STATUS,
            title: "OGLAS ODOBREN",
            message: `Vaš oglas "${title || "Oglas"}" je odobren i sada je vidljiv.`,
            data: { status: "active", adTitle: title, adId: id, category },
            sendEmail: true,
          });
        } else if (status === "rejected") {
          await NotificationService.send({
            userId: uid,
            type: NotificationType.AD_STATUS,
            title: "OGLAS ODBIJEN",
            message: `Nažalost, vaš oglas "${title || "Oglas"}" nije odobren.`,
            data: {
              status: "rejected",
              adTitle: title,
              adId: id,
              category,
              reason,
            },
            sendEmail: true,
          });
        }
      } catch (error) {
        console.error(`[NotificationSubscriber] Failed for AD_UPDATED:`, error);
      }
    },
  );

  // 3. Payment Completed
  eventBus.on(
    DomainEvents.PAYMENT_COMPLETED,
    async (payload) => {
      try {
        const { userId, amount, referenceId: reference } = payload;
        await NotificationService.send({
          userId,
          type: NotificationType.PAYMENT,
          title: "UPLATA PROKNJIŽENA",
          message: `Vaša uplata u iznosu od ${amount} RSD je uspešno procesuirana.`,
          data: { amount, reference },
          sendEmail: true,
        });
      } catch (error) {
        console.error(
          `[NotificationSubscriber] Failed for PAYMENT_COMPLETED:`,
          error,
        );
      }
    },
  );

  // 4. New Job Application (For Employers & Candidates)
  eventBus.on(
    DomainEvents.APPLICATION_SUBMITTED,
    async (payload) => {
      try {
        const { employerId, candidateId, jobTitle, applicantName } = payload;
        // Notify Employer
        await NotificationService.send({
          userId: employerId,
          type: NotificationType.JOB_APPLICATION,
          title: "NOVA PRIJAVA NA OGLAS",
          message: `Kandidat ${applicantName} se prijavio za oglas "${jobTitle}".`,
          data: { jobTitle, applicantName },
          sendEmail: true,
        });

        // Notify Candidate
        if (candidateId) {
          await NotificationService.send({
            userId: candidateId,
            type: NotificationType.SYSTEM,
            title: "PRIJAVA POSLATA",
            message: `Uspešno ste se prijavili za posao "${jobTitle}".`,
            data: { jobTitle },
            sendEmail: false,
          });
        }
      } catch (error) {
        console.error(
          `[NotificationSubscriber] Failed for APPLICATION_SUBMITTED:`,
          error,
        );
      }
    },
  );

  // 5. New Chat Message
  eventBus.on(
    DomainEvents.NEW_CHAT_MESSAGE,
    async (payload) => {
      try {
        const { chatId, senderId, receiverId, messageId } = payload;
        await NotificationService.send({
          userId: receiverId,
          type: NotificationType.SYSTEM,
          title: "NOVA PORUKA",
          message: "Imate novu poruku.",
          data: { chatId, senderId, messageId },
          sendEmail: true,
        });
      } catch (error) {
        console.error(
          `[NotificationSubscriber] Failed for NEW_CHAT_MESSAGE:`,
          error,
        );
      }
    },
  );
}
