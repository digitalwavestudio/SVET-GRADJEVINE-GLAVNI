import { z } from "zod";

export const publicAdSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional(),
  location: z.unknown().optional(),
  images: z.array(z.string()).optional(),
  price: z.number().optional(),
  status: z.string().optional(),
  authorId: z.string().optional(),
  role: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional()
}).passthrough();

export const publicAdsResponseSchema = z.object({
  docs: z.array(publicAdSchema),
  lastVisibleId: z.union([z.string(), z.null()]).optional(),
  hasMore: z.boolean().optional()
});

export const myAdsResponseSchema = publicAdsResponseSchema;
