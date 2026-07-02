import { BaseEntity } from '@/src/modules/core/types/common';

export interface Company extends BaseEntity {
  name: string;
  pib: string;
  address: string;
  locationSlug: string;
  phone: string;
  description: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  authorId: string;
  isVerified?: boolean;
  isPremium?: boolean;
  isPremiumPartner?: boolean;
  isUrgent?: boolean;
  viewsCount?: number;
  images: string[];
  portfolioImages?: string[];
}
