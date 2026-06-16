export type UserRole = 
  | 'standard' 
  | 'majstor' 
  | 'poslodavac' 
  | 'smestaj' 
  | 'ketering' 
  | 'placevi' 
  | 'masine' 
  | 'partner'
  | 'admin'
  // Legacy roles used in the UI:
  | 'employer'
  | 'candidate'
  | 'kompanija'
  | 'agencija';

export type BusinessNiche = 'gradjevina' | 'ketering' | 'smestaj' | 'placevi' | 'masine';

export interface CVExperience {
  company: string;
  position: string;
  from?: string;
  to?: string;
  description?: string;
}

export interface CVEducation {
  school: string;
  degree?: string;
  from?: string;
  to?: string;
}

export interface CVLanguage {
  language: string;
  level?: string;
}

export interface CVData {
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  experience?: CVExperience[] | string;
  skills?: string[];
  education?: CVEducation[] | string;
  languages?: CVLanguage[] | string | any[];
  about?: string;
  portfolioImages?: string[];
  portfolioTitle?: string;
  portfolioDescription?: string;
  sector?: string;
  profession?: string;
}

export interface BusinessProfile {
  niche?: BusinessNiche;
  pib?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  logo?: string;
  companyName?: string;
  website?: string;
  industry?: string;
  about?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
  } | string;
}

export interface SavedSearch {
  id: string;
  name: string;
  path: string;
  filterParams: Record<string, unknown>;
  createdAt: number;
}

export interface SavedAd {
  id: string;
  type: string;
}

export interface User {
  id: string;
  uid?: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  phone?: string;
  description?: string;
  facebook?: string;
  instagram?: string;
  hasCV?: boolean;
  freeAdsCount: number;
  isPremiumProfile: boolean;
  viewsCount?: number;
  savedJobs?: string[];
  savedAds?: SavedAd[];
  savedSearches?: SavedSearch[];
  cvData?: CVData;
  profileScore?: number;
  company?: string;
  profession?: string;
  status?: 'active' | 'pending' | 'expired' | 'deleted';
  metadata?: Record<string, unknown> | null;
  roles?: UserRole[] | string[];
  syncStatus?: 'idle' | 'syncing' | 'failed';
  lastSyncedAt?: { _seconds: number; _nanoseconds: number } | string | number | Date | null;
  dashboardMetrics?: {
    activeAds?: number;
    totalApplications?: number;
    unreadMessages?: number;
    pendingApplications?: number;
  };
  businessProfile?: BusinessProfile;
  
  // Partner / Affiliate
  partnerCode?: string;
  partnerSlug?: string;
  partnerStatus?: 'active' | 'inactive';
  partnerClicks?: number;
  partnerLeads?: number;
  partnerConversions?: number;
  partnerBalance?: number;
  walletBalance?: number;
  packageType?: string;
  paket?: string;
  totalAds?: number;
  
  emailVerified: boolean;
  createdAt?: { _seconds: number; _nanoseconds: number } | string | number | Date | null;
  availability?: 'slobodan' | 'zauzet' | 'uskoro' | string | null;
  professionSlug?: string;
  sector?: string;
  location?: string;
  locationSlug?: string;
  companyName?: string;
  displayName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  lastSeen?: { _seconds: number; _nanoseconds: number } | string | number | Date | null;
  mb?: string;
  pib?: string;
  licences?: string[];
  events?: { date: string; status: 'free' | 'busy' | 'maintenance' }[];
  stats?: {
    unreadMessages?: number;
    [key: string]: any;
  };
  fcmTokens?: string[];
}
