import { z } from 'zod';
import { phoneRegex } from '@/src/modules/core';

export const userBusinessProfileSchema = z.object({
  companyName: z.string().min(2, 'Naziv kompanije je obavezan').max(200),
  logo: z.string().max(2083).or(z.literal('')).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  industry: z.string().optional(),
  about: z.string().max(5000).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

export const userProfileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  name: z.string().max(200).optional(),
  phone: z.string().regex(phoneRegex, 'Neispravan format telefona').or(z.literal('')).optional(),
  description: z.string().max(10000).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  photoURL: z.string().max(2083).or(z.literal('')).optional(),
  profession: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  bio: z.string().max(5000).optional(),
  profileScore: z.number().optional(),
  hasCV: z.boolean().optional(),
  availability: z.string().optional(),
  businessProfile: userBusinessProfileSchema.partial().optional(),
  isVerified: z.boolean().optional(),
  verifiedAt: z.any().optional(), // Firebase timestamp or ISO string
  pib: z.string().optional()
});

export type UserBusinessProfileValues = z.infer<typeof userBusinessProfileSchema>;
export type UserProfileValues = z.infer<typeof userProfileSchema>;
