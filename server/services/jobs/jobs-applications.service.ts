// @ts-nocheck
import { db, admin as firebaseAdmin } from "../../config/firebase.ts";
import { AppError, BadRequestError, NotFoundError } from "../../utils/appError.ts";
import { ApplicationsService } from "../applications.service.ts";
import { Job } from "@svet-gradjevine/shared";

export class JobsApplicationsService {
  static async applyForJob(
    validatedData: any,
    userParams: { uid: string; email: string; name: string },
  ) {
    const { uid, email, name: safeNameFromToken } = userParams;
    const { jobId, coverLetter, phone } = validatedData as { jobId: string; coverLetter?: string; phone?: string; jobTitle?: string; employerId?: string };

    // Delegate to the new unified ApplicationsService
    return await ApplicationsService.submitApplication({
      adId: jobId,
      candidateId: uid,
      coverLetter,
      adTitle: (validatedData as { jobTitle?: string }).jobTitle || "Oglas za posao",
      employerId: (validatedData as { employerId?: string }).employerId,
      candidateName: safeNameFromToken,
      candidateEmail: email,
      phone,
    });
  }

  static async getApplications(jobId: string, uid: string) {
    const jobSnap = await db.collection("listings").doc(jobId).get();
    if (!jobSnap.exists) throw new NotFoundError("Oglas nije pronađen");
    const jobData = jobSnap.data() as Job;
    if (jobData.authorId !== uid) throw new BadRequestError("Nemate dozvolu");

    const snap = await db
      .collection("applications")
      .where("jobId", "==", jobId)
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  static async getUserApplications(uid: string, role: string, limitCount = 15, cursor?: string) {
    const field = role === "applicant" ? "applicantId" : "employerId";
    let q = db.collection("applications")
      .where(field, "==", uid)
      .orderBy("createdAt", "desc");

    if (cursor) {
      const cursorDoc = await db.collection("applications").doc(cursor).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    const snap = await q.limit(limitCount).get();
    const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const lastVisibleId = docs.length === limitCount ? docs[docs.length - 1].id : null;
    return {
      applications: docs,
      lastVisibleId,
      nextPageToken: lastVisibleId,
      hasMore: docs.length === limitCount
    };
  }

  static async updateApplicationStatus(
    appId: string,
    status: string,
    uid: string,
  ) {
    const appRef = db.collection("applications").doc(appId);
    const snap = await appRef.get();
    if (!snap.exists) throw new NotFoundError("Prijava nije pronađena");

    const appData = snap.data()!;
    if (appData.employerId !== uid && appData.applicantId !== uid) {
      throw new BadRequestError("Nemate dozvolu");
    }

    await appRef.update({
      status,
      updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }

  static async checkIfAlreadyApplied(jobId: string, uid: string) {
    const snap = await db
      .collection("applications")
      .doc(`${jobId}_${uid}`)
      .get();
    return { applied: snap.exists };
  }
}
