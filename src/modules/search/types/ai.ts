import { z } from 'zod';

export const parsedSearchSchema = z.object({
  searchQuery: z.string().optional(),
  location: z.string().optional(),
  sector: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  isUrgent: z.boolean().optional(),
});

export type ParsedSearch = z.infer<typeof parsedSearchSchema>;
