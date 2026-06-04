// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import { getRedis, getRawRedis } from "../utils/redis.ts";
import { db } from "../config/firebase.ts";
import { FieldValue } from "firebase-admin/firestore";
import { Logger } from "../utils/logger.ts";
import { LockManager } from "./lock.service.ts";
import { v4 as uuidv4 } from "uuid";
import { Worker, Job } from "bullmq";
import { QueueService, JobType } from "./queue.service.ts";
import { defaultConnection } from "../utils/queue.ts";
import { RegionService } from "./region.service.ts";

const logger = new Logger({ module: "ChatBufferService" });

/**
 * Enterprise Redis Buffered Chat Architecture.
 * Buffers incoming chat messages into Redis to avoid Write-Amplification on Firestore
 * during spikes of thousands of messages per second.
 */
export class ChatBufferService {
  private static STREAM_KEY = "chat:buffer:stream";
  private static CONSUMER_GROUP = "chat_flusher_group";
  private static CONSUMER_NAME = `flusher_${Math.random().toString(36).substring(7)}`;
  private static BATCH_SIZE = 250;
  private static INTERVAL_MS = 60000;
  private static worker: Worker | null = null;

  public static async init() {
    const redis = getRedis();
    if (!redis) {
      logger.warn("Redis not available. Chat buffering will degrade to direct writes.");
      return;
    }

    logger.info("🚀 ChatBufferService initializing...");

    try {
      await redis.xgroup("CREATE", this.STREAM_KEY, this.CONSUMER_GROUP, "0", "MKSTREAM");
      logger.info(`[ChatBuffer] Redis Stream group [${this.CONSUMER_GROUP}] connected.`);
    } catch (err: any) {
      if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) {
        logger.error(`Error creating ChatBuffer Redis group: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (defaultConnection) {
      logger.info(`[ChatBuffer] Starting worker on queue: chat (Host: ${defaultConnection.host})`);
      this.worker = new Worker(
        "chat",
        async (job: Job) => {
          if (job.name === JobType.CHAT_BUFFER_CRON) {
            await this.flushBufferToFirestore();
          }
        },
        {
          connection: {
          host: process.env.REDIS_HOST || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost'),
          port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : (process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || '6379') : 6379),
          password: process.env.REDIS_PASSWORD || (process.env.REDIS_URL ? new URL(process.env.REDIS_URL).password : undefined) || undefined,
          maxRetriesPerRequest: null
        },
          concurrency: 1,
          lockDuration: 300000, // 5 minutes default
          lockRenewTime: 30000,  // Proactive auto-renew every 30s
        }
      );

      if (RegionService.isLeaderRegion()) {
        await QueueService.addJob(
          JobType.CHAT_BUFFER_CRON,
          {},
          {
            jobId: "cron:chat_batch_flusher",
            repeat: { every: this.INTERVAL_MS },
          }
        );
      }
    }
  }

  /**
   * Fast ingestion path for new messages. Returns <1ms.
   */
  public static async enqueueMessage(chatId: string, senderId: string, content: string, type: string, offerData: any | null, partnerId: string) {
    const redis = getRedis();
    const msgId = uuidv4();
    const timestamp = Date.now();
    
    if (!redis) {
      return this.directSyncWrite(chatId, senderId, content, type, offerData, partnerId, msgId);
    }
    
    const payload = JSON.stringify({
        msgId,
        chatId,
        senderId,
        content,
        type,
        offerData,
        partnerId,
        timestamp
    });

    await redis.xadd(this.STREAM_KEY, "*", "payload", payload);
    return msgId;
  }

  private static async directSyncWrite(chatId: string, senderId: string, content: string, type: string, offerData: any | null, partnerId: string, msgId: string) {
    const batch = db.batch();
    const convRef = db.collection("conversations").doc(chatId);
    const msgRef = convRef.collection("messages").doc(msgId);
    
    batch.set(msgRef, {
      senderId,
      text: content,
      type,
      offerData,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
      participants: [senderId, partnerId].filter(Boolean),
    });

    if (partnerId) {
      batch.update(convRef, {
        lastMessage: type === "offer" ? "🧩 Ponuda poslata" : content,
        lastMessageAt: FieldValue.serverTimestamp(),
        lastSenderId: senderId,
        updatedAt: FieldValue.serverTimestamp(),
        [`unreadCount.${partnerId}`]: FieldValue.increment(1)
      });
      const partnerProfileRef = db.collection("users").doc(partnerId);
      batch.set(partnerProfileRef, { "totalUnreadMessages": FieldValue.increment(1) }, { merge: true });
    }
    
    await batch.commit();
    return msgId;
  }

  private static async flushBufferToFirestore() {
    const lockKey = "lock:chat_buffer_flusher";
    const redis = getRedis();
    if (!redis) return;

    let lockId = null;
    try {
      lockId = await LockManager.acquire(lockKey, this.INTERVAL_MS * 2);
      if (!lockId) return;

      const results = await redis.xreadgroup(
        "GROUP", this.CONSUMER_GROUP, this.CONSUMER_NAME,
        "COUNT", this.BATCH_SIZE,
        "STREAMS", this.STREAM_KEY, ">"
      ) as [string, [string, string[]][]][] | null;

      if (!results || results.length === 0 || results[0][1].length === 0) return;

      const streamData = results[0][1];
      const batch = db.batch();
      let operationsCount = 0;
      
      interface ConvBatchUpdate {
        lastMessage: string;
        lastMessageAt: Date;
        lastSenderId: string;
        updatedAt: Date;
        partnerId: string;
      }
      const convUpdates = new Map<string, ConvBatchUpdate>();
      const userUnreads = new Map<string, number>();

      for (const [streamId, fields] of streamData) {
        if (operationsCount >= 400) break;

        let payloadStr = "";
        for (let i = 0; i < fields.length; i += 2) {
          if (fields[i] === "payload") payloadStr = fields[i + 1];
        }

        if (!payloadStr) {
           await redis.xack(this.STREAM_KEY, this.CONSUMER_GROUP, streamId);
           continue;
        }

        const msg: {
          msgId: string;
          chatId: string;
          senderId: string;
          content: string;
          type: string;
          offerData: any | null;
          partnerId: string;
          timestamp: number;
        } = JSON.parse(payloadStr);
        const { msgId, chatId, senderId, content, type, offerData, partnerId, timestamp } = msg;

        const convRef = db.collection("conversations").doc(chatId);
        const msgRef = convRef.collection("messages").doc(msgId);
        
        batch.set(msgRef, {
            senderId,
            text: content,
            type,
            offerData: offerData || null,
            createdAt: new Date(timestamp),
            read: false,
            participants: [senderId, partnerId].filter(Boolean),
        });
        operationsCount++;

        convUpdates.set(chatId, {
            lastMessage: type === "offer" ? "🧩 Ponuda poslata" : content,
            lastMessageAt: new Date(timestamp),
            lastSenderId: senderId,
            updatedAt: new Date(timestamp),
            partnerId,
        });

        if (partnerId) {
            userUnreads.set(partnerId, (userUnreads.get(partnerId) || 0) + 1);
        }
      }
      
      for (const [chatId, updateData] of convUpdates.entries()) {
          if (operationsCount >= 450) break;
          const convRef = db.collection("conversations").doc(chatId);
          batch.update(convRef, {
              lastMessage: updateData.lastMessage,
              lastMessageAt: updateData.lastMessageAt,
              lastSenderId: updateData.lastSenderId,
              updatedAt: updateData.updatedAt,
              [`unreadCount.${updateData.partnerId}`]: FieldValue.increment(userUnreads.get(updateData.partnerId) || 0)
          });
          operationsCount++;
      }

      for (const [userId, count] of userUnreads.entries()) {
          if (operationsCount >= 480) break;
          const partnerProfileRef = db.collection("users").doc(userId);
          batch.set(partnerProfileRef, { "totalUnreadMessages": FieldValue.increment(count) }, { merge: true });
          operationsCount++;
      }

      if (operationsCount > 0) {
          await batch.commit();
          const streamIdsToAck = streamData.map((s: [string, string[]]) => s[0]);
          await redis.xack(this.STREAM_KEY, this.CONSUMER_GROUP, ...streamIdsToAck);
          logger.info(`[ChatBufferFlusher] Batch-flushed ${streamIdsToAck.length} chat messages.`);
      }

    } catch (e: any) {
      logger.error(`[ChatBufferFlusher] Batch flush error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      if (lockId) await LockManager.release(lockKey, lockId);
    }
  }

  public static async gracefulShutdown() {
    if (this.worker) {
      await this.worker.close();
      logger.info("[ChatBufferService] Worker shut down.");
    }
  }
}
