import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, z } from "zod";
import { db, admin } from "../config/firebase.ts";
import { zodSerbianErrorMap } from "@svet-gradjevine/shared";
import {
  createAdSchema,
  updateAdSchema,
  checkoutSchema,
  reportSchema,
  supportSchema,
  partnerSchema,
  verifyUserSchema,
  masterSearchSchema,
  moderateAdSchema,
  calendarEventSchema,
  viewMetricSchema,
  userProfileSchema,
  presenceSchema,
  updatePackageSchema,
  adminActionSchema,
  migrateProfileSchema,
  machineSchema,
  accommodationSchema,
  cateringSchema,
  realEstateSchema,
  marketplaceSchema,
} from "@svet-gradjevine/shared";

export const submitVerificationSchema = z.object({
  documentUrls: z.array(z.string().url("Neispravna URL adresa dokumenta")).min(1, "Morate poslati najmanje jedan dokument"),
});

export const processVerificationSchema = z.object({
  action: z.enum(["approve", "reject"], {
    message: "Akcija mora biti 'approve' ili 'reject'",
  }),
  comment: z.string().optional(),
});

// Local schemas or shared schemas from routes
const submitApplicationSchema = z.object({
  adId: z.string(),
  coverLetter: z.string().optional(),
  adTitle: z.string(),
  employerId: z.string(),
  candidateName: z.string(),
  candidateEmail: z.string().email().optional(),
  phone: z.string().optional(),
});

export const switchRoleSchema = z.object({
  role: z.enum(['standard', 'majstor', 'poslodavac', 'smestaj', 'ketering', 'placevi', 'masine', 'partner']).optional(),
});


const promoteSchema = z.object({
  entityId: z.string().min(1, "ID entiteta je obavezan"),
  collection: z.enum([
    "jobs",
    "companies",
    "machines",
    "accommodations",
    "marketplace",
    "plots",
    "real_estate",
    "caterings",
  ]),
  durationDays: z.number().int().min(1).max(365),
  packageId: z.string().optional(),
  promoteType: z.enum(["premium", "urgent", "premium_partner"]).default("premium"),
});

const adminFundSchema = z.object({
  targetUserId: z.string().min(1, "ID ciljnog korisnika je obavezan"),
  amount: z.number().int().min(1, "Iznos mora biti veći od nule"),
  description: z.string().min(1, "Opis je obavezan"),
});

const manualDepositSchema = z.object({
  amount: z.number().int().min(1, "Iznos mora biti veći od nule"),
});

const approveDepositSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const adminModerateListingSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  feedback: z.string().optional(),
});

export const adminEditListingSchema = z.object({
  updates: z.record(z.string(), z.unknown()),
});

export const adsSearchSchema = z.object({
  category: z.string().optional(),
  filters: z.any().optional(),
  pageSize: z.coerce.number().int().optional(),
  lastVisibleId: z.any().optional(),
});

// === DYNAMIC HIGH-PERFORMANCE VALIDATION CACHE AND SERIALIZERS ===

class FastValidationCache {
  private cache = new Map<string, { serializedParsed: string; timestamp: number }>();
  private readonly maxLimit = 5000;
  private readonly ttl = 15000; // 15 seconds TTL

  public get(schemaKey: string, bodyJson: string): unknown | null {
    const key = `${schemaKey}:${bodyJson}`;
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    try {
      return JSON.parse(entry.serializedParsed);
    } catch {
      this.cache.delete(key);
      return null;
    }
  }

  public set(schemaKey: string, bodyJson: string, parsedBody: unknown): void {
    const key = `${schemaKey}:${bodyJson}`;
    
    if (this.cache.size >= this.maxLimit) {
      const keysIter = this.cache.keys();
      for (let i = 0; i < 500; i++) {
        const nextKey = keysIter.next().value;
        if (nextKey) this.cache.delete(nextKey);
      }
    }
    
    try {
      this.cache.set(key, {
        serializedParsed: JSON.stringify(parsedBody),
        timestamp: Date.now(),
      });
    } catch {
      // Safe skip if not serializable
    }
  }
}

