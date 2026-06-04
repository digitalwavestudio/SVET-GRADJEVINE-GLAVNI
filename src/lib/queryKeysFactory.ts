export const queryKeys = {
  // Global
  systemConfig: ['systemConfig'] as const,
  platformSettings: ['settings', 'platform'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
  adminStats: ['adminStats'] as const,

  // User
  user: {
    profile: (userId: string) => ['user-session', userId, 'profile'] as const,
    businessProfile: (userId: string) => ['user-session', userId, 'business-profile'] as const,
    favorites: (userId: string) => ['user-session', userId, 'favorites'] as const,
    myAds: (userId: string) => ['user-session', userId, 'myAds'] as const,
    applications: (userId: string, role: 'applicant' | 'employer') => ['user-session', userId, 'userApplications', role] as const,
    inbox: (userId: string) => ['user-session', userId, 'messages', 'inbox'] as const,
  },

  // Generic Ads Broad Invalidation
  ads: {
    all: ['ads'] as const,
  },

  // Entities (Ads, Jobs, Construction, Accommodations, Machines, etc.)
  jobs: {
    all: ['jobs'] as const,
    lists: () => [...queryKeys.jobs.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.jobs.lists(), filters] as const,
    details: () => [...queryKeys.jobs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.jobs.details(), id] as const,
    premium: () => [...queryKeys.jobs.all, 'premium'] as const,
    urgent: () => [...queryKeys.jobs.all, 'urgent'] as const,
    applied: (jobId: string, applicantId: string) => [...queryKeys.jobs.all, 'applied', jobId, applicantId] as const,
    similar: (jobId: string) => [...queryKeys.jobs.all, 'similar', jobId] as const,
    applications: () => ['applications'] as const,
    userApplications: (userId: string, role: string) => [...queryKeys.jobs.applications(), 'user', userId, role] as const,
    jobApplications: (jobId: string) => [...queryKeys.jobs.applications(), 'job', jobId] as const,
  },
  accommodations: {
    all: ['accommodations'] as const,
    lists: () => [...queryKeys.accommodations.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.accommodations.lists(), filters] as const,
    details: () => [...queryKeys.accommodations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accommodations.details(), id] as const,
  },
  machines: {
    all: ['machines'] as const,
    lists: () => [...queryKeys.machines.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.machines.lists(), filters] as const,
    details: () => [...queryKeys.machines.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.machines.details(), id] as const,
  },
  catering: {
    all: ['catering'] as const,
    lists: () => [...queryKeys.catering.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.catering.lists(), filters] as const,
    details: () => [...queryKeys.catering.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.catering.details(), id] as const,
  },
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },
  masters: {
    all: ['masters'] as const,
    lists: () => [...queryKeys.masters.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.masters.lists(), filters] as const,
    details: () => [...queryKeys.masters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.masters.details(), id] as const,
  },
  marketplace: {
    all: ['marketplace'] as const,
    lists: () => [...queryKeys.marketplace.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.marketplace.lists(), filters] as const,
    details: () => [...queryKeys.marketplace.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.marketplace.details(), id] as const,
  },
  realEstate: {
    all: ['realEstate'] as const,
    lists: () => [...queryKeys.realEstate.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.realEstate.lists(), filters] as const,
    details: () => [...queryKeys.realEstate.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.realEstate.details(), id] as const,
    construction: () => ['construction', 'all-data'] as const,
  },

  // Admin
  admin: {
    finances: ['adminFinances'] as const,
    pendingDeposits: ['adminPendingDeposits'] as const,
    dlq: ['admin', 'dlq'] as const,
    monitoring: ['admin', 'monitoring'] as const,
    circuitBreakers: ['admin', 'circuit-breakers'] as const,
    abuseReports: ['admin', 'abuse-reports'] as const,
    support: ['admin', 'support'] as const,
    verificationRequests: ['admin', 'verification-requests'] as const,
    auditLogs: ['admin', 'audit-logs'] as const,
    syncStatus: ['admin', 'sync-status'] as const,
    monitoringMetrics: ['admin', 'monitoring-metrics'] as const,
    moderationQueue: ['admin-moderation-queue'] as const,
    dlqItems: ['admin', 'dlq-items'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    detailed: (userId: string) => ['user-session', userId, 'analytics-detailed'] as const,
    adminStats: ['adminStats'] as const,
    pseoInsights: (collection?: string, grad?: string, zanimanje?: string) => 
      ['stats', 'pseo-insights', collection || '', grad || '', zanimanje || ''] as const,
    statsCounts: ['stats', 'counts'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    feed: (userId: string) => ['user-session', userId, 'activities-feed'] as const,
    poll: (userId: string) => ['user-session', userId, 'notifications', 'poll'] as const,
  },

  // Wallet
  wallet: {
    transactions: (userId: string) => ['user-session', userId, 'walletTransactions'] as const,
  }
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  bff: (role: string, uid: string) => ['user-session', uid, 'dashboard', 'bff', role] as const,
  admin: () => [...dashboardKeys.all, 'admin'] as const,
  employer: (uid: string) => [...dashboardKeys.all, 'employer', uid] as const,
  master: (uid: string) => [...dashboardKeys.all, 'master', uid] as const,
  candidate: (uid: string) => [...dashboardKeys.all, 'candidate', uid] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  financeSummary: () => [...dashboardKeys.all, 'finance-summary'] as const,
  userStats: (uid: string) => ['user-session', uid, 'stats'] as const,
  adminStats: () => ['adminStats'] as const,
  adminFinances: () => ['adminFinances'] as const,
  adminAbuseReports: () => ['adminAbuseReports'] as const,
  adminUsers: (searchQ: string) => ['adminUsers', searchQ] as const,
  adminSupportTickets: () => ['adminSupportTickets'] as const,
  adminModerationQueue: () => ['adminModerationQueue'] as const,
  statsCounts: () => ['stats', 'counts'] as const,
  statsPseoInsights: (collection?: string, grad?: string, zanimanje?: string) => ['stats', 'pseo-insights', collection || '', grad || '', zanimanje || ''] as const,
  
  // Favorites
  favorites: {
    all: ['favorites'] as const,
    user: (userId: string) => ['user-session', userId, 'favorites'] as const,
  },

  // My Ads
  myAds: {
    all: ['myAds'] as const,
    user: (userId: string) => ['user-session', userId, 'myAds'] as const,
  },

  // Messages
  messages: {
    inbox: (userId: string) => ['user-session', userId, 'messages', 'inbox'] as const,
    chat: (activeConversationId: string) => ['messages', 'chat', activeConversationId] as const,
  },

  // Saved Searches
  savedSearches: {
    all: ['saved-searches'] as const,
    user: (userId: string) => ['user-session', userId, 'saved-searches'] as const,
  }
};

