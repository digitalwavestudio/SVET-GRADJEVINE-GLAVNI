export const CACHE_PREFIXES = {
  // ADS
  AD_DETAIL: "ads:detail:",
  AD_LISTING_PAGE: "ads:listing:",
  AD_SEARCH: "ads:search:",
  PUBLIC_ADS: "public_ads_",
  SEARCH_ADS: "search_ads_v2_",
  MY_ADS: "myAds_",
  PUBLIC_PROFILE_ADS: "publicProfileAds_",
  PROMOTED: "promoted_",

  // JOBS
  PUBLIC_JOBS: "public_jobs_",
  HOMEPAGE_PREMIUM_JOBS: "homepage_premium_jobs_",
  HOMEPAGE_URGENT_JOBS: "homepage_urgent_jobs_",

  // SEARCH
  UNIFIED_SEARCH: "unified_search_",
  UNIFIED_SEARCH_JOB: "unified_search_job_",
  FALLBACK_SEARCH: "fallback_search_",

  // DASHBOARD
  DASHBOARD_STATS: "dashboard:stats:",
  EMPLOYER_STATS: "employer:stats:",
  EMPLOYER_TRENDS: "employer:trends:",
  SMART_MATCHES: "smart:matches:",
  ADMIN_STATS: "admin:stats:",
  ADMIN_MODERATION_QUEUE: "admin_moderation_queue_",
  ADMIN_GLOBAL_STATS: "admin_global_stats",
  ADMIN_CHART_DATA: "admin_chart_data",

  // METRICS
  METRICS_VIEW_BUFFER: "metrics:pending_views",
  METRICS_USER_STATS: "metrics:pending_user_stats",
  METRICS_DAILY_STATS: "metrics:pending_daily_stats",
  METRICS_FAVS_AD: "metrics:pending_favs_ad",
  METRICS_FAVS_USER: "metrics:pending_favs_user",
  METRICS_BOT_HITS: "metrics:bot_hits",
  METRICS_BOT_PATHS: "metrics:bot_paths",
  METRICS_VIEW_CACHE: "metrics:view_cache:",
  METRICS_USER_ANALYTICS: "metrics:user_analytics:",
  METRICS_OUTBOX_STATS: "metrics:outbox_stats",
  METRICS_SEO_EDGE_HITS: "metrics:seo_edge_hits",
  METRICS_SEO_EDGE_MISSES: "metrics:seo_edge_misses",
  METRICS_BOT_TRAP_BLOCKS: "metrics:bot_trap_blocks",

  // SYSTEM
  LOCK: "lock:",
  QOS: "qos:",
  SWR_ENVELOPE: "swr:",
  SWR_LOCK: "swr_lock:",
  SWR_BACKOFF: "swr_backoff:",
  CONFIG: "config:",
  THROTTLING: "throttling:",
  DLQ_IS_EMPTY: "dlq_is_empty",
  OUTBOX_HAS_PENDING: "outbox_has_pending",
  OUTBOX_BACKOFF_LEVEL: "outbox_backoff_level",
  OUTBOX_IS_EMPTY: "outbox_is_empty",
  OUTBOX_TASKS_HAS_PENDING: "outbox_tasks_has_pending",

  // AUTH
  USER_PROFILE_CACHE: "user:profile:cache:",
  AUTH_SESSION: "auth_session:",

  // PUBLIC PROFILE
  PUBLIC_PROFILE: "user:pub:profile:",

  // SEO & CONTENT
  SEO_SCHEMA: "seo:schema:",
  SEO_PRERENDER: "seo:prerender:",
  SEO_RENDER_CACHE: "seo_render_cache:",
  SEO_SITEMAP_INDEX: "seo:sitemap_index",
  DEAD_PATH: "dead_path:",
  MAGAZINE_STATS: "magazine:stats:",
  MAGAZINE_CTR: "magazine:ctr:",
  MAGAZINE_CLICKS: "magazine:clicks:",
  MAGAZINE_LIST: "magazine_list_",

  // SETTINGS
  SETTINGS_SWR: "settings_swr_",

  // ANALYTICS
  ANALYTICS_TREND: "analytics_trend:",

  // BOT DEFENSE
  BOT_RATE_LIMIT: "bot:rate_limit:",

  // HOUSKEEPING
  HOUSEKEEPING_LAST_RUN: "housekeeping_last_run",

  // ADMIN METRICS
  ADMIN_GLOBAL_METRICS_CACHE: "admin_global_metrics:cache",
  PREMIUM_PARTNERS_V2: "swr:premium_partners_v2",
} as const;

export const CacheKeys = {
  adDetail: (id: string) => `${CACHE_PREFIXES.AD_DETAIL}${id}`,
  adListing: (params: string) => `${CACHE_PREFIXES.AD_LISTING_PAGE}${params}`,
  dashboardStats: (userId: string) => `${CACHE_PREFIXES.DASHBOARD_STATS}${userId}`,
  employerStats: (uid: string) => `${CACHE_PREFIXES.EMPLOYER_STATS}${uid}`,
  employerTrends: (uid: string) => `${CACHE_PREFIXES.EMPLOYER_TRENDS}v2:${uid}`,
  smartMatches: (uid: string) => `${CACHE_PREFIXES.SMART_MATCHES}${uid}`,
  viewThrottling: (ip: string, coll: string, id: string) =>
    `${CACHE_PREFIXES.METRICS_VIEW_CACHE}${ip}_${coll}_${id}`,
  userAnalytics: (uid: string, days?: number) =>
    days ? `${CACHE_PREFIXES.METRICS_USER_ANALYTICS}${uid}:${days}` : `${CACHE_PREFIXES.METRICS_USER_ANALYTICS}${uid}`,
  seoEdgeHits: () => CACHE_PREFIXES.METRICS_SEO_EDGE_HITS,
  seoEdgeMisses: () => CACHE_PREFIXES.METRICS_SEO_EDGE_MISSES,
  botTrapBlocks: () => CACHE_PREFIXES.METRICS_BOT_TRAP_BLOCKS,
  magazineClicks: (articleId: string, targetType: string) =>
    `${CACHE_PREFIXES.MAGAZINE_CLICKS}${articleId}:${targetType}`,
  seoPrerender: (path: string, page: number) =>
    `${CACHE_PREFIXES.SEO_PRERENDER}${path.replace(/\/$/, "") || "/"}:p${page}`,
  botRateLimit: (ip: string) => `${CACHE_PREFIXES.BOT_RATE_LIMIT}${ip}`,
  lock: (name: string) => `${CACHE_PREFIXES.LOCK}${name}`,
  qosReadIntent: (second: number) => `${CACHE_PREFIXES.QOS}read_intent:${second}`,
  swr: (key: string) => `${CACHE_PREFIXES.SWR_ENVELOPE}${key}`,
  swrLock: (key: string) => `${CACHE_PREFIXES.SWR_LOCK}${key}`,
  swrBackoff: (key: string) => `${CACHE_PREFIXES.SWR_BACKOFF}${key}`,
  userPublicProfile: (uid: string) => `${CACHE_PREFIXES.PUBLIC_PROFILE}${uid}`,
};
