import { z } from "zod";

export const UserMatchProfileSchema = z.object({
  uid: z.string().optional(),
  id: z.string().optional(),
  profession: z.string().optional(),
  displayName: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional()
}).passthrough();

export type UserMatchProfileDTO = z.infer<typeof UserMatchProfileSchema>;

export const SmartMatchItemSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  requirements: z.string().optional(),
  matchRate: z.number().optional()
}).passthrough();

export type SmartMatchItemDTO = z.infer<typeof SmartMatchItemSchema>;

export const ApplicationItemSchema = z.object({
  id: z.string(),
  jobTitle: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional(),
  applicantName: z.string().optional()
}).passthrough();

export type ApplicationItemDTO = z.infer<typeof ApplicationItemSchema>;

export const DashboardTrendSchema = z.object({
  name: z.string(),
  prijave: z.number().optional(),
  pregledi: z.number().optional()
});

export type DashboardTrendDTO = z.infer<typeof DashboardTrendSchema>;

export const DashboardAdItemSchema = z.object({
  id: z.string(),
  collType: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  viewsCount: z.number().optional(),
  createdAt: z.union([z.string(), z.number(), z.record(z.string(), z.unknown())]).optional()
}).passthrough();

export type DashboardAdItemDTO = z.infer<typeof DashboardAdItemSchema>;
