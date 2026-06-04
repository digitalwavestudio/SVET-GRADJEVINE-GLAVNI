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

export interface CVData {
  fullName?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  experience?: string | any[];
  skills?: string[];
  education?: string | any[];
  languages?: any[];
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
  filterParams: any;
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
  savedSearches?: SavedSearch[];
  cvData?: CVData;
  profileScore?: number;
  company?: string;
  profession?: string;
  status?: 'active' | 'pending' | 'expired' | 'deleted';
  stats?: {
    unreadMessages?: number;
    [key: string]: any;
  };
  syncStatus?: 'idle' | 'syncing' | 'failed';
  lastSyncedAt?: any;
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
  
  emailVerified: boolean;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number };
  availability?: 'slobodan' | 'zauzet' | 'uskoro' | string | null;
  professionSlug?: string;
  sector?: string;
  location?: string;
  locationSlug?: string;
  companyName?: string;
  displayName?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  lastSeen?: any;
  mb?: string;
  pib?: string;
  licences?: string[];
  events?: { date: string; status: 'free' | 'busy' | 'maintenance' }[];
}
