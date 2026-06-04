/**
 * Centralizovani rečnik prefiksa za Redis ključeve.
 * Batch 7: Redis Cache Key Normalization & Performance Cleanup
 */
export const CACHE_PREFIXES = {
  // ADS
  AD_DETAIL: "ads:detail:",
  AD_LISTING_PAGE: "ads:listing:",
  AD_SEARCH: "ads:search:",
  
  // DASHBOARD
  DASHBOARD_STATS: "dashboard:stats:",
  EMPLOYER_STATS: "employer:stats:",
  EMPLOYER_TRENDS: "employer:trends:",
  SMART_MATCHES: "smart:matches:",
  ADMIN_STATS: "admin:stats:",
  
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
  
  // SYSTEM
  LOCK: "lock:",
  QOS: "qos:",
  SWR_ENVELOPE: "swr:",
  SWR_LOCK: "swr_lock:",
  SWR_BACKOFF: "swr_backoff:",
  CONFIG: "config:",
  THROTTLING: "throttling:",
  
  // SEO & CONTENT
  SEO_SCHEMA: "seo:schema:",
  SEO_PRERENDER: "seo:prerender:",
  MAGAZINE_STATS: "magazine:stats:",
  MAGAZINE_CTR: "magazine:ctr:",
  MAGAZINE_CLICKS: "magazine:clicks:",
  
  // BOT DEFENSE
  BOT_RATE_LIMIT: "bot:rate_limit:",
} as const;

/**
 * Helperi za generisanje konzistentnih ključeva
 */
export const CacheKeys = {
  // Ads
  adDetail: (id: string) => `${CACHE_PREFIXES.AD_DETAIL}${id}`,
  adListing: (params: string) => `${CACHE_PREFIXES.AD_LISTING_PAGE}${params}`,
  
  // Dashboard
  dashboardStats: (userId: string) => `${CACHE_PREFIXES.DASHBOARD_STATS}${userId}`,
  employerStats: (uid: string) => `${CACHE_PREFIXES.EMPLOYER_STATS}${uid}`,
  employerTrends: (uid: string) => `${CACHE_PREFIXES.EMPLOYER_TRENDS}${uid}`,
  smartMatches: (uid: string) => `${CACHE_PREFIXES.SMART_MATCHES}${uid}`,
  
  // Metrics
  viewThrottling: (ip: string, coll: string, id: string) => 
    `${CACHE_PREFIXES.METRICS_VIEW_CACHE}${ip}_${coll}_${id}`,
  userAnalytics: (uid: string, days?: number) => 
    days ? `${CACHE_PREFIXES.METRICS_USER_ANALYTICS}${uid}:${days}` : `${CACHE_PREFIXES.METRICS_USER_ANALYTICS}${uid}`,
  seoEdgeHits: () => "metrics:seo_edge_hits",
  seoEdgeMisses: () => "metrics:seo_edge_misses",
  botTrapBlocks: () => "metrics:bot_trap_blocks",
    
  // Magazine
  magazineClicks: (articleId: string, targetType: string) => 
    `${CACHE_PREFIXES.MAGAZINE_CLICKS}${articleId}:${targetType}`,
    
  // SEO
  seoPrerender: (path: string, page: number) => 
    `${CACHE_PREFIXES.SEO_PRERENDER}${path.replace(/\/$/, "") || "/"}:p${page}`,
    
  // Bot
  botRateLimit: (ip: string) => `${CACHE_PREFIXES.BOT_RATE_LIMIT}${ip}`,
    
  // Lock
  lock: (name: string) => `${CACHE_PREFIXES.LOCK}${name}`,
  
  // QOS
  qosReadIntent: (second: number) => `${CACHE_PREFIXES.QOS}read_intent:${second}`,
  
  // SWR
  swr: (key: string) => `${CACHE_PREFIXES.SWR_ENVELOPE}${key}`,
  swrLock: (key: string) => `${CACHE_PREFIXES.SWR_LOCK}${key}`,
  swrBackoff: (key: string) => `${CACHE_PREFIXES.SWR_BACKOFF}${key}`,
};
