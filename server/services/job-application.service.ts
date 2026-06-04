// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { z } from "zod";
import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { DomainEvents } from "../events/event-bus.ts";

export const applyJobContractSchema = z.object({
  jobId: z.string().min(1, "ID oglasa je obavezan"),
  jobTitle: z.string().min(1, "Naslov oglasa je obavezan"),
  employerId: z.string().min(1, "ID poslodavca je obavezan"),
  coverLetter: z.string().optional(),
  applicantPhone: z.string().optional()
});

export type ApplyJobPayload = z.infer<typeof applyJobContractSchema>;

export class JobApplicationService {
  /**
   * Zod validirani Atomic Outbox Servis koji prima zahteve za prijavu i
   * koristi db.batch() iz Firebase Admin SDK-a.
   */
  static async applyForJobAtomic(
    payload: ApplyJobPayload,
    user: { uid: string; email: string; name: string }
  ) {
    const batch = db.batch();

    const applicationId = `japp_${payload.jobId}_${user.uid}_${Date.now()}`;
    const applicationRef = db.collection("job_applications").doc(applicationId);
    const outboxRef = db.collection("outbox").doc();

    const timestamp = firebaseAdmin.firestore.FieldValue.serverTimestamp();

    // 1. Upis same prijave (atomic)
    batch.set(applicationRef, {
      ...payload,
      applicantId: user.uid,
      applicantEmail: user.email,
      applicantName: user.name,
      status: "pending",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // 2. Upis Outbox queue event-a (atomic)
    batch.set(outboxRef, {
      type: "JOB_APPLICATION_RECEIVED",
      payload: {
        applicationId,
        jobId: payload.jobId,
        jobTitle: payload.jobTitle,
        employerId: payload.employerId,
        applicantId: user.uid,
        applicantName: user.name,
        applicantEmail: user.email,
      },
      status: "pending",
      attempts: 0,
      createdAt: timestamp,
      correlationId: user.uid,
      version: 1,
    });

    await batch.commit();

    return { success: true, applicationId };
  }
}
