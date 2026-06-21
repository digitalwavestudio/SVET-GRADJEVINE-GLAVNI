import { Request, Response, NextFunction } from "express";
import { RateLimiterService } from "../services/rate-limiter.service.ts";
import { TraceContext } from "../utils/trace.ts";
import { DynamicConfigService } from "../services/dynamic-config.service.ts";
import { CacheService } from "../services/cache.service.ts";
import { AuditService, AuditAction } from "../services/audit.service.ts";
import { env } from "../config/env.ts";
import crypto from "crypto";
import { logger } from "../utils/logger.ts";

const BAD_BOTS = [
  "semrushbot",
  "mj12bot",
  "dotbot",
  "blexbot",
  "barkrowler",
  "rogerbot",
  "megaindex",
  "seznambot",
  "python-requests",
];

/**
 * Aggressive Global Shield for Bot/DDOS protection.
 * Hits Redis early to prevent expensive ops for blocked IPs.
 */
export const rateLimitShield = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 0. Maintenance Mode Check
    if (
      DynamicConfigService.get("isMaintenanceMode", false) &&
      !req.path.startsWith("/api/admin")
    ) {
      return res
        .status(503)
        .json({
          error: "Service Unavailable",
          message: "Portal is currently under scheduled maintenance.",
        });
    }

    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;

    // Privacy-Safe SHA-256 IP Hashing to prevent reverse engineering using a pepper
    const pepper = env.SECURITY_IP_PEPPER || "g5s9!d@2#ksl19$m82%";
    const hashedIp = crypto.createHash("sha256").update(ipStr + pepper).digest("hex");

    const ua = (req.headers["user-agent"] || "").toLowerCase();

    const isWhitelistedSearchBot = ["googlebot", "bingbot", "algolia", "ahrefsbot"].some((bot) => ua.includes(bot));
    const isWhitelistedAiBot = ["gptbot", "claudebot", "perplexitybot", "applebot-ai", "oai-searchbot"].some((bot) => ua.includes(bot));
    const isWhitelistedBot = isWhitelistedSearchBot || isWhitelistedAiBot;

    // expensivePaths: Sitemaps, Search, P-SEO listing combos, and Feeds
    const isPseoPath = ["/poslovi/", "/masine/", "/gradjevinske-masine/", "/smestaj/", "/ketering/", "/placevi/", "/alat-i-oprema/", "/firme/"].some(p => req.path.startsWith(p));
    const isExpensivePath = 
      req.path.includes("/search") || 
      req.path.includes("/pseo") ||
      req.path.includes("/feed") ||
      req.path.includes("/ads/") ||
      req.path.includes("/masters/") ||
      isPseoPath;

    // 0.1 Bot Shield Enhancement (PROMPT 8)
    if (isExpensivePath) {
      if (!isWhitelistedBot && /bot|crawler|spider|robot|crawling/i.test(ua)) {
        // Aggressive crawler detected that is NOT whitelisted
        await AuditService.log({
          action: AuditAction.SECURITY_THREAT,
          severity: 'medium',
          ip: ipStr,
          userAgent: ua,
          path: req.path,
          details: { type: 'gateway_bot_shield', reason: 'Non-whitelisted bot hitting expensive path' }
        });
        return res.status(429).json({ 
          error: "Too Many Requests", 
          message: "Ova sekcija sajta je zaštićena. Koristite standardni pretraživač." 
        });
      }

      // AI Bots are allowed but we apply a stricter rate limit for expensive paths to prevent "scraping bursts"
      if (isWhitelistedAiBot) {
        const aiBotLimitKey = `shield:ai_bot:${hashedIp}`;
        const isAllowed = await RateLimiterService.isAllowed(aiBotLimitKey, 100, 60); // Max 100 expensive hits per minute for AI bots (was 10 - too restrictive for crawlers)
        if (!isAllowed) {
           return res.status(429).json({ error: "AI Bot rate limit reached for expensive resources." });
        }
      }

      // IP-based throttling for expensive paths regardless of UA
      // Catches crawlers with clean "Mozilla/5.0..." UAs (no bot/crawler/spider keywords)
      if (!isWhitelistedSearchBot) {
        const expensiveIpLimitKey = `shield:expensive_ip:${hashedIp}`;
        const isAllowed = await RateLimiterService.isAllowed(expensiveIpLimitKey, 120, 60);
        if (!isAllowed) {
          return res.status(429).json({
            error: "Too Many Requests",
            message: "Previse zahteva. Pokusajte kasnije."
          });
        }
      }
    }

    // 0.2 Bot-Trap: Block useless SEO/scraping bots early
    if (BAD_BOTS.some((bot) => ua.includes(bot))) {
      await AuditService.log({
        action: AuditAction.SECURITY_THREAT,
        severity: 'low',
        ip: ipStr,
        userAgent: ua,
        path: req.path,
        details: { bot_name: BAD_BOTS.find(b => ua.includes(b)), type: 'bot_behavior' }
      });
      return res.status(403).send("Access denied. Crawler not allowed.");
    }

    // Check if it's a whitelisted bot to skip block limits and try to serve statically
    if (
      isWhitelistedBot &&
      req.method === "GET" &&
      !req.path.startsWith("/api")
    ) {
      // Determine potential cache key based on SEO route logic
      // This allows serving instantly with 0ms DB overhead for verified bots
      const parts = req.path.split("/").filter(Boolean);
      const type = parts[0];
      const id = parts[1];

      const allowedAdTypes = [
        "posao",
        "firma",
        "gradjevinske-masine",
        "smestaj",
        "ketering",
        "placevi",
        "alat-i-oprema",
        "majstor",
        "oglas",
      ];

      if (allowedAdTypes.includes(type) && id) {
        // Construct basic SEO cache key
        const cacheKey = `seo:html:${type}:${id}:::`;
        try {
          const cachedHtml = await CacheService.get<string>(cacheKey);
          if (cachedHtml) {
            res.setHeader("Cache-Control", "public, max-age=3600");
            res.setHeader("X-Cache", "HIT-BOT-EDGE");
            return res.send(cachedHtml);
          }
        } catch (e) { console.error("[RateLimit] Bot cache HIT path error:", e); }
      }

      // If no cache, continue but skip global rate limiting
    }

    // 0.2 Honeypot Check (Anti-Spam Forme)
    if (req.method === "POST") {
      // Invisible field expected to be empty. If filled, it's a spam bot.
      const honeypot = req.body?._honeypot || req.body?.website_url_trap;
      if (honeypot) {
        logger.warn(`[BotTrap] Spam bot caught in honeypot from IP ${ipStr}`);
        await AuditService.log({
          action: AuditAction.SECURITY_THREAT,
          severity: 'high',
          ip: ipStr,
          userAgent: ua,
          path: req.path,
          details: { honeypot_payload: req.body, type: 'honeypot' }
        });
        
        // Enhance the honeypot mechanism to automatically push malicious IPs to blacklist for 24 hours (1 day)
        await RateLimiterService.blockIp(hashedIp, 1);
        return res.status(403).json({ error: "Spam detected." });
      }
    }

    // 1. Check strict ban list (Redis backed) using SHA-256 hashed IP
    if (await RateLimiterService.isBlocked(hashedIp)) {
      return res.status(403).json({
        error: "Access Denied",
        message:
          "Your IP has been flagged for abnormal behavior. Please contact support.",
        traceId: TraceContext.getTraceId(),
      });
    }

    // 2. Global rate limit (Configurable via Admin Dashboard) using SHA-256 hashed IP
    const limitBase = DynamicConfigService.get("globalRateLimit", 1000);
    const botLimitBase = 20000; // Generous limit for known crawlers (AhrefsBot, GPTBot, etc.)

    const isStaticAsset = req.path.startsWith("/assets/") || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|map|txt|xml)$/i);

    if (!isStaticAsset && !req.path.startsWith("/api/admin")) {
      const activeLimit = isWhitelistedBot ? botLimitBase : limitBase;
      const isAllowed = await RateLimiterService.isAllowed(
        `global:${hashedIp}`,
        activeLimit,
        60,
      ); // Default 1000 req per minute global
      if (!isAllowed) {
        await AuditService.log({
          action: AuditAction.SECURITY_THREAT,
          severity: 'medium',
          ip: ipStr,
          userAgent: ua,
          path: req.path,
          details: { limit_base: limitBase, type: 'rate_limit' }
        });
        return res.status(429).json({ error: "Rate limit exceeded" });
      }
    }
  } catch (err) {
    console.error(
      "[RateLimitShield] Error in middleware, skipping for safety:",
      err,
    );
  }

  next();
};
