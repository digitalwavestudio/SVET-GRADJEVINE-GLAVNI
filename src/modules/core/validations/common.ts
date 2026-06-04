import { z } from 'zod';

export const phoneRegex = /^\+?[0-9\s\-()]{6,20}$/;

export const baseEntitySchema = z.object({
  id: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  status: z.string().optional(),
  authorId: z.string().optional(),
});

export const locationSchema = z.object({
  location: z.string().min(1, 'Lokacija je obavezna'),
  locationSlug: z.string().optional(),
});

export const contactSchema = z.object({
  contactPhone: z.string().regex(phoneRegex, 'Neispravan format telefona'),
  contactEmail: z.string().email('Neispravan format email-a').or(z.literal('')).optional(),
});
