import { EventEmitter } from "events";
import { getRedis } from "../utils/redis.ts";
import { randomUUID } from "crypto";
import { PaymentSagaContext } from "./payment.types.ts";
import {
  Job,
  RealEstatePlot,
  Company,
  Master,
  MarketplaceItem
} from "@svet-gradjevine/shared";
import { logger } from "../utils/logger.ts";

export type UnifiedAdEntity =
  | Job
  | RealEstatePlot
  | Company
  | Master
  | MarketplaceItem;

export const DomainEvents = {
  JOB_CREATED: "JOB_CREATED",
  JOB_UPDATED: "JOB_UPDATED",
  JOB_DELETED: "JOB_DELETED",
  APPLICATION_SUBMITTED: "APPLICATION_SUBMITTED",
  USER_UPDATED: "USER_UPDATED",
  AD_CREATED: "AD_CREATED",
  AD_UPDATED: "AD_UPDATED",
  AD_DELETED: "AD_DELETED",
  USER_VERIFIED: "USER_VERIFIED",
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
  NEW_CHAT_MESSAGE: "NEW_CHAT_MESSAGE",
  BOT_ANALYTICS: "BOT_ANALYTICS",
  RFQ_CREATED: "RFQ_CREATED",
  JOB_APPLICATION_RECEIVED: "JOB_APPLICATION_RECEIVED",
  AD_VIEWED: "AD_VIEWED",
  MEDIA_UPLOAD_COMPLETED: "MEDIA_UPLOAD_COMPLETED",
  IMAGE_PROCESSED: "IMAGE_PROCESSED",
  SITEMAP_READY: "SITEMAP_READY",
} as const;



export interface EventPayloadMap {
  [DomainEvents.JOB_CREATED]: { jobId: string; jobData?: Partial<Job> };
  [DomainEvents.JOB_UPDATED]: { jobId: string; updates?: Partial<Job>; oldData?: Partial<Job>; newData?: Partial<Job> };
  [DomainEvents.JOB_DELETED]: { jobId: string };
  [DomainEvents.APPLICATION_SUBMITTED]: { applicationId?: string, jobId?: string, applicantId?: string, applicantName: string, employerId: string, candidateId?: string, jobTitle: string };
  [DomainEvents.USER_UPDATED]: { userId: string };
  [DomainEvents.AD_CREATED]: { id: string, category: string, userId?: string, uid?: string, title?: string };
  [DomainEvents.AD_UPDATED]: { id: string, category: string, userId?: string, uid: string, title?: string, status?: string, reason?: string, oldData?: Partial<UnifiedAdEntity>, newData?: Partial<UnifiedAdEntity>, updates?: Partial<UnifiedAdEntity> };
  [DomainEvents.AD_DELETED]: { id: string, category: string, userId?: string, uid?: string };
  [DomainEvents.USER_VERIFIED]: { userId: string };
  [DomainEvents.PAYMENT_COMPLETED]: PaymentSagaContext;
  [DomainEvents.NEW_CHAT_MESSAGE]: { messageId: string, chatId: string, senderId: string, recipientId?: string, receiverId: string };
  [DomainEvents.BOT_ANALYTICS]: { botType: string; botName: string; path: string; userAgent: string; ip: string; status: number; durationMs: number; };
  [DomainEvents.RFQ_CREATED]: { rfqId: string, userId?: string, category: string, regionId: string, phone: string, specification: Array<{ name: string; amount: number | string; unit: string; desc?: string }> };
  [DomainEvents.JOB_APPLICATION_RECEIVED]: { applicationId: string, employerId: string, applicantName: string, jobTitle: string };
  [DomainEvents.AD_VIEWED]: { authorId: string, adId?: string };
  [DomainEvents.MEDIA_UPLOAD_COMPLETED]: { mediaId: string, url: string, type: string };
  [DomainEvents.IMAGE_PROCESSED]: { imageId: string, variant: string };
  [DomainEvents.SITEMAP_READY]: { sitemapUrl: string };
}

export interface IEventBus {
  emit<K extends keyof EventPayloadMap>(type: K, payload: EventPayloadMap[K]): Promise<void>;
  emit(type: string, payload: unknown): Promise<void>;
  on<K extends keyof EventPayloadMap>(type: K, handler: (payload: EventPayloadMap[K]) => Promise<void> | void): void;
  // Intentionally don't provide a general overload that catches everything to string, or if we do, put it last.
  // We can just omit the catch-all `on` or change `type` parameter to string so it doesn't conflict
}


