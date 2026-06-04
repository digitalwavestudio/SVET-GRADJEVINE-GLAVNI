import { admin as firebaseAdmin, db } from "../config/firebase.ts";
import { CacheService } from "../services/cache.service.ts";

export interface OutboxPayload {
  type: string;
  payload: Record<string, unknown>;
  status: "pending" | "processed" | "failed";
  attempts: number;
  createdAt: FirebaseFirestore.FieldValue | Date;
  correlationId: string;
  version: number;
  shardNum: number;
  [key: string]: unknown;
}

export class DomainEventPublisher {
  /**
   * Publishes an event to the Outbox collection within a Firestore transaction or batch.
   */
  static publish(
    transactionOrBatch: FirebaseFirestore.Transaction | FirebaseFirestore.WriteBatch,
    type: string,
    payload: Record<string, unknown>,
    correlationId: string,
    version: number = 1
  ): { outboxDocId: string; outboxPayload: OutboxPayload } {
    const outboxRef = db.collection("outbox").doc();
    const outboxPayloadObj: OutboxPayload = {
      type,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      correlationId,
      version,
      shardNum: Math.floor(Math.random() * 10),
    };
    
    // Type-safe set operation
    if (transactionOrBatch instanceof firebaseAdmin.firestore.Transaction) {
      transactionOrBatch.set(outboxRef, outboxPayloadObj);
    } else {
      (transactionOrBatch as FirebaseFirestore.WriteBatch).set(outboxRef, outboxPayloadObj);
    }

    CacheService.set("outbox_has_pending", true, 30 * 60 * 1000).catch(() => {});
    
    import("./redis.ts").then(({ getRedis }) => {
      const redis = getRedis();
      if (redis) {
        redis.incr("metrics:outbox_stats:pending").catch(() => {});
      }
    }).catch(() => {});
    
    return {
      outboxDocId: outboxRef.id,
      outboxPayload: outboxPayloadObj,
    };
  }

  /**
   * Pushes an event to BullMQ if the transaction committed.
   */
  static async pushToQueue(id: string, payload: OutboxPayload) {
    try {
      const { QueueService, JobType, JobPriority } = await import("../services/queue.service.ts");
      await QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id, ...payload },
        {
          jobId: `outbox:${id}`,
          priority: JobPriority.HIGH,
        }
      );
    } catch (err: unknown) {
      const error = err as Error;
      console.error("DomainEventPublisher: Queue immediate push failed, fallback to scavenger.", error.message);
    }
  }
}
