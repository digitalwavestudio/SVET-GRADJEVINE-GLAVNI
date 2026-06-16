import { BaseEntity } from './common';

export interface Accommodation extends BaseEntity {
  title: string;
  description: string;
  location: string;
  locationSlug: string;
  type: string;
  typeSlug: string;
  pricePerNight?: number;
  capacity?: number;
  rooms?: number;
  images: string[];
  mainImage: string;
  address: string;
  invoiceAvailable: boolean;
  parkingAvailable: boolean;
  wifiAvailable: boolean;
  tvAvailable: boolean;
  kitchenAvailable: boolean;
  contactPhone: string;
  contactEmail: string;
  features?: string[];
  
  // Legacy UI fields
  price?: number;
  priceType?: string;
  paket?: string;
  companyLogo?: string;
  companyName?: string;
  isCompanyVerified?: boolean;
  totalBeds?: number;
  availableBeds?: number;
  amenities?: string[];
  distanceToSiteKm?: number;
  truckAccess?: boolean;
  laundryAvailable?: boolean;
  airConditioning?: boolean;
  minStayDays?: number;
}
