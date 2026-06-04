import { BaseEntity } from './common';

export enum MachineFuelType {
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
  GAS = 'gas'
}

export enum MachineAdType {
  SALE = 'sale',
  RENT = 'rent'
}

export interface Machine extends BaseEntity {
  title: string;
  description: string;
  adType: MachineAdType | 'prodaja' | 'iznajmljivanje';
  adTypeSlug?: string;
  categoryId: string;
  categorySlug: string;
  subcategoryId?: string;
  brand: string;
  brandSlug?: string;
  manufacturer?: string;
  model: string;
  modelstr?: string;
  year?: number | string;
  workingHours?: number | string;
  powerKw?: string;
  condition?: 'novo' | 'polovno';
  fuelType?: MachineFuelType | string;
  isServiced?: boolean;
  hasWarranty?: boolean;
  price?: number | string;
  pricePerDay?: string;
  priceType?: 'total' | 'perDay' | 'perHour';
  currency: string;
  isNegotiable?: boolean;
  operatorIncluded?: boolean;
  transportAvailable?: boolean;
  urgentAvailable?: boolean;
  longTermAvailable?: boolean;
  location: string;
  locationSlug: string;
  region?: string;
  images: string[];
  mainImage: string;
  contactPhone: string;
  contactEmail?: string;
  phone?: string;
  viber?: string | boolean | null;
  whatsapp?: string | boolean | null;

  // Technical Specs
  weightKg?: number | string;
  lengthMm?: number;
  widthMm?: number;
  heightMm?: number;
  loadCapacityKg?: number;
  bucketCapacityM3?: number;
  maxDigDepthMm?: number;
  maxReachMm?: number;
  serviceHistory?: string;
  attachments?: string[];
  videoUrl?: string;

  // Legacy & Metadata
  comp?: string;
  authorId?: string;
  authorName?: string;
  status?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
  viewsCount?: number;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number };
  
  adTitle?: string;
  machFuel?: string;
  pricePerHour?: string;
  companyName?: string;
  companyLogo?: string;
  isCompanyVerified?: boolean;
}
