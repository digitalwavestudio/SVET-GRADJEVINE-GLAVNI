import { apiClient } from '@/src/lib/apiClient';

export type PackageLevel = 'free' | 'starter' | 'pro' | 'enterprise';
// ... (omitted definitions for brevity if matching, but I'll replace the whole file for safety)
export interface PackageFeatures {
  level: PackageLevel;
  maxJobs: number;
  premiumAds: number;
  urgentAds: number;
  verifiedBadge: boolean;
  visibilityScore: number;
}

export const PACKAGE_DEFINITIONS: Record<PackageLevel, PackageFeatures> = {
  free: { level: 'free', maxJobs: 0, premiumAds: 0, urgentAds: 0, verifiedBadge: false, visibilityScore: 1 },
  starter: { level: 'starter', maxJobs: 3, premiumAds: 0, urgentAds: 1, verifiedBadge: true, visibilityScore: 1.2 },
  pro: { level: 'pro', maxJobs: 10, premiumAds: 3, urgentAds: 5, verifiedBadge: true, visibilityScore: 2 },
  enterprise: { level: 'enterprise', maxJobs: 50, premiumAds: 15, urgentAds: 20, verifiedBadge: true, visibilityScore: 5 }
};

export const packageService = {
  async checkCredits(_userId: string): Promise<{ hasCredits: boolean; available: number }> {
    return { hasCredits: true, available: 999 };
  },
  async consumeCredit(_userId: string) {
  }
};
