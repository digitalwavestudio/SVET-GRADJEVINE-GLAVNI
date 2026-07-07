import { db } from "../config/firebase.ts";
import { FieldValue } from "firebase-admin/firestore";

const TRENDS_COLLECTION = "user_stats";
const TRENDS_SUBCOLLECTION = "private";
const TRENDS_DOC = "trends";

export class TrendTracker {
  static async recordView(authorId: string, count: number = 1) {
    if (!authorId) return;
    await this.increment(authorId, "pregledi", count);
  }

  static async recordApplication(employerId: string, count: number = 1) {
    if (!employerId) return;
    await this.increment(employerId, "prijave", count);
  }

  private static async increment(uid: string, field: "pregledi" | "prijave", count: number) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const ref = db.doc(`${TRENDS_COLLECTION}/${uid}/${TRENDS_SUBCOLLECTION}/${TRENDS_DOC}`);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists) {
          const dotPath = `trend.${today}.${field}`;
          tx.update(ref, { [dotPath]: FieldValue.increment(count) });
        } else {
          tx.set(ref, { trend: { [today]: { [field]: count } } });
        }
      });
    } catch (err) {
      console.warn(`[TrendTracker] Failed to record ${field} for ${uid}:`, (err as Error).message);
    }
  }
}
