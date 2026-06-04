import { Timestamp } from 'firebase/firestore';

export enum EntityStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  EXPIRED = 'expired',
  DELETED = 'deleted',
  DRAFT = 'draft'
}

export interface BaseEntity {
  id?: string;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number } | { toDate: () => Date };
  updatedAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number } | { toDate: () => Date };
  status?: string | EntityStatus;
  viewsCount?: number;
  authorId?: string;
  isPremium?: boolean;
  isUrgent?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
}