const STREAM_NAME = "app:domain_events_stream";
const GROUP_NAME = "app_service_group";

class EventBus implements IEventBus {
  private static instance: EventBus;
  private localEmitter = new EventEmitter();
  private redis = getRedis();
  private instanceId = randomUUID();
  private consumerName = `node-${this.instanceId}`;
  private isListening = false;

  private constructor() {
    this.initializeStreamGroup().then(() => {
        this.startListening();
    }).catch(err => logger.warn('[EventBus] Init error:', err));
  }

  private async initializeStreamGroup() {
    if (!this.redis) return;
    try {
      // Kreiramo grupu ako ne postoji (MKSTREAM ce napraviti i stream ako ne postoji)
      await this.redis.xgroup("CREATE", STREAM_NAME, GROUP_NAME, "$", "MKSTREAM").catch((err: unknown) => {
        const error = err as Error;
        if (!error.message.includes("BUSYGROUP")) {
            console.error("[EventBus] XGROUP CREATE error", error);
        }
      });
      console.info(`✅ EventBus: Dynamic Group initialized (${GROUP_NAME})`);
    } catch (err) {
      console.error("[EventBus] Stream initialization failed", err);
    }
  }

  private async startListening() {
    if (!this.redis || this.isListening) return;
    this.isListening = true;
    
    console.info(`📡 EventBus: Persistent Stream listening (Consumer: ${this.consumerName})`);

    while (this.isListening) {
        try {
            // Citamo dogadjaje iz grupe. Specifikator ">" znaci "dogadjaji koje ovaj consumer nije primio"
            const results = await (this.redis as { xreadgroup: (...args: unknown[]) => Promise<unknown> }).xreadgroup(
                "GROUP", GROUP_NAME, this.consumerName,
                "COUNT", "10",
                "BLOCK", "5000",
                "STREAMS", STREAM_NAME, ">"
            );

            if (results && Array.isArray(results)) {
                for (const [streamName, messages] of results as [string, [string, string[]][]][]) {
                    if (!Array.isArray(messages)) continue;
                    for (const [id, fields] of messages) {
                        try {
                            // Fields dolaze kao niz [ključ1, vrednost1, ključ2, vrednost2...]
                            const dataMap: Record<string, string> = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                dataMap[fields[i]] = fields[i + 1];
                            }

                            const { type, payload, origin } = dataMap;
                            const parsedPayload = payload ? JSON.parse(payload) : {};

                            // Ako smo mi objavili publish, vec smo ispalili lokalni dogadjaj u emit() f-ji.
                            if (origin !== this.instanceId) {
                                this.localEmitter.emit(type, parsedPayload);
                            }

                            // ACK-ujemo poruku
                            await this.redis.xack(STREAM_NAME, GROUP_NAME, id);
                        } catch (msgErr) {
                            console.error("[EventBus] Message processing error", msgErr);
                        }
                    }
                }
            }
        } catch (err: unknown) {
            const error = err as Error;
            // Ako je error timeout ili slicno, samo nastavljamo, inace logujemo
            if (!error.message.includes("connection") && !error.message.includes("closed")) {
                console.error("[EventBus] stream read error", error);
                await new Promise(r => setTimeout(r, 2000)); // Cool-off
            }
        }
    }
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async emit(type: string, payload: unknown) {
    // 1. Trigger locally
    this.localEmitter.emit(type, payload);

    // 2. Persistent Stream Broadcast
    if (this.redis) {
      try {
        await this.redis.xadd(
          STREAM_NAME,
          "*", // Auto-ID
          "type", type,
          "payload", JSON.stringify(payload),
          "origin", this.instanceId,
          "timestamp", Date.now().toString()
        );
      } catch (err) {
        const error = err as Error;
        console.error("[EventBus] Redis xadd error", error);
      }
    }
  }

  on<T>(type: string, handler: (payload: T) => void | Promise<void>) {
    this.localEmitter.on(type, handler);
  }
}

export const eventBus: IEventBus = EventBus.getInstance();