export const fastValidationCache = new FastValidationCache();

// Key registry mapping schema references to stable string identifiers
export const SCHEMA_KEYS = new Map<ZodSchema, string>([
  [createAdSchema, "createAdSchema"],
  [updateAdSchema, "updateAdSchema"],
  [checkoutSchema, "checkoutSchema"],
  [reportSchema, "reportSchema"],
  [supportSchema, "supportSchema"],
  [partnerSchema, "partnerSchema"],
  [verifyUserSchema, "verifyUserSchema"],
  [masterSearchSchema, "masterSearchSchema"],
  [moderateAdSchema, "moderateAdSchema"],
  [calendarEventSchema, "calendarEventSchema"],
  [viewMetricSchema, "viewMetricSchema"],
  [userProfileSchema, "userProfileSchema"],
  [presenceSchema, "presenceSchema"],
  [updatePackageSchema, "updatePackageSchema"],
  [adminActionSchema, "adminActionSchema"],
  [migrateProfileSchema, "migrateProfileSchema"],
  [submitApplicationSchema, "submitApplicationSchema"],
  [promoteSchema, "promoteSchema"],
  [adminFundSchema, "adminFundSchema"],
  [manualDepositSchema, "manualDepositSchema"],
  [approveDepositSchema, "approveDepositSchema"],
  [submitVerificationSchema, "submitVerificationSchema"],
  [processVerificationSchema, "processVerificationSchema"],
  [adminModerateListingSchema, "adminModerateListingSchema"],
  [adminEditListingSchema, "adminEditListingSchema"],
  [adsSearchSchema, "adsSearchSchema"],
  [switchRoleSchema, "switchRoleSchema"]
]);

export interface MasterSearchDoc {
  id?: string | null;
  name?: string | null;
  role?: string | null;
  city?: string | null;
  category?: string | null;
  createdAt?: string | null;
  phone?: string | null;
  experienceYears?: number | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isPremium?: boolean | null;
}

export interface MasterSearchData {
  docs?: MasterSearchDoc[];
  lastVisibleId?: string | null;
  hasMore?: boolean;
}

export interface CheckoutData {
  id?: string | number;
  success?: boolean;
}

export function precompileMasterSearchSerializer() {
  return function serialize(data: MasterSearchData | null | undefined): string {
    if (!data) return "null";
    const docs = data.docs;
    if (!Array.isArray(docs)) return JSON.stringify(data);

    let docsJson = "[";
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (i > 0) docsJson += ",";
      
      docsJson += `{"id":${JSON.stringify(doc.id ?? null)},"name":${JSON.stringify(doc.name ?? null)},"role":${JSON.stringify(doc.role ?? null)},"city":${JSON.stringify(doc.city ?? null)},"category":${JSON.stringify(doc.category ?? null)},"createdAt":${JSON.stringify(doc.createdAt ?? null)}`;
      
      if (doc.phone !== undefined) docsJson += `,"phone":${JSON.stringify(doc.phone ?? null)}`;
      if (doc.experienceYears !== undefined) docsJson += `,"experienceYears":${JSON.stringify(doc.experienceYears ?? null)}`;
      if (doc.bio !== undefined) docsJson += `,"bio":${JSON.stringify(doc.bio ?? null)}`;
      if (doc.avatarUrl !== undefined) docsJson += `,"avatarUrl":${JSON.stringify(doc.avatarUrl ?? null)}`;
      if (doc.isPremium !== undefined) docsJson += `,"isPremium":${doc.isPremium ? "true" : "false"}`;
      
      docsJson += "}";
    }
    docsJson += "]";

    const lastId = data.lastVisibleId ? `"${data.lastVisibleId}"` : "null";
    const hasMoreStr = data.hasMore ? "true" : "false";
    
    return `{"docs":${docsJson},"lastVisibleId":${lastId},"hasMore":${hasMoreStr}}`;
  };
}

