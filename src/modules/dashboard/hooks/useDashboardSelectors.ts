import React from "react";
import { UseQueryResult } from "@tanstack/react-query";
import { useDashboardStats, BffDashboardResponse, DashboardAdSchema, DashboardApplicationSchema } from "./useDashboardBff";
import { useDashboardQuickMetrics, QuickMetricsResponse } from "./useDashboardQuickMetrics";
import { z } from "zod";

const selectTrends = (res: BffDashboardResponse): { date: string; views: number; applications: number }[] => (res?.trends || []).map(t => ({
  date: t.name,
  views: t.pregledi,
  applications: t.prijave ?? 0
}));

const selectMetrics = (res: BffDashboardResponse): Required<BffDashboardResponse>["stats"] => res?.stats || {};

const selectRecentAds = (res: BffDashboardResponse): z.infer<typeof DashboardAdSchema>[] => res?.stats?.recentAds || [];

const selectRecentApplications = (res: BffDashboardResponse): z.infer<typeof DashboardApplicationSchema>[] => res?.stats?.recentApplications || [];

export function useDashboardTrends(): UseQueryResult<{ date: string; views: number; applications: number; }[], Error> {
  return useDashboardStats(selectTrends);
}

export function useDashboardMetrics(): UseQueryResult<Required<BffDashboardResponse>["stats"] & QuickMetricsResponse, Error> {
  const stats = useDashboardStats(selectMetrics);
  const qm = useDashboardQuickMetrics();

  return React.useMemo(() => {
    const combinedData = {
      ...(stats.data || {}),
      ...(qm.data || {}),
    } as Required<BffDashboardResponse>["stats"] & QuickMetricsResponse;

    return {
      ...stats,
      isLoading: stats.isLoading || qm.isLoading,
      isFetching: stats.isFetching || qm.isFetching,
      error: stats.error || qm.error,
      data: combinedData,
    } as UseQueryResult<Required<BffDashboardResponse>["stats"] & QuickMetricsResponse, Error>;
  }, [
    stats.data, stats.isLoading, stats.isFetching, stats.error, stats.status, stats.fetchStatus,
    qm.data, qm.isLoading, qm.isFetching, qm.error, qm.status, qm.fetchStatus, stats.isError
  ]);
}

export function useDashboardRecentAds(): UseQueryResult<z.infer<typeof DashboardAdSchema>[], Error> {
  return useDashboardStats(selectRecentAds);
}

export function useDashboardRecentApplications(): UseQueryResult<z.infer<typeof DashboardApplicationSchema>[], Error> {
  return useDashboardStats(selectRecentApplications);
}
