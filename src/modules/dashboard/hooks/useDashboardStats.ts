import React, { useEffect, useState, useRef } from "react";
import { keepPreviousData, useQuery, UseQueryResult, useQueryClient, QueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { dashboardKeys } from "@/src/lib/queryKeysFactory";
import { useAuth } from "@/src/context/AuthContext";
import { useDashboardUIStore } from "@/src/modules/dashboard/store/dashboardUIStore";
 // import * as Sentry from "@sentry/react";
import { z } from "zod";

const SCHEMA_VERSION = "v1_master_employer_schema";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  response?: { status?: number; statusCode?: number };
}

export const DashboardAdSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  postType: z.enum(["plot", "machine", "job"]).optional().or(z.string().optional()),
  status: z.enum(["active", "pending", "rejected", "paused", "draft"]).optional().or(z.string().optional()),
  views: z.number().default(0),
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
});

export const DashboardApplicationSchema = z.object({
  id: z.string(),
  adId: z.string(),
  userId: z.string(),
  status: z.enum(["pending", "reviewed", "accepted", "rejected"]).optional().or(z.string().optional()),
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

export interface QuickMetricsResponse {
  data?: {
    myAdsCount?: number;
    unreadActivitiesCount?: number;
  };
  myAdsCount?: number;
  unreadActivitiesCount?: number;
}

export const logZodFieldFailure = (fieldName: string, error: unknown) => {
  console.error(`[Zod Partial Validation Bypass] Field "${fieldName}" validation failed, returning fallback default value:`, error);
  try {
    apiClient.post("/logs", {
      level: "warn",
      message: `zod_partial_bypass: Field "${fieldName}" validation failed. Failsafe activated.`,
      context: { 
        fieldName, 
        errorMsg: error instanceof Error 
          ? error.message 
          : (error && typeof error === "object" && "message" in error 
              ? String((error as { message: string }).message) 
              : String(error)) 
      },
      source: "DashboardBFF"
    }).catch(() => console.warn('[DashboardStats] Log Zod field failure post failed'));
  } catch (e) {
    console.error("Failed to log Zod field failure inside bypass:", e);
  }
};

export const BffDashboardResponseSchema = z.object({
  success: z.boolean().optional(),
  _degraded: z.boolean().optional(),
  stats: z.object({
    analytics: z.array(DashboardAnalyticsSchema).optional().catch((ctx) => {
      logZodFieldFailure("analytics", ctx.error);
      return [];
    }),
    activeAds: z.number().optional(),
    pendingAds: z.number().optional(),
    totalViews: z.number().optional(),
    applicationsCount: z.number().optional(),
    // Server actually returns these field names
    totalAds: z.number().optional(),
    pendingApplications: z.number().optional(),
    totalSpend: z.number().optional(),
    activePackage: z.string().optional(),
    premiumAdsCount: z.number().optional(),
    recentAds: z.array(DashboardAdSchema).optional(),
    recentApplications: z.array(DashboardApplicationSchema).optional(),
    // Admin specific properties
    systemOutboxPending: z.number().optional().catch((ctx) => {
      logZodFieldFailure("systemOutboxPending", ctx.error);
      return 0;
    }),
    systemOutboxDlq: z.number().optional().catch((ctx) => {
      logZodFieldFailure("systemOutboxDlq", ctx.error);
      return 0;
    }),
    premiumPartners: z.number().optional().catch((ctx) => {
      logZodFieldFailure("premiumPartners", ctx.error);
      return 0;
    }),
    totalUsers: z.number().optional().catch((ctx) => {
      logZodFieldFailure("totalUsers", ctx.error);
      return 0;
    }),
    verifiedCompanies: z.number().optional().catch((ctx) => {
      logZodFieldFailure("verifiedCompanies", ctx.error);
      return 0;
    }),
    jobsCount: z.number().optional().catch((ctx) => {
      logZodFieldFailure("jobsCount", ctx.error);
      return 0;
    }),
    machinesCount: z.number().optional().catch((ctx) => {
      logZodFieldFailure("machinesCount", ctx.error);
      return 0;
    }),
    companiesCount: z.number().optional().catch((ctx) => {
      logZodFieldFailure("companiesCount", ctx.error);
      return 0;
    }),
    estimatedRevenue: z.number().optional().catch((ctx) => {
      logZodFieldFailure("estimatedRevenue", ctx.error);
      return 0;
    }),
    chartData: z.object({
      registrationData: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
      sectorData: z.array(z.object({
        name: z.string(),
        value: z.number()
      })).optional()
    }).optional().catch((ctx) => {
      logZodFieldFailure("chartData", ctx.error);
      return { registrationData: [], sectorData: [] };
    }),
    smartMatches: z.array(SmartMatchSchema).optional().catch((ctx) => {
      logZodFieldFailure("smartMatches", ctx.error);
      return [];
    }),
  }).default({}),
  recentActivities: z.array(RecentActivitySchema).optional(),
  myAds: z.array(DashboardAdSchema).optional(),
  trends: z.array(
    z.object({
      name: z.string(),
      pregledi: z.number(),
      prijave: z.number().optional(),
    })
  ).optional().catch((ctx) => {
    logZodFieldFailure("trends", ctx.error);
    return [];
  }),
});

export type BffDashboardResponse = z.infer<typeof BffDashboardResponseSchema>;

export function useDashboardStats<TData = BffDashboardResponse>(select?: (data: BffDashboardResponse) => TData): UseQueryResult<TData, Error> {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const uid = user?.id || user?.uid || "";
  // Bitno: role može biti prazan dok se custom claims ne razreše. Dajemo
  // stabilan fallback "unknown" kako queryKey ne bi varirao (prazan -> popunjen)
  // i uzrokovao da React Query odbaci već učitane podatke i pokrene novi query.
  // Server ionako čita pravu ulogu iz Firebase tokena, ne iz ovog ključa.
  const role = user?.role || (user as { userType?: string })?.userType || "unknown";

  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  // Network bandwidth adaptive detection via shared Zustand store
  const isSlowConnection = useDashboardUIStore(state => state.isSlowConnection);
  const setIsSlowConnection = useDashboardUIStore(state => state.setIsSlowConnection);

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    interface NetworkInformation {
        effectiveType: string;
        addEventListener: (type: 'change', listener: () => void) => void;
        removeEventListener: (type: 'change', listener: () => void) => void;
        onchange: (() => void) | null;
    }
    
    interface NavigatorWithConnection extends Navigator {
        connection?: NetworkInformation;
        mozConnection?: NetworkInformation;
        webkitConnection?: NetworkInformation;
    }

    const nav = navigator as NavigatorWithConnection;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (!conn) return;

    const handleConnectionChange = () => {
      const slow = conn.effectiveType === '2g' || conn.effectiveType === '3g';
      setIsSlowConnection(slow);
      console.info(`[Network Bandwidth Adapter] Effective connection quality change: ${conn.effectiveType || "unknown"}. Adaptive Mode: ${slow ? "ENABLED" : "DISABLED"}`);
    };

    if (typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', handleConnectionChange);
    } else {
      conn.onchange = handleConnectionChange;
    }

    return () => {
      if (typeof conn.removeEventListener === 'function') {
        conn.removeEventListener('change', handleConnectionChange);
      } else {
        conn.onchange = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const handleVisibilityChange = () => {
      // Clear any pending transition timers to prevent race conditions or multiple concurrent timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }

      if (document.visibilityState === "hidden") {
        setIsVisible(false);
      } else {
        // Return to visibility after a small protective delay to avoid layout thrashing during tab switching
        timeoutIdRef.current = setTimeout(() => {
          setIsVisible(true);
          timeoutIdRef.current = null;
        }, 1500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      // Strict cleanup of all resources on component unmount to prevent memory leaks
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Automatic Reconnection & Reconciliation Event Listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      console.info("[Offline Sync Manager] Network connection is BACK! Initiating silent schema validation and sync...");
      
      if (uid) {
        try {
          // Schema Version verification
          const rawCache = localStorage.getItem(`dashboard_cache_${uid}`);
          if (rawCache) {
            const cacheEnvelope = JSON.parse(rawCache);
            if (cacheEnvelope && cacheEnvelope.schemaVersion !== SCHEMA_VERSION) {
              console.warn(`[Offline Sync Manager] Scheme version mismatch during reconnection check (found: ${cacheEnvelope.schemaVersion || "none"}, expected: ${SCHEMA_VERSION}). Purging stale offline cache.`);
              localStorage.removeItem(`dashboard_cache_${uid}`);
            } else {
              console.info("[Offline Sync Manager] Reconnection schema verification SUCCESS: schema matched:", SCHEMA_VERSION);
            }
          }
        } catch (e) {
          console.error("[Offline Sync Manager] Reconnection schema check encountered an exception:", e);
        }
      }

      let queueLocked = false;
      // Sync offline queue changes
      try {
        const { offlineSyncManager } = await import("@/src/lib/offlineSyncManager");
        if (offlineSyncManager && typeof offlineSyncManager.flushOutbox === "function") {
          const outboxItems = offlineSyncManager.getOutbox();
          if (outboxItems.length > 0) {
            queueLocked = true;
            console.info(`[Offline Sync Manager] Found ${outboxItems.length} offline outbox entries. Initiating silent background flush with Queue Lock...`);
            await offlineSyncManager.flushOutbox();
            
            const remaining = offlineSyncManager.getOutbox();
            if (remaining.length === 0) {
              queueLocked = false;
              console.info("[Offline Sync Manager] Outbox queue cleared. Queue Lock released.");
            } else {
              console.warn(`[Offline Sync Manager] Outbox queue still has ${remaining.length} items. Queue Lock maintained.`);
            }
          }
        }
      } catch (err) {
        console.warn("[Offline Sync Manager] Auto-synchronization of outbox skipped or failed:", err);
      }

      // Silent validation/refetch of Query cache once connection is restored
      if (!queueLocked) {
        try {
          console.info("[Offline Sync Manager] Reconnection database reconciliation: refetching latest metrics...");
          queryClient.invalidateQueries({ queryKey: dashboardKeys.bff(role, uid), refetchType: "all" });
        } catch (err) {
          console.error("[Offline Sync Manager] Background query refresh failed:", err);
        }
      } else {
        console.warn("[Offline Sync Manager] Global BFF refetch aborted due to active Queue Lock.");
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [uid, role, queryClient]);

  return useQuery({
    queryKey: dashboardKeys.bff(role, uid),
    queryFn: async ({ signal }) => {
      if (isSlowConnection) {
        console.warn(`[Network Bandwidth Adapter] Fetching BFF dashboard on weak connection.`);
      }
      const startTime = Date.now();

      // Immediate Offline/Network-Lost Fallback Check
      if (typeof window !== "undefined" && !navigator.onLine) {
        console.warn("[Offline Cache Fallback] Connection offline. Searching local secure cache for offline storage browse/view support...");
        if (uid) {
          try {
            const rawCache = localStorage.getItem(`dashboard_cache_${uid}`);
            if (rawCache) {
              const cacheEnvelope = JSON.parse(rawCache);
              if (cacheEnvelope && cacheEnvelope.schemaVersion === SCHEMA_VERSION) {
                console.info("[Offline Cache Fallback] Valid offline cache found. Continuing offline dashboard browse session cleanly:", cacheEnvelope.schemaVersion);
                return cacheEnvelope.data;
              } else {
                console.warn("[Offline Cache Fallback] Schema mismatch or corrupt cached data found.");
              }
            }
          } catch (err) {
            console.error("[Offline Cache Fallback] Safe offline cache fetch check failed:", err);
          }
        }
      }

      try {
        const response = await apiClient.get<BffDashboardResponse>("/bff/dashboard", { signal });
        const latency = Date.now() - startTime;
        
        // Dynamic latent network adaptation
        if (latency > 800) {
          console.warn(`[Network Bandwidth Adapter] API ping estimation: ${latency}ms latency detected (threshold: 800ms). Switching to bandwidth saver mode.`);
          setIsSlowConnection(true);
        } else {
          // If latency is fast but standard API still reports 2G/3G, keep it slow, otherwise clear it to false
          const nav = typeof navigator !== "undefined" ? (navigator as { connection?: { effectiveType: string }, mozConnection?: { effectiveType: string }, webkitConnection?: { effectiveType: string } }) : null;
          const conn = nav ? (nav.connection || nav.mozConnection || nav.webkitConnection) : null;
          const slowType = !!(conn && (conn.effectiveType === '2g' || conn.effectiveType === '3g'));
          if (!slowType && isSlowConnection) {
            setIsSlowConnection(false);
          }
        }

        // Robust Fail-Safe Fallback Guard
        if (!response || typeof response !== "object") {
          console.warn("[DashboardStats] Primljen prazan ili nevalidan odgovor sa /bff/dashboard. Pokušavam učitavanje iz offline keša.");
          if (typeof window !== "undefined" && uid) {
            try {
              const rawCache = localStorage.getItem(`dashboard_cache_${uid}`);
              if (rawCache) {
                const cacheEnvelope = JSON.parse(rawCache);
                if (cacheEnvelope && cacheEnvelope.schemaVersion === SCHEMA_VERSION) {
                  return cacheEnvelope.data;
                }
              }
            } catch (cacheErr) {
              console.error("[DashboardStats] Greška pri čitanju offline keša:", cacheErr);
            }
          }
          
          // Ako nemamo keš, vraćamo bezbedan default objekat u skladu sa Zod šemom
          return {
            success: true,
            _degraded: true,
            stats: {
              activeAds: 0,
              pendingAds: 0,
              totalViews: 0,
              applicationsCount: 0,
              recentAds: [],
              recentApplications: [],
            },
            recentActivities: [],
            myAds: [],
            trends: []
          } as BffDashboardResponse;
        }

        if (response.success === false) {
          throw new Error("Dashboard API returned success: false");
        }

        // Strict Zod Validation before caching or passing to Query cache.
        // Radimo sinhrono radi sprečavanja asinhronih race uslova, ali tolerišemo neusklađenosti radi stabilnosti
        const zodValidation = BffDashboardResponseSchema.safeParse(response);
        
        if (!zodValidation.success) {
          console.warn("[DashboardStats] Otkrivena neusklađenost šeme, ali nastavljamo sa radom radi stabilnosti i sprečavanja belih ekrana:", zodValidation.error);
          return response;
        }

        // Cache successful response to localStorage for offline access wrapped in structural envelope
        if (typeof window !== "undefined" && uid) {
          try {
            // Data Pruning: Create a lightweight copy to respect 5MB quota on mobile devices and WebViews
            const lightweightResponse = JSON.parse(JSON.stringify(response));
            if (lightweightResponse.stats) {
              const arraysToPrune = ['recentAds', 'recentApplications', 'analytics', 'chartData', 'smartMatches', 'trends'];
              arraysToPrune.forEach(key => {
                const arr = lightweightResponse.stats[key];
                if (Array.isArray(arr)) {
                  // Keep only top 5 items for offline preview to prevent storage overflow
                  lightweightResponse.stats[key] = arr.slice(0, 5);
                }
              });
            }

            const cacheEnvelope = {
              schemaVersion: SCHEMA_VERSION,
              cachedAt: Date.now(),
              data: lightweightResponse
            };
            localStorage.setItem(`dashboard_cache_${uid}`, JSON.stringify(cacheEnvelope));
            // Also store last active uid for ErrorBoundary lookup when uid might be empty on reload
            localStorage.setItem("dashboard_last_uid", uid);
          } catch (cacheErr) {
            console.warn("[Dashboard] Failed to save localStorage offline cache", cacheErr);
          }
        }

        return response;
      } catch (err) {
        const error = (err instanceof Error ? err : new Error(String(err))) as ApiError;
        const duration = Date.now() - startTime;
        const status = error.status || 
                       error.statusCode || 
                       error.response?.status || 
                       error.response?.statusCode || 
                       (error.message?.includes("401") ? 401 : error.message?.includes("403") ? 403 : undefined);
        const nav = typeof navigator !== "undefined" ? (navigator as { connection?: { effectiveType: string } }) : null;
        const networkType = nav?.connection?.effectiveType || "unknown";

        // Strict security cleanup for authorization failures
        const isAuthError = status === 401 || status === 403;
        if (isAuthError && typeof window !== "undefined") {
          try {
            console.warn(`[Dashboard Security] Auth error ${status} detected. Purging session data for security.`);
            if (uid) localStorage.removeItem(`dashboard_cache_${uid}`);
            localStorage.removeItem("dashboard_last_uid");
            
            // Blokiranje tranzitnih saobračaja pre čišćenja memorije
            interface QueryClientWithCancel extends QueryClient { cancelMutations?: () => Promise<void>; }
            const qc = queryClient as QueryClientWithCancel;
            if (typeof qc.cancelMutations === "function") {
              await qc.cancelMutations();
            }
            await queryClient.cancelQueries();
            // Perform deep-clearing of in-memory query client cache to prevent ghost sessions
            queryClient.removeQueries({ queryKey: dashboardKeys.all });
          } catch (_) { console.error("[DashboardStats] QueryClient cache cleanup error:", _); }
        }

        // Capture via local /api/logs with maximum contextual parameters
        apiClient.post("/logs", {
            level: "error",
            message: `dashboard_fetch_error: ${error instanceof Error ? error.message : String(error)}`,
            context: {
              uid,
              role,
              duration,
              statusCode: status,
              networkType,
              url: "/bff/dashboard",
              errorMsg: error instanceof Error ? error.message : String(error),
            },
            source: "DashboardBFF",
        }).catch(() => console.warn('[DashboardStats] Log dashboard fetch error failed'));

        // Fallback to offline cache upon connection retry/request failure (non-auth errors)
        if (!isAuthError && typeof window !== "undefined" && uid) {
          try {
            const rawCache = localStorage.getItem(`dashboard_cache_${uid}`);
            if (rawCache) {
              const cacheEnvelope = JSON.parse(rawCache);
              if (cacheEnvelope && cacheEnvelope.schemaVersion === SCHEMA_VERSION) {
                console.warn("[Offline Cache Fallback] Request failed with error, but falling back to local offline cache successfully:", cacheEnvelope.schemaVersion);
                return cacheEnvelope.data;
              }
            }
          } catch (_) { console.error("[DashboardStats] Offline localStorage cache parse error:", _); }
        }

        throw error;
      }
    },
    staleTime: isSlowConnection ? 60 * 60 * 1000 : 5 * 60 * 1000, // Enterprise Tiered-SWR: 5 min cache
    gcTime: isSlowConnection ? 120 * 60 * 1000 : 30 * 60 * 1000, 
    placeholderData: keepPreviousData, // Prevent UI from freezing during re-validation
    refetchOnMount: false, // DO NOT force fetch on mount if data is fresh
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnReconnect: !isSlowConnection, // Disable automatic background reconnect refetch on slow network
    retry: (failureCount, error: Error) => {
      if (isSlowConnection) {
        return false; // Prevent wasteful retries on low connection speeds
      }
      const err = error as { status?: number, statusCode?: number, response?: { status?: number, statusCode?: number }, message?: string };
      const status = err?.status || err?.statusCode || err?.response?.status || err?.response?.statusCode;
      const isAuthError = status === 401 || status === 403 || err?.message?.includes("401") || err?.message?.includes("403");
      if (isAuthError) {
        return false; // 0 retries
      }
      if (failureCount >= 1) {
        return false; // exactly 1 retry max (fails on first retry)
      }
      return true;
    },
    throwOnError: true,
    // Bitno: query se aktivira čim imamo uid. role ne sme biti uslov jer
    // može biti prazan string dok se getIdTokenResult() ne razreši, što bi
    // zauvek držalo dashboard u "N/A" stanju (query se nikada ne pokrene).
    enabled: !!uid,
    select,
  }) as UseQueryResult<TData, Error>;
}

// Referentialy stable static top-level selectors to maximize TanStack Query selector memoization benefits
const selectAdsCount = (res: BffDashboardResponse): number => res?.stats?.recentAds?.length || 0;
const selectApplicationsCount = (res: BffDashboardResponse): number => res?.stats?.recentApplications?.length || 0;
const selectTrends = (res: BffDashboardResponse): { date: string; views: number; applications: number; }[] => (res?.trends || []).map(t => ({
  date: t.name,
  views: t.pregledi,
  applications: t.prijave ?? 0
}));
const selectMetrics = (res: BffDashboardResponse): Required<BffDashboardResponse>["stats"] => res?.stats || {};
const selectRecentAds = (res: BffDashboardResponse): z.infer<typeof DashboardAdSchema>[] => res?.stats?.recentAds || [];
const selectRecentApplications = (res: BffDashboardResponse): z.infer<typeof DashboardApplicationSchema>[] => res?.stats?.recentApplications || [];

/**
 * High-frequency Operational Metrics (Wallet, Notifications)
 * Tier-1: Bypass heavy Redis/Firestore cache, near-real-time updates.
 */
export function useDashboardQuickMetrics<TData = QuickMetricsResponse>(
  select?: (data: QuickMetricsResponse) => TData
): UseQueryResult<TData, Error> {
  const { user } = useAuth();
  const uid = user?.id || user?.uid || "";
  
  return useQuery({
    queryKey: ["dashboard", "quick-metrics", uid],
    queryFn: async (): Promise<QuickMetricsResponse> => {
      const resp = await apiClient.get<QuickMetricsResponse | { data: QuickMetricsResponse }>("/bff/dashboard-metrics");
      // Handle Tier-1 Circuit Breaker / Sandbox metadata
      if (resp && typeof resp === 'object' && 'data' in resp) {
          return (resp as { data: QuickMetricsResponse }).data;
      }
      return resp as QuickMetricsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select,
    enabled: !!uid,
    retry: 1, // Only 1 retry for critical bypass
  } as any) as UseQueryResult<TData, Error>;
}

/**
 * Optimizovan klijentski selektor za broj oglasa (Ads Count).
 * Koristi QuickMetrics za ažurnost.
 */
export function useDashboardAdsCount(): UseQueryResult<number, Error> {
  return useDashboardQuickMetrics((data) => data.myAdsCount ?? 0);
}

/**
 * Optimizovan klijentski selektor za broj prijava (Applications Count).
 */
export function useDashboardApplicationsCount(): UseQueryResult<number, Error> {
  return useDashboardQuickMetrics((data) => data.unreadActivitiesCount ?? 0);
}

/**
 * Selektor za trend podatke i istoriju analitike.
 */
export function useDashboardTrends(): UseQueryResult<{ date: string; views: number; applications: number; }[], Error> {
  return useDashboardStats<{ date: string; views: number; applications: number; }[]>(selectTrends);
}

/**
 * Selektor za brze metrike (operativne metrike).
 * Sada kombinuje Heavy stats sa QuickMetrics za "Total Views" i "Wallet".
 */
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

/**
 * Selektor za nedavne oglase.
 */
export function useDashboardRecentAds(): UseQueryResult<z.infer<typeof DashboardAdSchema>[], Error> {
  return useDashboardStats<z.infer<typeof DashboardAdSchema>[]>(selectRecentAds);
}

/**
 * Selektor za nedavne prijave.
 */
export function useDashboardRecentApplications(): UseQueryResult<z.infer<typeof DashboardApplicationSchema>[], Error> {
  return useDashboardStats<z.infer<typeof DashboardApplicationSchema>[]>(selectRecentApplications);
}


