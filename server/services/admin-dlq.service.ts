import { db } from "../config/firebase.ts";
import { QueueService, JobPriority } from "./queue.service.ts";
import { admin as firebaseAdmin } from "../config/firebase.ts";

export interface DlqItem {
  id: string;
  source: string;
  queue?: string;
  jobType: string;
  payload: any;
  status: string;
  metadata?: {
    finishedAt?: string | Date;
  };
  createdAt?: string | Date | firebaseAdmin.firestore.Timestamp;
  error?: string;
  attemptsMade?: number;
}

export class AdminDlqService {
  static async getDlqItems(limitCount: number): Promise<DlqItem[]> {
    const dlqSnap = await db
      .collection("dlq")
      .where("status", "==", "pending_review")
      .orderBy("metadata.finishedAt", "desc")
      .limit(limitCount)
      .get();

    const dlqItems: DlqItem[] = dlqSnap.docs.map((doc) => ({
      id: doc.id,
      source: "bullmq",
      ...(doc.data() as Omit<DlqItem, "id" | "source">),
    }));

    const outboxSnap = await db
      .collection("outbox")
      .where("status", "==", "dlq")
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    const outboxItems: DlqItem[] = outboxSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        source: "outbox",
        queue: "outbox",
        jobType: data.type,
        error: data.lastError || "Unknown outbox error",
        attemptsMade: data.attempts,
        payload: data.payload,
        createdAt: data.createdAt,
        status: "dlq",
      };
    });

    const allItems = [...dlqItems, ...outboxItems].sort((a, b) => {
      const timeA = (a.metadata?.finishedAt || a.createdAt);
      const timeB = (b.metadata?.finishedAt || b.createdAt);
      
      const getMillis = (t: any) => {
        if (!t) return 0;
        if (t instanceof Date) return t.getTime();
        if (typeof t === "string") return new Date(t).getTime();
        if (t.seconds) return t.seconds * 1000;
        return 0;
      };

      return getMillis(timeB) - getMillis(timeA);
    });

    return allItems.slice(0, limitCount);
  }

  static async retryDlqItem(id: string, source: string): Promise<{ success: boolean; message?: string, jobType: string }> {
    if (source === "outbox") {
      const outboxRef = db.collection("outbox").doc(id);
      const outboxSnap = await outboxRef.get();
      if (!outboxSnap.exists) throw new Error("Item not found in Outbox");

      const data = outboxSnap.data();
      await outboxRef.update({
        status: "pending",
        attempts: 0,
        lastError: null,
        updatedAt: new Date(),
      });
      return { success: true, message: "Outbox item reset to pending", jobType: data?.type || "unknown" };
    }

    const docRef = db.collection("dlq").doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new Error("Item not found in DLQ");
    }

    const data = docSnap.data()!;
    if (data.status !== "pending_review") {
      throw new Error("Item already processed");
    }

    await QueueService.addJob(data.jobType, data.payload, {
      priority: JobPriority.HIGH,
      jobId: `retry_${data.jobId}_${Date.now()}`,
    });

    await docRef.update({
      status: "retried",
      retriedAt: new Date().toISOString(),
    });
    
    return { success: true, jobType: data.jobType };
  }

  static async retryDlqBulk(): Promise<number> {
    let retriedCount = 0;

    const dlqSnap = await db
      .collection("dlq")
      .where("status", "==", "pending_review")
      .limit(100)
      .get();
      
    if (!dlqSnap.empty) {
      const batch = db.batch();
      for (const doc of dlqSnap.docs) {
        const data = doc.data();
        await QueueService.addJob(data.jobType, data.payload, {
          priority: JobPriority.HIGH,
          jobId: `retry_bulk_${data.jobId}_${Date.now()}`,
        });
        batch.update(doc.ref, {
          status: "retried",
          retriedAt: new Date().toISOString(),
        });
        retriedCount++;
      }
      await batch.commit();
    }

    const outboxSnap = await db
      .collection("outbox")
      .where("status", "==", "dlq")
      .limit(100)
      .get();
      
    if (!outboxSnap.empty) {
      const batch2 = db.batch();
      for (const doc of outboxSnap.docs) {
        batch2.update(doc.ref, {
          status: "pending",
          attempts: 0,
          lastError: null,
          updatedAt: new Date(),
        });
        retriedCount++;
      }
      await batch2.commit();
    }

    return retriedCount;
  }
}
