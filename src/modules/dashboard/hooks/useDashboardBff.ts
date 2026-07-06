import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { useAuth } from "@/src/context/AuthContext";
import { z } from "zod";

export const DashboardAdSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  postType: z.string().optional(),
  status: z.string().optional(),
  views: z.number().default(0),
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

export const DashboardApplicationSchema = z.object({
  id: z.string(),
  adId: z.string(),
  userId: z.string(),
  status: z.string().optional(),
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

export const DashboardAnalyticsSchema = z.object({
  id: z.string().optional(),
  date: z.string().optional(),
  views: z.number().optional(),
});

export const RecentActivitySchema = z.object({
  id: z.string(),
  action: z.string(),
  timestamp: z.string(),
});

export const SmartMatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  relevance: z.number(),
});

export const logZodFieldFailure = (fieldName: string) => {
  console.warn(`[Zod] Field "${fieldName}" validation skipped`);
};

export const BffDashboardResponseSchema = z.object({
  stats: z.object({
    analytics: z.array(DashboardAnalyticsSchema).optional().catch(() => []),
    activeAds: z.number().optional(),
    pendingAds: z.number().optional(),
    totalViews: z.number().optional(),
    applicationsCount: z.number().optional(),
    totalAds: z.number().optional(),
    pendingApplications: z.number().optional(),
    totalSpend: z.number().optional(),
    activePackage: z.string().optional(),
    premiumAdsCount: z.number().optional(),
    recentAds: z.array(DashboardAdSchema).optional(),
    recentApplications: z.array(DashboardApplicationSchema).optional(),
    smartMatches: z.array(SmartMatchSchema).optional().catch(() => []),
    systemOutboxPending: z.number().optional().catch(() => 0),
    systemOutboxDlq: z.number().optional().catch(() => 0),
    premiumPartners: z.number().optional().catch(() => 0),
    totalUsers: z.number().optional().catch(() => 0),
    verifiedCompanies: z.number().optional().catch(() => 0),
    jobsCount: z.number().optional().catch(() => 0),
    machinesCount: z.number().optional().catch(() => 0),
    companiesCount: z.number().optional().catch(() => 0),
    estimatedRevenue: z.number().optional().catch(() => 0),
    chartData: z.object({
      registrationData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
      sectorData: z.array(z.object({ name: z.string(), value: z.number() })).optional()
    }).optional().catch(() => ({ registrationData: [], sectorData: [] })),
  }).default({}),
  recentActivities: z.array(RecentActivitySchema).optional(),
  myAds: z.array(DashboardAdSchema).optional(),
  trends: z.array(z.object({ name: z.string(), pregledi: z.number(), prijave: z.number().optional() })).optional().catch(() => []),
});

export type BffDashboardResponse = z.infer<typeof BffDashboardResponseSchema>;

export function useDashboardStats<TData = BffDashboardResponse>(select?: (data: BffDashboardResponse) => TData) {
  const { user } = useAuth();
  const uid = user?.id || user?.uid || "";
  const role = user?.role || (user as { userType?: string })?.userType || "";

  return useQuery({
    queryKey: dashboardKeys.bff(role, uid),
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<BffDashboardResponse>("/bff/dashboard", { signal });

      if (!response || typeof response !== "object") {
        return {
          success: true,
          stats: { activeAds: 0, pendingAds: 0, totalViews: 0, applicationsCount: 0, recentAds: [] },
          recentActivities: [],
          myAds: [],
          trends: []
        } as BffDashboardResponse;
      }

      return response;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: false,
    throwOnError: true,
    enabled: !!uid && !!role,
    select,
  });
}
