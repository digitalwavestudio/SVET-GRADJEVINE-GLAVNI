// Single source of truth for the User entity and related types lives in the
// shared package. This module re-exports them so existing imports of
// '@/src/modules/core/types/user' keep working without duplicating definitions.
export type {
  UserRole,
  BusinessNiche,
  CVData,
  BusinessProfile,
  SavedSearch,
  SavedAd,
  User,
} from '@svet-gradjevine/shared';
