import { admin as firebaseAdmin, db, admin } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { AppError, BadRequestError } from "../utils/appError.ts";
import { AuditService, AuditAction } from "./audit.service.ts";
import { DomainEvents } from "../events/event-bus.ts";
import { DomainEventPublisher } from "../utils/DomainEventPublisher.ts";
import { handleFirestoreError } from "../utils/error-handler.ts";

export interface VerificationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  documentUrls: string[];
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

export class VerificationService {
  private static logger = new Logger({ service: "VerificationService" });

  /**
   * Submits a new verification request for a user.
   */
  static async submitRequest(userId: string, documentUrls: string[]) {
    if (!documentUrls || documentUrls.length === 0) {
      throw new BadRequestError(
        "Morate priložiti dokumentaciju za verifikaciju.",
      );
    }

    try {
      return await db.runTransaction(async (transaction) => {
        const userRef = db.collection("users").doc(userId);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new BadRequestError("Korisnik nije pronađen.");
        }

        const userData = userSnap.data()!;

        // Check if there is already a pending request using the correct transaction boundary
        const pendingQuery = db
          .collection("verification_requests")
          .where("userId", "==", userId)
          .where("status", "==", "pending")
          .limit(1);

        const existingSnap = await transaction.get(pendingQuery);

        if (!existingSnap.empty) {
          throw new BadRequestError(
            "Već imate zahtev za verifikaciju na čekanju.",
          );
        }

        const requestId = db.collection("verification_requests").doc().id;
        const requestData: VerificationRequest = {
          id: requestId,
          userId,
          userEmail: userData.email || "",
          userName:
            userData.displayName || userData.businessProfile?.name || "Korisnik",
          userRole: userData.role || "standard",
          documentUrls,
          status: "pending",
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.set(
          db.collection("verification_requests").doc(requestId),
          requestData,
        );

        // Create a support ticket/notification for admins
        const ticketId = db.collection("support_tickets").doc().id;
        transaction.set(db.collection("support_tickets").doc(ticketId), {
          id: ticketId,
          userId: "system",
          subject: `ZAHTEV ZA VERIFIKACIJU: ${requestData.userName}`,
          message: `Korisnik ${requestData.userEmail} je podneo zahtev za verifikaciju profila (Plava Kvačica).`,
          category: "verification",
          priority: "high",
          status: "open",
          metadata: {
            requestId: requestId,
            userId: userId,
          },
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });

        return { requestId };
      });
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof AppError) {
        throw error;
      }
      handleFirestoreError(error as Error, "write", "verification_requests", userId);
    }
  }

  /**
   * Processes a verification request (Approve/Reject).
   */
  static async processRequest(
    requestId: string,
    adminId: string,
    action: "approve" | "reject",
    comment?: string,
  ) {
    try {
      const result = await db.runTransaction(async (transaction) => {
        const requestRef = db.collection("verification_requests").doc(requestId);
        
        // Move ticketQuery read to the top of the transaction block
        const ticketQuery = db
          .collection("support_tickets")
          .where("metadata.requestId", "==", requestId)
          .where("status", "==", "open")
          .limit(1);

        const [requestSnap, ticketsSnap] = await Promise.all([
          transaction.get(requestRef),
          transaction.get(ticketQuery),
        ]);

        if (!requestSnap.exists) {
          throw new BadRequestError("Zahtev za verifikaciju nije pronađen.");
        }

        const requestData = requestSnap.data() as VerificationRequest;
        if (requestData.status !== "pending") {
          throw new BadRequestError(
            `Zahtev je već procesuiran (Status: ${requestData.status}).`,
          );
        }

        const userRef = db.collection("users").doc(requestData.userId);
        const updateRequest = {
          status: action === "approve" ? "approved" : "rejected",
          adminComment: comment || "",
          processedBy: adminId,
          updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        };

        transaction.update(requestRef, updateRequest);

        let outboxResult: { outboxDocId: string; outboxPayload: Record<string, unknown> } | null = null;
        if (action === "approve") {
          // Grant Blue Checkmark
          transaction.update(userRef, {
            isVerified: true,
            verificationType: "blue_check",
            verifiedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          });

          // Add verification badge to all active listings via Faza 4.3 Fan-Out
          outboxResult = DomainEventPublisher.publish(
            transaction,
            "FAN_OUT_PROFILE_UPDATE",
            { userId: requestData.userId },
            requestData.userId
          );
        }

        if (!ticketsSnap.empty) {
          transaction.update(
            db.collection("support_tickets").doc(ticketsSnap.docs[0].id),
            {
              status: "closed",
              resolution:
                action === "approve"
                  ? "Odobrena verifikacija"
                  : "Odbijena verifikacija",
              updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            },
          );
        }

        // Audit Log
        await AuditService.logAction(
          adminId,
          action === "approve"
            ? AuditAction.USER_VERIFIED
            : AuditAction.USER_REJECTED,
          "verification_requests",
          requestId,
          { userId: requestData.userId, comment },
        );

        return { success: true, requestId, ...outboxResult };
      });

      if (result && result.outboxDocId && result.outboxPayload) {
        import("./cache.service.ts").then(({ CacheService }) => {
          CacheService.set("outbox_tasks_has_pending", true, 60 * 60 * 1000).catch(console.error);
        });
        import("./queue.service.ts").then(
          ({ QueueService, JobType, JobPriority }) => {
            QueueService.addJob(
              JobType.OUTBOX_PROCESS,
              { id: result.outboxDocId, ...result.outboxPayload },
              {
                jobId: `outbox:${result.outboxDocId}`,
                priority: JobPriority.HIGH,
              },
            ).catch((err) =>
              console.error(
                "Queue immediate push failed for verification",
                err.message,
              ),
            );
          },
        );
      }

      return result;
    } catch (error: unknown) {
      if (error instanceof BadRequestError || error instanceof AppError) {
        throw error;
      }
      handleFirestoreError(error as Error, "write", `verification_requests/${requestId}`, adminId);
    }
  }

  static async getRequests(status?: string, limit: number = 50) {
    try {
      let q = db
        .collection("verification_requests")
        .orderBy("createdAt", "desc")
        .limit(limit);
      if (status) {
        q = q.where("status", "==", status);
      }
      const snap = await q.get();
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error: unknown) {
      handleFirestoreError(error as Error, "list", "verification_requests");
    }
  }
}
