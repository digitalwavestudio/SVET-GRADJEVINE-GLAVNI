import { 
  Job, 
  Machine, 
  RealEstatePlot, 
  Accommodation, 
  CateringOffer,
  User
} from "@svet-gradjevine/shared";
import {
  DashboardAdItemDTO,
  ApplicationItemDTO,
  DashboardTrendDTO
} from "../dto/dashboard.dto.ts";

export interface HomepageStats {
  totalJobs: number;
  totalMachines: number;
  totalAccommodations: number;
  totalCaterings: number;
  totalRealEstate: number;
  totalCompanies: number;
  premiumJobs: number;
  urgentJobs: number;
  totalAdsCount: number;
  dynamicFirmsCount: number;
  dynamicWorkersCount: number;
  dynamicMachineryCount: number;
  dynamicRealEstateCount: number;
  dynamicViewsCount: number;
}

export interface AuthorSnapshot {
  companyName?: string;
  displayName?: string;
  photoURL?: string;
  id?: string;
}

export interface RawAdData {
  id?: string;
  createdAt?: string | number | Date | null | { _seconds: number; _nanoseconds: number } | { toDate: () => Date };
  title?: string;
  name?: string;
  loc?: string;
  location?: string | { address?: string } | null;
  grad?: string;
  salary?: string | number | null;
  price?: string | number | null;
  sal?: string | number | null;
  comp?: string;
  authorSnapshot?: AuthorSnapshot | null;
  logo?: string;
  images?: string[];
  photoURL?: string;
  coverImage?: string;
}

export interface MappedAdData extends RawAdData {
  title: string;
  loc: string;
  salary: string | number | null;
  comp: string;
  logo: string;
}

export interface HomepageDataResult {
  success: boolean;
  stats: HomepageStats;
  premiumJobs: MappedAdData[];
  urgentJobs: MappedAdData[];
  latestMachines: Machine[];
  latestRealEstate: RealEstatePlot[];
  latestAccommodations: Accommodation[];
  latestCaterings: CateringOffer[];
  latestArticles: any[]; // Article types might not be DTO yet
}

export interface DashboardQuickMetrics {
  myAdsCount: number;
  unreadMessagesCount: number;
  unreadActivitiesCount: number;
  walletBalance: number;
  walletVerified: boolean;
  serverTime: string;
  _circuit?: string;
}

export interface EmployerStats {
  totalAds: number;
  pendingApplications: number;
  totalViews: number;
  totalSpend: number;
  activePackage: string;
  premiumAdsCount: number;
  lastPaymentAmount: number;
  lastPaymentAt: string | number | null;
  recentAds: DashboardAdItemDTO[];
  recentApplications: ApplicationItemDTO[];
  trends: DashboardTrendDTO[];
}

export interface DashboardDataResult {
  success: boolean;
  _degraded?: boolean;
  _sandbox?: boolean;
  stats?: {
    activeAds: number;
    pendingAds: number;
    totalViews: number;
    applicationsCount: number;
    recentAds: DashboardAdItemDTO[];
    recentApplications: ApplicationItemDTO[];
    totalAdsCount: number;
    totalUsers: number;
    analytics?: any;
  };
  recentActivities?: any[];
  myAds?: DashboardAdItemDTO[];
  trends?: DashboardTrendDTO[];
}
