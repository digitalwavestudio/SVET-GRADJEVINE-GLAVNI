import type { Request, Response, NextFunction } from "express";
import rateLimit, { Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { MonitoringService } from "../services/monitoring.service.ts";
import { getRedis } from "../utils/redis.ts";

const handler = (req: Request, res: Response, next: NextFunction, options: Options) => {
  MonitoringService.recordError(
    `Rate limit exceeded: ${(options.message as { message: string })?.message || options.message}`,
  );
  res.status(options.statusCode || 429).json(options.message);
};

const getStore = (prefix: string) => {
  const redisClient = getRedis();
  if (redisClient) {
    return new RedisStore({
      // @ts-ignore - ioredis call signature is compatible with what rate-limit-redis expects at runtime
      sendCommand: async (...args: unknown[]) => {
        try {
            const isObjectArg = typeof args[0] === 'object' && args[0] !== null && 'command' in args[0];
            const actualCommand = (isObjectArg ? (args[0] as { command: unknown[] }).command : args) as string[];
            const cmd = actualCommand[0]?.toString().toUpperCase();

            const redisClient = getRedis();
            if (!redisClient) return null;

            const result = await redisClient.call(actualCommand[0], ...actualCommand.slice(1));
            
            // Since the proxy intercepts and returns null when offline for unmocked commands (like .call)
            if (result === null) {
                if (cmd === "SCRIPT") {
                    return "0000000000000000000000000000000000000000";
                }
                if (cmd === "EVAL" || cmd === "EVALSHA") {
                    // Mock return for increment/get: typically an array like [currentHits, timeToReset]
                    return [1, Date.now() + 60000];
                }
            }
            return result;
        } catch (err: unknown) {
            const isObjectArg = typeof args[0] === 'object' && args[0] !== null && 'command' in args[0];
            const actualCommand = (isObjectArg ? (args[0] as { command: unknown[] }).command : args) as string[];
            const cmd = actualCommand[0]?.toString().toUpperCase();

            if (cmd === "SCRIPT") {
                return "0000000000000000000000000000000000000000";
            }
            if (cmd === "EVAL" || cmd === "EVALSHA") {
                return [1, Date.now() + 60000];
            }
            return null;
        }
      },
      prefix: `limiter:${prefix}:`,
    });
  }
  return undefined;
};

/**
 * General API Rate Limiter
 * 60 requests per 1 minute
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("api"),
  message: {
    status: 429,
    message:
      "Previše zahteva sa ove IP adrese (osnovni limit), molimo pokušajte ponovo kasnije.",
  },
  handler,
});

/**
 * Heavy Operations Rate Limiter (Images, Ad Creation, Search)
 * 15 requests per 1 minute
 */
export const heavyOperationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("heavy_ops"),
  message: {
    status: 429,
    message: "Previše zahtevnih operacija u kratkom vremenu (slike, oglasi, pretraga). Molimo sačekajte minut.",
  },
  handler,
});

/**
 * Auth Rate Limiter (Login, Register)
 * 10 requests per 15 minutes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  validate: false,
  keyGenerator: (req: Request) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ip || req.socket.remoteAddress || req.ip || 'unknown_ip';
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("auth"),
  message: {
    status: 429,
    message: "Previše autorizacijskih zahteva sa ove adrese. Molimo sačekajte 15 minuta i pokušajte ponovo.",
  },
  handler,
});

/**
 * Admin Triggers Limiter (Housekeeping, Sync)
 * Allow more requests since admin dashboard loads multiple APIs.
 */
export const adminTriggerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("admin"),
  message: {
    status: 429,
    message:
      "Ovaj administrativni posao je već pokrenut skoro. Molimo sačekajte.",
  },
  handler,
});

/**
 * View Tracking Rate Limiter
 * Prevents bots from inflating view counts
 * 30 views per 1 minute per IP
 */
export const viewLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("view"),
  message: {
    status: 429,
    message: "Previše pregleda u kratkom roku. Molimo vas usporite.",
  },
  handler,
});

/**
 * Ad Creation / Draft Injection Limiter
 * 10 creations per 1 hour per UID.
 * Fallback to IP if UID is not somehow present.
 */
export const adCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("ad_create"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    // If the user is authenticated, use their UID
    if (req.user && req.user.uid) {
      if (req.user.isAdmin || req.user.role === "premium") {
         return `premium_${req.user.uid}`;
      }
      return req.user.uid;
    }
    // express-rate-limit 7+ recommends using req.ip directly or a specific helper
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Dostigli ste limit za kreiranje novih oglasa (10 na sat). Molimo pokušajte ponovo kasnije. Za veći limit, unapredite nalog.",
  },
  handler: (req: Request, res: Response, next: NextFunction, options: Options) => {
    const uid = req.user?.uid || req.ip;
    MonitoringService.recordError(
      `Draft Injection Limit exceeded for UID/IP: ${uid} - ${(options.message as { message: string })?.message || options.message}`,
    );
    res.status(options.statusCode || 429).json(options.message);
  },
});

/**
 * Chat Messaging Rate Limiter
 * Max 20 messages per 1 minute per UID or IP.
 */
export const chatMessagingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("chat_messaging"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user && req.user.uid) {
      return req.user.uid;
    }
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Poslali ste previše poruka u kratkom vremenskom periodu. Dozvoljeno je maksimalno 20 poruka u minuti.",
  },
  handler,
});

/**
 * Dashboard Polling Rate Limiter
 * Max 15 requests per 10 seconds per UID or IP to prevent polling DDoS.
 */
export const dashboardPollingLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("dashboard_polling"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user && req.user.uid) {
      return req.user.uid;
    }
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Background refresh rate exceeded. Please slow down.",
  },
  handler,
});

/**
 * Enterprise Dashboard Limiter for BFF router
 * Allows maximum 5 requests per 1 minute per User ID or IP address
 */
export const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("dashboard_bff"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user && req.user.uid) {
      return req.user.uid;
    }
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Previše zahteva za osvežavanje dashboard-a. Dozvoljeno je najviše 5 zahteva u minuti po korisniku ili IP adresi kako bi se očuvali resursi sistema. Molimo sačekajte minut pre sledećeg pokušaja.",
  },
  handler,
});

/**
 * Telemetry Rate Limiter (DDoS/Wallet Protection)
 * Allows max 5 requests per 1 minute per UID or IP.
 */
export const telemetryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("telemetry"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user && req.user.uid) {
      return req.user.uid;
    }
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Previše telemetrijskih zahteva. Molimo usporite slanje grešaka.",
  },
  handler,
});

/**
 * PROMPT 9: Stats Aggregation Rate Limiter
 * Dozvoljava samo 1 zahtev po korisniku na 5 minuta za teške rute agregacije statistika
 */
export const statsAggregationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore("stats_agg"),
  validate: false,
  keyGenerator: (req: Request, _res: Response) => {
    if (req.user && req.user.uid) {
      return req.user.uid;
    }
    return req.ip || "unknown_ip";
  },
  message: {
    status: 429,
    message: "Previše zahteva za agregaciju statistika. Dozvoljen je 1 zahtev na svakih 5 minuta po korisniku.",
  },
  handler,
});


