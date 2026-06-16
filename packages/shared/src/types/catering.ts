import { BaseEntity } from './common';

export interface CateringOffer extends BaseEntity {
  title: string;
  description: string;
  type: string; // 'daily_menu' | 'event_catering' | 'bakery'
  typeSlug: string;
  pricePerPerson?: number;
  minOrderQuantity?: number;
  deliveryAvailable: boolean;
  location: string;
  locationSlug: string;
  images: string[];
  mainImage: string;
  contactPhone: string;
  contactEmail: string;
  menuItems?: string[];

  // Legacy fields
  comp?: string;
  authorId?: string;
  tacnaLokacija?: string;
  kitchenType?: string;
  minOrder?: number;
  pricePerMeal?: string;
  deliveryZone?: string;
  amenities?: string[];
  isPremium?: boolean;
  isUrgent?: boolean;
  paket?: string;
  viewsCount?: number;
  invoiceAvailable?: boolean;
  haccpCertified?: boolean;
  packagingIncluded?: boolean;
  dailyCapacityMeals?: number;
  telefon?: string;
  
  companyName?: string;
  companyLogo?: string;
  isCompanyVerified?: boolean;
}
