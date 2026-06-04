export interface RecentAd {
  id: string;
  title?: string;
  name?: string;
  applicantsCount: number;
  status: 'active' | 'pending' | 'pending_payment' | 'expired' | 'rejected' | string;
  category?: string;
  type?: string;
  updatedAt?: string;
  health?: {
    score: number;
    status: 'good' | 'average' | 'poor';
    suggestion: string;
  };
}

export interface DashboardMetrics {
  totalAds: number;
  activePackage?: string;
  packageExpiry?: string;
  premiumAdsCount: number;
  totalSpend: number;
  pendingApplications: number;
  recentAds: RecentAd[];
}

export interface ChartTrendData {
  date: string;
  views: number;
  applications: number;
}
