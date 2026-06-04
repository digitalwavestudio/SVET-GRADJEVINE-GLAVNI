import { BaseEntity } from './common';

export enum MarketplaceItemStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  EXPIRED = 'expired',
  PENDING = 'pending',
  DELETED = 'deleted'
}

export interface MarketplaceItem extends BaseEntity {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName?: string;
  location: string;
  locationSlug: string;
  image: string;
  images?: string[];
  seller: string;
  phone?: string;
  whatsapp?: string;
  features?: string[];
  status?: MarketplaceItemStatus | string;

  // Legacy fields
  comp?: string;
  authorId?: string;
  viewsCount?: number;
  isPremium?: boolean;
  isUrgent?: boolean;
}

export interface MarketplaceFilters {
  categoryId?: string;
  locationSlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}
