import { Request, Response } from "express";
import { getRedis, getSubRedis } from "../utils/redis.ts";
import { EventEmitter } from "events";

export interface SSEEvent {
  uid: string;
  type: string;
  payload: Record<string, unknown>;
}

export class SSEService {
  private static events = new EventEmitter();
  private static isSubscribed = false;

  static async init() {
    if (this.isSubscribed) return;
    this.isSubscribed = true;
    
    // Use Redis for cross-instance messaging if available
    // Subscriptions run asynchronously to secure zero-impact startup speed
    const subRedis = getSubRedis();
    if (subRedis) {
      subRedis.subscribe("app_events")
        .then(() => {
          subRedis.on("message", (channel: string, message: string) => {
            if (channel === "app_events") {
              try {
                const data = JSON.parse(message) as SSEEvent;
                this.events.emit(data.uid, data);
              } catch (e) {
                console.error("[SSE] Failed to parse message:", e);
              }
            }
          });
        })
        .catch((err: Error) => {
          const errMsg = err?.message || "";
          if (errMsg.toLowerCase().includes("offlinequeue") || errMsg.toLowerCase().includes("writeable")) {
            console.warn("[SSE] Redis pretplata nije dostupna (koristi se lokalni in-memory fallback).");
          } else {
            console.warn("[SSE] Redis sub failed asynchronously, using local memory fallback", err);
          }
        });
    }
  }

  static async publish(uid: string, eventType: string, payload: Record<string, unknown>) {
    const redis = getRedis();
    
    const event: SSEEvent = { uid, type: eventType, payload };
    const message = JSON.stringify(event);

    // Track active subscriber in Redis to know whose feed needs background worker updates
    if (redis && typeof redis.sadd === "function") {
      try {
        await redis.sadd("active_notification_users", uid);
      } catch (e) {
        console.warn("[SSE] Failed to add user to active_notification_users set:", e);
      }
    }

    if (redis && typeof redis.publish === "function") {
      try {
        await redis.publish("app_events", message);
      } catch (e) {
        // Fallback to local
        this.events.emit(uid, event);
      }
    } else {
      // Local fallback
      this.events.emit(uid, event);
    }
  }

  static subscribe(req: Request, res: Response, uid: string) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Ensure that nginx doesn't buffer server sent events
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendEvent = (data: SSEEvent) => {
      res.write(`event: ${data.type}\ndata: ${JSON.stringify(data.payload)}\n\n`);
    };

    const heartBeat = setInterval(() => {
      res.write(":\n\n");
    }, 15000);

    const onEvent = (data: SSEEvent) => {
      sendEvent(data);
    };

    this.events.on(uid, onEvent);

    req.on("close", () => {
      clearInterval(heartBeat);
      this.events.off(uid, onEvent);
      res.end();
    });
  }

  static hasActiveConnection(uid: string): boolean {
    return this.events.listenerCount(uid) > 0;
  }
}
