import { BaseEntity } from '@/src/modules/core/types/common';

export interface Master extends BaseEntity {
  name: string;
  profession: string;
  location: string;
  experience: string;
  phone: string;
  skills: string[];
  photo: string;
  avatar?: string;
  verified: boolean;
  availability: 'slobodan' | 'zauzet' | 'uskoro';
  premium?: boolean;
  isPremiumProfile?: boolean;
  portfolioImages?: string[];
  profileScore?: number;
  sector?: string;
  professionSlug?: string;
}
