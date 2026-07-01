import { db, admin } from "../../config/firebase.ts";

import { transcriptResponseSchema } from "../../dto/admin.dto.ts";

export class AdminModerationService {
  static async getReportTranscript(id: string) {
    const reportSnap = await db.collection("reports").doc(id).get();
    if (!reportSnap.exists) {
      throw new Error("Report not found");
    }

    const report = reportSnap.data()!;
    if (report.targetType !== "conversation" && report.targetType !== "chat") {
      throw new Error("Transcript only available for chat reports");
    }

    const messagesSnap = await db
      .collection("conversations")
      .doc(report.targetId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const result = {
      messages: messagesSnap.docs
        .map((d: admin.firestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }))
        .reverse(),
    };

    return transcriptResponseSchema.parse(result);
  }

  static async resolveReport(id: string, status: string, note: string, resolvedBy: string) {
    await db.collection("reports").doc(id).update({
      status,
      resolutionNote: note,
      resolvedBy,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true };
  }
}
