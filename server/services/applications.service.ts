import { admin as firebaseAdmin, db } from "../config/firebase.ts";
import { DomainEvents } from "../events/event-bus.ts";
import { AdminStatsService } from "./admin/admin-stats.service.ts";
import { Logger } from "../utils/logger.ts";
import { AppError, BadRequestError, NotFoundError } from "../utils/appError.ts";
import { RateLimiterService } from "./rate-limiter.service.ts";
import { TrendTracker } from "./trend-tracker.service.ts";

export class ApplicationsService {
  private static logger = new Logger({ service: "ApplicationsService" });

  static async submitApplication(data: {
    adId: string;
    candidateId: string;
    coverLetter?: string;
    adTitle: string;
    employerId: string;
    candidateName: string;
    candidateEmail?: string;
    phone?: string;
  }) {
    const {
      adId,
      candidateId,
      coverLetter,
      adTitle,
      employerId,
      candidateName,
      candidateEmail,
      phone,
    } = data;

    // 0. Rate Limiting (1 per 30s, 10 per day)
    const canApply = await RateLimiterService.isAllowed(
      `app:${candidateId}`,
      1,
      30,
    );
    if (!canApply)
      throw new AppError("Sačekajte trenutak pre sledeće prijave.", 429);

    const todayStr = new Date().toISOString().split("T")[0];
    const dailyLimitKey = `app_daily:${candidateId}:${todayStr}`;
    const withinDailyLimit = await RateLimiterService.isAllowed(
      dailyLimitKey,
      15,
      86400,
    ); // 15 per day
    if (!withinDailyLimit)
      throw new AppError("Dostigli ste dnevni limit prijava.", 429);

    return await db.runTransaction(async (transaction) => {
      // 1. Verify Listing exists
      const adRef = db.collection("listings").doc(adId);
      const adSnap = await transaction.get(adRef);
      if (!adSnap.exists) {
        throw new NotFoundError("Oglas više nije dostupan");
      }

      const adData = adSnap.data()!;
      if (adData.status !== "active")
        throw new BadRequestError("Oglas više nije aktivan");

      if (candidateId === employerId || candidateId === adData.authorId) {
        throw new BadRequestError("Ne možete se prijaviti na svoj oglas");
      }

      // Check if already applied (deterministic ID)
      const appId = `${adId}_${candidateId}`;
      const appRef = db.collection("applications").doc(appId);
      const appSnap = await transaction.get(appRef);
      if (appSnap.exists)
        throw new BadRequestError("Već ste se prijavili na ovaj oglas");

      // 2. Register Application
      const applicationData = {
        adId,
        adTitle,
        jobId: adId, // alias for backwards compatibility
        jobTitle: adTitle,
        employerId: employerId || adData.authorId,
        candidateId,
        candidateName,
        candidateEmail: candidateEmail || "",
        coverLetter: coverLetter || "",
        phone: phone || "",
        status: "pending",
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(appRef, applicationData);

      // 3. Increment counters on Listing
      transaction.update(adRef, {
        applicantsCount: firebaseAdmin.firestore.FieldValue.increment(1),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Update Employer Stats
      await AdminStatsService.updateUserStats(
        employerId,
        {
          pendingApplications: 1,
        },
        transaction,
      );

      // 5. Outbox for Notifications (Saga continuation)
      const outboxRef = db.collection("outbox").doc();
      transaction.set(outboxRef, {
        type: DomainEvents.APPLICATION_SUBMITTED,
        payload: {
          employerId,
          candidateId,
          jobId: adId,
          jobTitle: adTitle,
          applicantName: candidateName,
          applicationId: appId,
        },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: candidateId,
        version: 1,
      });

      return { id: appId, employerId };
    });

    // Trend tracking van transakcije
    TrendTracker.recordApplication(employerId).catch(() => {});
    return { id: appId };
  }

  static async updateApplicationStatus(
    applicationId: string,
    status: string,
    uid: string,
    isAdmin?: boolean,
  ) {
    return await db.runTransaction(async (transaction) => {
      const appRef = db.collection("applications").doc(applicationId);
      const appSnap = await transaction.get(appRef);
      if (!appSnap.exists) throw new NotFoundError("Prijava nije pronađena");

      const appData = appSnap.data()!;
      if (appData.employerId !== uid && !isAdmin) {
        throw new AppError(
          "Nemate ovlašćenje da menjate status ove prijave",
          403,
        );
      }

      const oldStatus = appData.status;
      transaction.update(appRef, {
        status,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      // If resolving from pending, decrement pending count for the actual employer
      if (oldStatus === "pending" && status !== "pending") {
        await AdminStatsService.updateUserStats(
          appData.employerId,
          {
            pendingApplications: -1,
          },
          transaction,
        );
      }

      return { success: true };
    });
  }
}
