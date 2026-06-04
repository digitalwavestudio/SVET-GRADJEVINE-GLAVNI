import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuditService, AuditAction } from "../services/audit.service.ts";

/**
 * Pametna Middlewares Integracija - Zod Payload Limiter
 * Spriječava deformisan traffic (prevelika dubina, prekomerni brojevi ključeva).
 * Ujedno služi kao shield za sprečavanje leakage-a i spam-a prema Firebase API key resursima.
 */
const payloadShieldSchema = z.record(z.string(), z.any())
  .refine(
    (data) => {
      // 1. Ograničenje top-level ključeva (sprečavanje Hash Collision DOS napada)
      if (Object.keys(data).length > 200) return false;
      return true;
    },
    { message: "Payload contains too many top-level keys" }
  )
  .refine(
    (data) => {
      // 2. Maksimalna dubina (Depth limit) za prevenciju prototipske polucije i deep-nesting stack overflow napada
      const checkDepth = (obj: any, depth: number): boolean => {
        if (depth > 6) return false; // Strict depth limit
        if (obj && typeof obj === 'object') {
          for (const key in obj) {
            if (!checkDepth(obj[key], depth + 1)) return false;
          }
        }
        return true;
      };
      return checkDepth(data, 0);
    },
    { message: "Payload nesting depth exceeded maximum allowed levels" }
  );

export const zodPayloadLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && typeof req.body === 'object') {
    // 3. Ignorisati stripe webhook-e koji koriste sirovi buffer
    if (req.originalUrl.includes('stripe')) {
      return next();
    }

    try {
      // Skeniranje za Firebase API Key Abuse/Spam (štiti Firebase resurs)
      const stringifiedPayload = JSON.stringify(req.body);
      
      const containsFirebaseSpam = 
        stringifiedPayload.includes('identitytoolkit.googleapis.com') ||
        stringifiedPayload.includes('securetoken.googleapis.com') ||
        (stringifiedPayload.includes('AIzaSy') && !req.originalUrl.includes('/admin')); // Prepoznajemo Firebase API key signaturu u custom payloadu

      if (containsFirebaseSpam) {
        await AuditService.log({
          action: AuditAction.SECURITY_THREAT,
          userId: req.user?.uid || "anonymous",
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          details: { reason: "Malicious payload targeting Firebase API key abuse", url: req.originalUrl }
        });
        return res.status(403).json({ 
          error: "Deformed Traffic Blocked", 
          message: "Odbijeno: Detektovan zabranjen payload pater koji ugrožava Firebase integraciju." 
        });
      }

      // Validacija payload strukture 
      payloadShieldSchema.parse(req.body);

      next();
    } catch (err) {
      await AuditService.log({
        action: AuditAction.SECURITY_THREAT,
        userId: req.user?.uid || "anonymous",
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: "Zod Payload Limiter strukturalna greška (Deep-nesting ili deformisan traffic)" }
      });
      return res.status(400).json({
        error: "Malformed Payload",
        message: "Odbijeno: Vaš zahtev ne zadovoljava sigurnosne standarde strukture."
      });
    }
  } else {
    next();
  }
};
