import { BaseEntity } from '@/src/modules/core/types/common';

export interface Company extends BaseEntity {
  name: string;
  pib: string;
  address: string;
  locationSlug: string;
  phone: string;
  workingHours: string;
  description: string;
  mainCategories: string[];
  subCategories: string[];
  coverageType: string;
  coverageValue: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  employeeCount?: string;
  authorId: string;
  isVerified?: boolean;
  isPremium?: boolean;
  isPremiumPartner?: boolean;
  isUrgent?: boolean;
  viewsCount?: number;
  images: string[];
  
  // Phase 2 Fields
  portfolioImages?: string[];
  references?: string[];
  licenses?: string[];
  certifications?: string[];
  equipmentSummary?: string;
  teamSpecialties?: string[];
}
