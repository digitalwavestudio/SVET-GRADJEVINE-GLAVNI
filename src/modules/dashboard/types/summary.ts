export interface PartnerSummary {
  partnerId: string;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number; // conversions / clicks
  totalEarnings: number;
  earningsPerClick: number;
  lastUpdated: unknown;
}

export interface CheckoutSummary {
  totalRevenue: number;
  confirmedCount: number;
  initiatedCount: number;
  failedCount: number;
  conversionRate: number; // confirmed / initiated
  averageOrderValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  lastUpdated: unknown;
}

export interface PlatformSummary {
  totalJobs: number;
  totalApplications: number;
  totalAccommodations: number;
  totalCompanies: number;
  activeUsersCount: number;
  lastUpdated: unknown;
}