export function precompileCheckoutSerializer() {
  return function serialize(data: CheckoutData | null | undefined): string {
    if (!data) return "null";
    if (data.id === undefined || data.success === undefined) {
      return JSON.stringify(data);
    }
    return `{"id":${JSON.stringify(data.id)},"success":${data.success ? "true" : "false"}}`;
  };
}

const masterSearchSerializer = precompileMasterSearchSerializer();
const checkoutSerializer = precompileCheckoutSerializer();

export function interceptResponseSerialization(res: Response & { __interceptedByFastValidate?: boolean }, schemaKey: string) {
  if (schemaKey !== "masterSearchSchema" && schemaKey !== "checkoutSchema") {
    return;
  }
  if (res.__interceptedByFastValidate) return;
  res.__interceptedByFastValidate = true;

  const originalJson = res.json;
  res.json = function (this: Response, data: unknown) {
    if (schemaKey === "masterSearchSchema" && data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.docs)) {
        res.setHeader("Content-Type", "application/json");
        return res.send(masterSearchSerializer(obj as MasterSearchData));
      }
    } else if (schemaKey === "checkoutSchema" && data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (obj.success !== undefined) {
        if (res.statusCode === 201 || res.statusCode === 200) {
          res.setHeader("Content-Type", "application/json");
          return res.send(checkoutSerializer(obj as CheckoutData));
        }
      }
    }
    return originalJson.call(this, data);
  };
}

export interface LocalizedError {
  field: string;
  message: string;
}

/**
 * Localized Error Parser that formats Zod error issues into friendly, clean dot-notation fields in Serbian
 */
export function formatZodErrorSerbian(error: ZodError): LocalizedError[] {
  return error.issues.map((issue) => {
    // Strip redundant framework markers like 'data' or 'updates' from field paths for direct UX rendering
    const cleanPath = issue.path
      .filter((p) => p !== "data" && p !== "updates")
      .map(String)
      .join(".");

    const rawMessage = issue.message;
    const isGeneric = rawMessage.toLowerCase().includes("invalid") || rawMessage.toLowerCase().includes("expected");
    
    // Explicit Serbian translation fallback using standard shared error map
    const errMap = isGeneric && zodSerbianErrorMap ? zodSerbianErrorMap(issue as any) : undefined;
    const localizedMessage = errMap ? (typeof errMap === 'string' ? errMap : errMap.message) : rawMessage;

    return {
      field: cleanPath || "global",
      message: localizedMessage || "Neispravan unos",
    };
  });
}

async function logToDLQ(error: string, req: Request, details: unknown) {
  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const uid = req.user?.uid || "anonymous";

    await db.collection("dlq").add({
      jobType: "payload_validation_failure",
      status: "pending_review",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      error,
      payload: {
        url: req.originalUrl,
        method: req.method,
        ip: ipStr,
        uid,
        body: req.body || null,
        validationErrors: details,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      }
    });
  } catch (err) {
    console.error("[DLQ] Failed to write payload validation failure to DLQ:", err);
  }
}

/**
 * Dodatna striktna validacija dolaznih podataka (ingress) za specifične vertikale (mašine, smeštaj, ketering, placevi)
 */
interface VerticalAdRequestBody {
  category?: string;
  data?: unknown;
}

async function validateVerticalAdData(schema: ZodSchema, body: unknown) {
  if (schema === createAdSchema || schema === updateAdSchema) {
    if (body && typeof body === "object") {
      const parsedBody = body as VerticalAdRequestBody;
      if (parsedBody.category && parsedBody.data && typeof parsedBody.data === "object") {
        let verticalSchema: ZodSchema | null = null;
        if (parsedBody.category === "machines") {
          verticalSchema = machineSchema;
        } else if (parsedBody.category === "accommodations") {
          verticalSchema = accommodationSchema;
        } else if (parsedBody.category === "caterings") {
          verticalSchema = cateringSchema;
        } else if (parsedBody.category === "plots" || parsedBody.category === "real_estate") {
          verticalSchema = realEstateSchema;
        } else if (parsedBody.category === "marketplace") {
          verticalSchema = marketplaceSchema;
        }

        if (verticalSchema) {
          if (schema === updateAdSchema) {
            await (verticalSchema as unknown as { partial: () => ZodSchema }).partial().parseAsync(parsedBody.data);
          } else {
            await verticalSchema.parseAsync(parsedBody.data);
          }
        }
      }
    }
  }
}

