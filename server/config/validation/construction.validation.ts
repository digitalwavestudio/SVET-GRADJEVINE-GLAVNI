import { z } from "zod";

export const constructionSiteUpdateSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
}).passthrough();
