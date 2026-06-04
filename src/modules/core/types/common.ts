export enum EntityStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  DELETED = 'deleted',
  DRAFT = 'draft'
}

export interface BaseEntity {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
  status?: string | EntityStatus;
  viewsCount?: number;
  authorId?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
  imageStatus?: 'ready' | 'processing' | 'failed';
}

export interface Location {
  id: string;
  name: string;
  slug: string;
}
