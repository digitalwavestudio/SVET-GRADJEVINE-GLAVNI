import { db, admin } from "../config/firebase.ts";
import { getRedis } from "../utils/redis.ts";
import { LockManager } from "./lock.service.ts";
import { Logger } from "../utils/logger.ts";

const logger = new Logger({ module: "MessagePresenceBuffer" });

export interface ConversationUpdatePayload {
  lastMessage: string;
  lastSenderId: string;
  partnerId?: string;
  timestamp: number;
}

export class MessagePresenceBuffer {
  private static intervalId: NodeJS.Timeout | null = null;
  private static hashKey = "chat:conversations:buffer";

  /**
   * Buffers conversation updates to Redis to prevent write amplification.
   */
  static async bufferConversationUpdate(chatId: string, updateData: {
    lastMessage: string;
    lastSenderId: string;
    partnerId?: string;
  }) {
    const redis = getRedis();
    const now = Date.now();

    if (!redis) {
      // Graceful fallback to direct write if Redis is unavailable
      try {
        const convRef = db.collection("conversations").doc(chatId);
        const updateObj: Record<string, any> = {
          lastMessage: updateData.lastMessage,
          lastSenderId: updateData.lastSenderId,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (updateData.partnerId) {
          updateObj[`unreadCount.${updateData.partnerId}`] = admin.firestore.FieldValue.increment(1);
          const partnerProfileRef = db.collection("users").doc(updateData.partnerId);
          const batch = db.batch();
          batch.update(convRef, updateObj);
          batch.set(partnerProfileRef, { "totalUnreadMessages": admin.firestore.FieldValue.increment(1) }, { merge: true });
          await batch.commit();
        } else {
          await convRef.update(updateObj);
        }
      } catch (err) {
        logger.error(`[MessagePresenceBuffer] Fallback update failed for ${chatId}:`, err);
      }
      return;
    }

    const payload: ConversationUpdatePayload = {
      lastMessage: updateData.lastMessage,
      lastSenderId: updateData.lastSenderId,
      partnerId: updateData.partnerId || "",
      timestamp: now
    };

    // Storing the updates in a hash in Redis. Latest update per chatId wins.
    await redis.hset(this.hashKey, chatId, JSON.stringify(payload));
  }

  /**
   * Periodically flushes buffered conversation updates to Firestore.
   */
  static async flushPendingConversationUpdates(): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    const lockKey = "lock:conversations_flush";
    const lockId = await LockManager.acquire(lockKey, 60000); // 1 minute lock to avoid overlaps
    if (!lockId) return;

    try {
      const allBuffered = await redis.hgetall(this.hashKey);
      if (!allBuffered || Object.keys(allBuffered).length === 0) {
        return;
      }

      const entries = Object.entries(allBuffered);
      const chunkSize = 200; // Small safe chunks for transactional batches

      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const batch = db.batch();
        const processedChatIds: string[] = [];
        const userUnreadsMap = new Map<string, number>();

        for (const [chatId, rawData] of chunk) {
          try {
            const { lastMessage, lastSenderId, partnerId, timestamp } = JSON.parse(rawData) as ConversationUpdatePayload;
            const date = new Date(timestamp);

            const convRef = db.collection("conversations").doc(chatId);
            const updateObj: Record<string, any> = {
              lastMessage,
              lastSenderId,
              lastMessageAt: date,
              updatedAt: date
            };

            if (partnerId) {
              updateObj[`unreadCount.${partnerId}`] = admin.firestore.FieldValue.increment(1);
              userUnreadsMap.set(partnerId, (userUnreadsMap.get(partnerId) || 0) + 1);
            }

            batch.update(convRef, updateObj);
            processedChatIds.push(chatId);
          } catch (e) {
            logger.error(`[MessagePresenceBuffer] Failed to parse buffer for chat ${chatId}:`, e);
          }
        }

        // Apply partner aggregated unread messages count directly
        for (const [userId, count] of userUnreadsMap.entries()) {
          const partnerProfileRef = db.collection("users").doc(userId);
          batch.set(partnerProfileRef, { "totalUnreadMessages": admin.firestore.FieldValue.increment(count) }, { merge: true });
        }

        if (processedChatIds.length > 0) {
          await batch.commit();
          await redis.hdel(this.hashKey, ...processedChatIds).catch((err) => {
            logger.error(`[MessagePresenceBuffer] Failed to clear flushed chat IDs from buffer:`, err);
          });
        }
      }

      logger.info(`[MessagePresenceBuffer] Flushed conversation updates for ${entries.length} chats successfully.`);
    } catch (error) {
      logger.error("[MessagePresenceBuffer] Exception in flusher:", error);
    } finally {
      await LockManager.release(lockKey, lockId);
    }
  }

  static init() {
    if (process.env.NODE_ENV === "production") {
      if (!this.intervalId) {
        // Scheduled flushing of conversation updates every 1 minute (60 * 1000 = 60000 ms)
        this.intervalId = setInterval(() => this.flushPendingConversationUpdates(), 60000);
        logger.info("[MessagePresenceBuffer] Initialized periodic 1-minute flusher for conversation updates.");
      }
    }
  }

  static shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Automatically start when loaded
MessagePresenceBuffer.init();
