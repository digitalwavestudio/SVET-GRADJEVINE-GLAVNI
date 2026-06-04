import { z } from "zod";

export const clearDashboardCacheSchema = z.object({
  userId: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().min(5, "Razlog mora imati bar 5 karaktera")
}).refine(data => data.userId || data.targetUserId, {
  message: "Missing target userId",
  path: ["userId"]
});

export const sendBroadcastSchema = z.object({
  audience: z.enum(["all", "employers", "candidates", "masters", "companies", "investors"]),
  title: z.string().min(5, "Prekratko"),
  body: z.string().min(10, "Prekratko")
});

export const retryDlqItemSchema = z.object({
  source: z.enum(["outbox", "dlq"])
});

export const resetCircuitBreakerOrCacheSchema = z.object({
  name: z.string().optional(),
  invalidateCache: z.boolean().optional(),
  cachePrefix: z.string().optional()
});

export const resolveReportSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  note: z.string().optional().default("")
});

export const adminMonitoringQuerySchema = z.object({
  bypassCache: z.enum(["true", "false"]).optional()
});

export const resetCircuitBreakerParamsSchema = z.object({
  name: z.string().min(1, "Ime je obavezno")
});

export const basePaginationQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional().transform(val => (val ? Number(val) : undefined)),
  lastDocId: z.string().optional(),
  searchQ: z.string().optional(),
  cursor: z.string().optional()
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});

export const verifyUserSchema = z.object({
  targetUserId: z.string().min(1),
  isVerified: z.boolean()
});

export const updateUserSchema = z.object({
  updates: z.record(z.string(), z.unknown())
});

export const updateUserWalletSchema = z.object({
  amount: z.number(),
  type: z.enum(["set", "add"]),
  reason: z.string().optional().default("")
});

export const suspendUserSchema = z.object({
  status: z.enum(["suspended", "active"]),
  reason: z.string().optional().default("")
});

export const adminUserResponseSchema = z.object({
  id: z.string(),
  uid: z.string().optional(),
  name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  role: z.string().optional(),
  company: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional(),
  isVerified: z.boolean().optional(),
  walletBalance: z.number().optional(),
  subscription: z.record(z.string(), z.unknown()).optional().nullable(),
  skills: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  categories: z.array(z.string()).optional(),
  status: z.string().optional(),
  claims: z.record(z.string(), z.unknown()).optional(),
  // Strict schema strips all other undeclared properties, removing internal fields or any unneeded 'any' fields.
});

export const adminUserListResponseSchema = z.object({
  users: z.array(adminUserResponseSchema),
  lastVisibleId: z.string().nullable(),
  nextPageToken: z.string().nullable(),
  hasMore: z.boolean()
});

export const moderationQueueItemSchema = z.object({
  id: z.string(),
  _collection: z.string(),
  _typeLabel: z.string(),
  title: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  authorId: z.string().optional(),
  location: z.unknown().optional(),
  images: z.array(z.string()).optional(),
  price: z.number().optional(),
  role: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).passthrough();

export const moderationQueueResponseSchema = z.object({
  items: z.array(moderationQueueItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean()
});

export const transcriptMessageSchema = z.object({
  id: z.string(),
  text: z.string().optional(),
  senderId: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional(),
}).passthrough();

export const transcriptResponseSchema = z.object({
  messages: z.array(transcriptMessageSchema)
});