/**
 * Centrally manages validation of manual endpoints with Serbian error localization
 */
export const validateRequest = (schema: ZodSchema) => {
  const schemaKey = SCHEMA_KEYS.get(schema) || "unknown_schema";

  return async (req: Request, res: Response, next: NextFunction) => {
    let bodyString = "";
    try {
      bodyString = req.body && typeof req.body === "object" ? JSON.stringify(req.body) : "";
    } catch {
      bodyString = "";
    }
    
    if (schemaKey !== "unknown_schema" && bodyString) {
      const cached = fastValidationCache.get(schemaKey, bodyString);
      if (cached) {
        req.body = cached;
        return next();
      }
    }

    try {
      req.body = await schema.parseAsync(req.body);
      await validateVerticalAdData(schema, req.body);
      
      if (schemaKey !== "unknown_schema" && bodyString) {
        fastValidationCache.set(schemaKey, bodyString, req.body);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMsg = "Zod validation failed";
        const details = formatZodErrorSerbian(error);
        
        res.status(400).json({
          error: "Payload validacija nije uspela",
          details
        });

        logToDLQ(errorMsg, req, details);
      } else {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const details = [{ field: "global", message: errorMsg }];
        res.status(400).json({
          error: "Payload validacija nije uspela",
          details
        });
        
        logToDLQ(errorMsg, req, details);
      }
    }
  };
};

/**
 * Secure Body Validator preventing unauthorized privilege escalation
 */
export const validateBody = (schema: ZodSchema) => {
  const schemaKey = SCHEMA_KEYS.get(schema) || "unknown_schema";

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const isAdminUser = user?.isAdmin || false;

      if (req.body) {
        const sensitiveFields = ["role", "isAdmin", "userRole", "privilege", "status", "claims"];
        
        if (!isAdminUser) {
          for (const field of sensitiveFields) {
            if (req.body[field] !== undefined) {
              console.warn(`[Privilege Escalation Warning] Non-admin user attempted to send '${field}' field in request.`);
              delete req.body[field];
            }
            if (req.body.data && req.body.data[field] !== undefined) {
              console.warn(`[Privilege Escalation Warning] Non-admin user attempted to send '${field}' in nested data.`);
              delete req.body.data[field];
            }
          }
        }
      }

      let bodyString = "";
      try {
        bodyString = req.body && typeof req.body === "object" ? JSON.stringify(req.body) : "";
      } catch {
        bodyString = "";
      }
      
      if (schemaKey !== "unknown_schema" && bodyString) {
        const cached = fastValidationCache.get(schemaKey, bodyString);
        if (cached) {
          req.body = cached;
          return next();
        }
      }

      req.body = await schema.parseAsync(req.body);
      await validateVerticalAdData(schema, req.body);
      
      if (schemaKey !== "unknown_schema" && bodyString) {
        fastValidationCache.set(schemaKey, bodyString, req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMsg = "Zod strict validation failed";
        const details = formatZodErrorSerbian(error);
        
        res.status(400).json({
          error: "Payload validacija nije uspela",
          details
        });

        logToDLQ(errorMsg, req, details);
      } else {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const details = [{ field: "global", message: errorMsg }];
        res.status(400).json({
          error: "Payload validacija nije uspela",
          details
        });
        
        logToDLQ(errorMsg, req, details);
      }
    }
  };
};

/**
 * Enterprise Automatic Zod Interceptor Middleware for POST/PUT/PATCH bulk-endpoint protection
 */
