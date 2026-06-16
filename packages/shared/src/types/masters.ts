import { BaseEntity } from './common';

export interface Master extends BaseEntity {
  name: string;
  profession: string;
  location: string;
  experience: string;
  phone: string;
  skills: string[];
  photo: string;
  verified: boolean;
  availability: 'slobodan' | 'zauzet' | 'uskoro';
  premium?: boolean;
  isPremiumProfile?: boolean;
  paket?: string;
  portfolioImages?: string[];
  profileScore?: number;
  sector?: string;
  professionSlug?: string;
}