export const autoValidateMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
    return next();
  }

  // Handle various formats of original and path URLs safely
  const url = req.baseUrl ? `${req.baseUrl}${req.path}` : req.originalUrl || req.path;
  const path = url.split("?")[0];

  let schema: ZodSchema | null = null;

  if (method === "POST") {
    if (path.endsWith("/api/ads/create") || path.endsWith("/ads/create")) {
      schema = createAdSchema;
    } else if (path.endsWith("/api/applications") || path.endsWith("/applications")) {
      schema = submitApplicationSchema;
    } else if (path.endsWith("/api/wallet/promote") || path.endsWith("/wallet/promote")) {
      schema = promoteSchema;
    } else if (path.endsWith("/api/wallet/admin/add-funds") || path.endsWith("/wallet/admin/add-funds")) {
      schema = adminFundSchema;
    } else if (path.endsWith("/api/wallet/deposit/manual") || path.endsWith("/wallet/deposit/manual")) {
      schema = manualDepositSchema;
    } else if (path.match(/\/api\/wallet\/admin\/approve-deposit\/[^/]+$/) || path.match(/\/wallet\/admin\/approve-deposit\/[^/]+$/)) {
      schema = approveDepositSchema;
    } else if (path.endsWith("/api/checkout") || path.endsWith("/checkout")) {
      schema = checkoutSchema;
    } else if (path.endsWith("/api/reports") || path.endsWith("/reports")) {
      schema = reportSchema;
    } else if (path.endsWith("/api/support") || path.endsWith("/support")) {
      schema = supportSchema;
    } else if (path.endsWith("/api/partners") || path.endsWith("/partners")) {
      schema = partnerSchema;
    } else if (path.endsWith("/api/admin/verify-user") || path.endsWith("/admin/verify-user")) {
      schema = verifyUserSchema;
    } else if (path.endsWith("/api/masters/search") || path.endsWith("/masters/search")) {
      schema = masterSearchSchema;
    } else if (path.endsWith("/api/ads/moderate") || path.endsWith("/ads/moderate")) {
      schema = moderateAdSchema;
    } else if (path.match(/\/api\/admin\/moderate\/[^/]+\/[^/]+$/) || path.match(/\/admin\/moderate\/[^/]+\/[^/]+$/)) {
      schema = adminModerateListingSchema;
    } else if (path.endsWith("/api/calendar") || path.endsWith("/calendar")) {
      schema = calendarEventSchema;
    } else if (path.endsWith("/api/metrics/view") || path.endsWith("/metrics/view")) {
      schema = viewMetricSchema;
    } else if (path.endsWith("/api/users/init") || path.endsWith("/users/init")) {
       // initUserSchema is local to users.routes.ts, we should probably move it or use a generic one here
       // for now let's use a passthrough or the admin one
       schema = z.record(z.string(), z.unknown()); 
    } else if (path.endsWith("/api/users/presence") || path.endsWith("/users/presence")) {
      schema = presenceSchema;
    } else if (path.endsWith("/api/users/switch-role") || path.endsWith("/users/switch-role")) {
      schema = switchRoleSchema;
    } else if (path.endsWith("/api/users/packages") || path.endsWith("/users/packages")) {
      schema = updatePackageSchema;
    } else if (path.endsWith("/api/users/profile") || path.endsWith("/users/profile")) {
       schema = migrateProfileSchema;
    } else if (path.endsWith("/api/ads/search") || path.endsWith("/ads/search")) {
      schema = adsSearchSchema;
    }
  } else if (method === "PUT" || method === "PATCH") {
    if (path.match(/\/api\/ads\/[^/]+$/) || path.match(/\/ads\/[^/]+$/)) {
      const isMyAds = path.endsWith("/my-ads") || path.endsWith("/favorites/ids");
      if (!isMyAds) {
        schema = updateAdSchema;
      }
    } else if (path.endsWith("/api/users/profile") || path.endsWith("/users/profile")) {
      schema = userProfileSchema;
    } else if (path.match(/\/api\/users\/[^/]+\/admin-action$/) || path.match(/\/users\/[^/]+\/admin-action$/)) {
      schema = adminActionSchema;
    } else if (path.match(/\/api\/admin\/moderate\/[^/]+\/[^/]+$/) || path.match(/\/admin\/moderate\/[^/]+\/[^/]+$/)) {
      schema = adminEditListingSchema;
    }
  }

  // ENTERPRISE SECURITY FIX: Usklađivanje sa domenom 7 iz sigurnosnog audita.
  // Za sve rute koje NISU registrovane iznad, zabranjujemo payload u potpunosti umesto da se oslanjamo na propusni fallback.
  // Ukoliko programer zaboravi da registruje novu rutu, sistem će automatski odbaciti nepoznati payload.
  if (!schema) {
    if (!path.includes("stripe/webhook") && Object.keys(req.body || {}).length > 0) {
      const errorMsg = `[Enterprise Guard] ZERO_TRUST_VIOLATION: Odbijeno slanje payload-a. API ruta (${method} ${path}) NEMA eksplicitno registrovanu Zod šemu u autoValidateMiddleware.`;
      console.error(errorMsg);
      
      const payloadRef = z.record(z.string(), z.unknown());
      const parsed = payloadRef.safeParse(req.body);
      
      // Provera prototype pollution-a čak i kad odbijamo, da sačuvamo u DLQ zbog logovanja napada
      let hasProtocolHijack = false;
      if (parsed.success) {
        const keys = Object.keys(parsed.data);
        hasProtocolHijack = keys.some((key) => key === "__proto__" || key === "constructor" || key === "prototype");
      }

      logToDLQ("STRICT_MODE_VIOLATION: Nepoznat payload na API ruti bez validatora", req, { path, method, hasProtocolHijack });

      // Ukoliko ruta koristi lokalni validateRequest/validateBody u fajlu rutera,
      // mora se dodati na "exempt" listu ILI registrovati direktno u autoValidateMiddleware.
      
      // EXEMPT LISTA ZA POSTOJEĆE LOKALNE VALIDATORE (Legacy passthrough)
      // Od sada se preporučuje samo autoValidateMiddleware.
      const exemptPrefixes = [
        "/api/jobs/", "/jobs/",
        "/api/messages/", "/messages/",
        "/api/rfq/", "/rfq/",
        "/api/media/", "/media/",
        "/api/magazine/", "/magazine/",
        "/api/telemetry/", "/telemetry/",
        "/api/system/", "/system/",
        "/api/construction/", "/construction/",
        "/api/analytics/", "/analytics/",
        "/api/favorites/", "/favorites/",
        "/api/logs", "/logs",
        "/api/admin/", "/admin/"
      ];

      const isExempt = exemptPrefixes.some(prefix => path.includes(prefix));
      
      if (!isExempt) {
         res.status(403).json({
          error: "Payload validacija odbijena",
          details: [{ field: "global", message: errorMsg }]
         });
         return;
      }
    }
    
    // Za legacy exempt rute, dozvoljavamo bezbedan record parse koji štiti samo od Prototype Pollution.
    schema = z.record(z.string(), z.unknown()).superRefine((val, ctx) => {
      const keys = Object.keys(val);
      const isMalicious = keys.some((key) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype") return true;
        const child = val[key];
        if (child && typeof child === "object") {
          try {
            const stringified = JSON.stringify(child);
            if (stringified.includes('"__proto__"') || stringified.includes('"constructor"') || stringified.includes('"prototype"')) return true;
          } catch (e) { return false; }
        }
        return false;
      });

      if (isMalicious) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Detektovan pokušaj zlonamerne modifikacije objekta (Prototype Pollution)",
        });
      }
    });
  }

  try {
    // Stripping privilege escalations for safety before validation
    const user = req.user;
    const isAdminUser = user?.isAdmin || false;
    if (req.body && !isAdminUser) {
      const sensitiveFields = ["role", "isAdmin", "userRole", "privilege", "status", "claims"];
      for (const field of sensitiveFields) {
        if (req.body[field] !== undefined) delete req.body[field];
        if (req.body.data && req.body.data[field] !== undefined) delete req.body.data[field];
      }
    }

    const schemaKey = schema ? (SCHEMA_KEYS.get(schema) || "unknown_schema") : "unknown_schema";
    let bodyString = "";
    try {
      bodyString = req.body && typeof req.body === "object" ? JSON.stringify(req.body) : "";
    } catch {
      bodyString = "";
    }

    if (schema && schemaKey !== "unknown_schema" && bodyString) {
      const cached = fastValidationCache.get(schemaKey, bodyString);
      if (cached) {
        req.body = cached;
        return next();
      }
    }

    req.body = await schema.parseAsync(req.body || {});
    await validateVerticalAdData(schema, req.body);

    if (schema && schemaKey !== "unknown_schema" && bodyString) {
      fastValidationCache.set(schemaKey, bodyString, req.body);
    }

    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMsg = "Zod auto validation failed";
      const details = formatZodErrorSerbian(error);
      
      res.status(400).json({
        error: "Payload validacija nije uspela",
        details
      });

      logToDLQ(errorMsg, req, details);
    } else {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const details = [{ field: "global", message: errorMsg }];
      res.status(400).json({
        error: "Payload validacija nije uspela",
        details
      });
      
      logToDLQ(errorMsg, req, details);
    }
    return;
  }
};

const globalSettingsUpdatesSchema = z.object({
  pricing: z.record(z.string(), z.any()).optional(),
  limits: z.record(z.string(), z.any()).optional(),
  messages: z.object({
    welcome_text: z.string().optional(),
    maintenance_mode: z.boolean().optional(),
  }).optional(),
  globalRateLimit: z.number().int().nonnegative().optional(),
  initialCredits: z.number().nonnegative().optional(),
}).passthrough();

const platformSettingsUpdatesSchema = z.object({
  launchMode: z.boolean().optional(),
});

const brandingSettingsUpdatesSchema = z.object({
  logoUrl: z.string().optional(),
});

export const validateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.params;
    if (!type) {
      return res.status(400).json({ error: "Missing settings type" });
    }

    if (!req.body || req.body.updates === undefined) {
      return res.status(400).json({ error: "Missing updates object" });
    }

    const { updates } = req.body;

    if (type === "global") {
      req.body.updates = await globalSettingsUpdatesSchema.parseAsync(updates);
    } else if (type === "platform") {
      req.body.updates = await platformSettingsUpdatesSchema.parseAsync(updates);
    } else if (type === "branding") {
      req.body.updates = await brandingSettingsUpdatesSchema.parseAsync(updates);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrorSerbian(error);
      res.status(400).json({
        error: "Neispravan format cene ili limita",
        details,
      });
      logToDLQ("Settings validation failed", req, details);
    } else {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const details = [{ field: "global", message: errorMsg }];
      res.status(400).json({
        error: "Neispravan format cene ili limita",
        details,
      });
      logToDLQ(errorMsg, req, details);
    }
  }
};

export const validateListLimit = (req: Request, res: Response, next: NextFunction) => {
  // Check req.query.limit
  if (req.query.limit !== undefined) {
    const limitVal = parseInt(req.query.limit as string, 10);
    if (isNaN(limitVal)) {
      req.query.limit = "20";
    } else if (limitVal > 50) {
      return res.status(400).json({
        error: "Payload validacija nije uspela",
        details: [{ field: "limit", message: "Limit ne može biti veći od 50" }]
      });
    } else {
      req.query.limit = limitVal.toString();
    }
  }

  // Check req.body.limit
  if (req.body && req.body.limit !== undefined) {
    const limitVal = parseInt(req.body.limit as string, 10);
    if (isNaN(limitVal)) {
      req.body.limit = 20;
    } else if (limitVal > 50) {
      return res.status(400).json({
        error: "Payload validacija nije uspela",
        details: [{ field: "limit", message: "Limit ne može biti veći od 50" }]
      });
    } else {
      req.body.limit = limitVal;
    }
  }

  next();
};

