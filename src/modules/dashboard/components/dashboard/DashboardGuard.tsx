import { Component, ErrorInfo, ReactNode } from "react";
import { queryClient } from "@/src/lib/queryClient";
import {
  WifiOff,
  RotateCw,
  TrendingUp,
  Users,
  Briefcase,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Card, Badge } from "@svet-gradjevine/ui";

// Highly resilient, beautiful, lightweight, and 100% pure-SVG trend charts that bypass Recharts layout or compile weight.
function SvgTrendChartAmber({ data }: { data: { name: string; pregledi: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.pregledi || 0), 10);
  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingBottom - ((d.pregledi || 0) / maxVal) * chartHeight;
    return { x, y, name: d.name, val: d.pregledi || 0 };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="recoveredColorViews" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#febf0d" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#febf0d" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
        const y = paddingTop + ratio * chartHeight;
        return (
          <line
            key={idx}
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke="rgba(255,255,255,0.03)"
            strokeDasharray="3,3"
          />
        );
      })}

      {/* Area under the line */}
      <path d={areaPath} fill="url(#recoveredColorViews)" />

      {/* The main trend line */}
      <path d={linePath} fill="none" stroke="#febf0d" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points with labels */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#febf0d"
            stroke="#0f172a"
            strokeWidth={1}
          />
          {/* Label under point */}
          <text
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.3)"
            fontSize={9}
            fontFamily="monospace"
          >
            {p.name}
          </text>
          {/* Value above point */}
          <text
            x={p.x}
            y={p.y - 6}
            textAnchor="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize={8}
            fontFamily="monospace"
          >
            {p.val}
          </text>
        </g>
      ))}
    </svg>
  );
}

function SvgTrendChartIndigo({ data }: { data: { name: string; pregledi: number }[] }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d.pregledi || 0), 10);
  const width = 500;
  const height = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingBottom - ((d.pregledi || 0) / maxVal) * chartHeight;
    return { x, y, name: d.name, val: d.pregledi || 0 };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - paddingBottom).toFixed(1)} Z`;

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="colorViewsOffline" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
        const y = paddingTop + ratio * chartHeight;
        return (
          <line
            key={idx}
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke="#f1f5f9"
            strokeDasharray="3,3"
          />
        );
      })}

      {/* Area under the line */}
      <path d={areaPath} fill="url(#colorViewsOffline)" />

      {/* The main trend line */}
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Points with labels */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle
            cx={p.x}
            cy={p.y}
            r={3}
            fill="#6366f1"
            stroke="#ffffff"
            strokeWidth={1}
          />
          {/* Label under point */}
          <text
            x={p.x}
            y={height - 6}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={9}
            fontFamily="sans-serif"
          >
            {p.name}
          </text>
          {/* Value above point */}
          <text
            x={p.x}
            y={p.y - 6}
            textAnchor="middle"
            fill="#64748b"
            fontSize={8}
            fontFamily="monospace"
          >
            {p.val}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface Props {
  children?: ReactNode;
  title?: string;
  variant?: "full" | "inline";
  queryKeysToReset?: any[][];
}

interface State {
  hasError: boolean;
  errorMsg: string;
  cacheData: any | null;
  isRetrying: boolean;
}

export default class DashboardGuard extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: "",
    cacheData: null,
    isRetrying: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      "[DashboardErrorBoundary] Caught exception:",
      error,
      errorInfo,
    );

    // Extract active TanStack Query cache state for deep debugging
    const activeCacheState = queryClient
      .getQueryCache()
      .getAll()
      .map((q) => ({
        queryKey: q.queryKey,
        state: q.state.status,
        dataUpdatedAt: q.state.dataUpdatedAt,
        errorUpdatedAt: q.state.errorUpdatedAt,
        isStale: q.isStale(),
      }));

    // Log the event server-side
    /*
    apiClient
      .post("/logs", {
        level: "error",
        source: "DashboardErrorBoundary",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack || "",
        tanstackState: activeCacheState,
      })
      .catch((e) =>
        console.warn(
          "[DashboardErrorBoundary] Network log fallback skipped",
          e,
        ),
      );
    */

    this.loadLocalStorageCache();
  }

  private loadLocalStorageCache() {
    try {
      if (typeof window === "undefined") return;

      const uid = localStorage.getItem("dashboard_last_uid") || "";
      let rawCache = "";

      if (uid) {
        rawCache = localStorage.getItem(`dashboard_cache_${uid}`) || "";
      }

      if (!rawCache) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("dashboard_cache_")) {
            rawCache = localStorage.getItem(key) || "";
            break;
          }
        }
      }

      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        this.setState({ cacheData: parsed });
      }
    } catch (e) {
      console.error(
        "[DashboardErrorBoundary] Failed to load offline cache:",
        e,
      );
    }
  }

  private handleRetry = () => {
    this.setState({ isRetrying: true });

    try {
      const titleLower = (this.props.title || "").toLowerCase();
      const keysToInvalidate: any[][] = [];

      if (this.props.queryKeysToReset) {
        keysToInvalidate.push(...this.props.queryKeysToReset);
      } else {
        // Fallback intelligent category mapping based on title
        if (
          titleLower.includes("trend") ||
          titleLower.includes("poset") ||
          titleLower.includes("grafikon")
        ) {
          keysToInvalidate.push(["dashboard", "trends"], ["dashboard", "bff"]);
        } else if (
          titleLower.includes("analitik") ||
          titleLower.includes("stat")
        ) {
          keysToInvalidate.push(["dashboard", "bff"], ["dashboard", "stats"]);
        } else if (
          titleLower.includes("ai") ||
          titleLower.includes("asistent") ||
          titleLower.includes("akci")
        ) {
          keysToInvalidate.push(["dashboard", "bff"], ["ai"]);
        } else if (
          titleLower.includes("oglasi") ||
          titleLower.includes("moj") ||
          titleLower.includes("ad")
        ) {
          keysToInvalidate.push(["dashboard", "myAds"], ["dashboard", "bff"]);
        } else if (
          titleLower.includes("prihod") ||
          titleLower.includes("finans") ||
          titleLower.includes("uplat")
        ) {
          keysToInvalidate.push(["admin", "finances"], ["dashboard", "bff"]);
        } else {
          keysToInvalidate.push(["dashboard"]);
        }
      }

      // Dynamic clean-up from TanStack Query cache: reset failed queries
      const allQueries = queryClient.getQueryCache().getAll();
      const failedQueries = allQueries.filter(
        (q) => q.state.status === "error",
      );

      failedQueries.forEach((q) => {
        if (import.meta.env.DEV) console.log(
          "[DashboardErrorBoundary] Resubmitting/Resetting Errored Query:",
          q.queryKey,
        );
        queryClient.resetQueries({ queryKey: q.queryKey, exact: true });
      });

      // Force remove and invalidate queries
      keysToInvalidate.forEach((key) => {
        if (import.meta.env.DEV) console.log(
          "[DashboardErrorBoundary] Force Invalidation & Clear:",
          key,
        );
        queryClient.removeQueries({ queryKey: key });
        queryClient.invalidateQueries({ queryKey: key, refetchType: "all" });
      });

      // Refetch active ones
      queryClient.refetchQueries({ type: "active" });
    } catch (err) {
      console.error(
        "[DashboardErrorBoundary] Failed to clean query cache gracefully:",
        err,
      );
    }

    // Smooth reset to allow parent components to stay alive
    setTimeout(() => {
      this.setState({
        hasError: false,
        errorMsg: "",
        cacheData: null,
        isRetrying: false,
      });

      // If full page variant, consider reload as last resort if state reset doesn't help
      if (this.props.variant === "full") {
        console.info(
          "[DashboardErrorBoundary] Attempting soft reset. If error persists, manual refresh may be needed.",
        );
      }
    }, 1000);
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.variant === "inline") {
        const payload = this.state.cacheData;
        const isActivity = this.props.title?.toLowerCase().includes("aktivn");

        return (
          <Card className="w-full h-full min-h-[300px] bg-white/[0.01] border border-white/5 rounded-[12px] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0 mt-1">
                  <WifiOff className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white/95 tracking-tight flex items-center gap-1.5 flex-wrap">
                    {this.props.title || "Pregled"}
                    <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Rad van mreže
                    </span>
                  </h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Trenutno nemate internet vezu. Prikazujemo vam poslednje sačuvane podatke sa ovog uređaja kako biste mogli da nastavite sa radom.
                  </p>
                </div>
              </div>

              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <RotateCw
                  className={`w-3.5 h-3.5 ${this.state.isRetrying ? "animate-spin" : ""}`}
                />
                {this.state.isRetrying ? "Provera veze..." : "Pokušaj ponovo"}
              </button>
            </div>
            
            <div className="flex-1 w-full min-h-[150px] flex items-center justify-center border-t border-white/5 pt-4">
              {isActivity ? (
                <div className="text-center p-4">
                  <span className="material-symbols-outlined text-white/20 text-3xl mb-2 block">history</span>
                  <span className="text-white/40 text-xs block">Trenutno ne možemo učitati nove aktivnosti dok se ne povežete na internet.</span>
                </div>
              ) : (
                <span className="text-white/30 text-xs">Prikaz je ograničen u režimu rada bez interneta.</span>
              )}
            </div>
          </Card>
        );
      }

      // 2. FULL VIEW VARIANT (Offline fallback)
      const payload = this.state.cacheData;
      const statsObj = payload?.data?.stats || payload?.stats || {};
      const trendsRaw = payload?.data?.trends || payload?.trends;
      const trends = Array.isArray(trendsRaw) ? trendsRaw : [];

      // Safe extract values
      const recentAds = statsObj?.recentAds || [];
      const recentApps = statsObj?.recentApplications || [];

      const statsList = [
        {
          label: "Pregledi Oglasa",
          value:
            statsObj?.viewsCount ??
            (statsObj?.employerStats?.totalAdsCount ? "0" : "Dostupno bez interneta"),
          icon: TrendingUp,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Aktivne Prijave",
          value: recentApps.length || "0",
          icon: Users,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
        },
        {
          label: "Aktivni Oglasi",
          value: recentAds.length || "0",
          icon: Briefcase,
          color: "text-amber-500",
          bg: "bg-amber-50",
        },
        {
          label: "Dostupni Krediti",
          value: statsObj?.credits || "Zahteva internet",
          icon: CreditCard,
          color: "text-purple-500",
          bg: "bg-purple-50",
        },
      ];

      return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
          {/* Calming Warning Banner */}
          <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                <WifiOff className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                  Trenutno nemate internet vezu
                </h2>
                <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                  Došlo je do mrežnih smetnji ili prekida veze sa serverom. Kako
                  bismo vam omogućili nesmetan rad, očitali smo poslednje
                  sačuvane podatke direktno iz lokalne memorije vašeg uređaja.
                  Možete slobodno pregledati trenutno stanje.
                </p>
              </div>
            </div>

            <button
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] focus:outline-none disabled:opacity-50 shrink-0"
            >
              <RotateCw
                className={`w-4 h-4 ${this.state.isRetrying ? "animate-spin" : ""}`}
              />
              {this.state.isRetrying ? "Provera veze..." : "Pokušaj ponovo"}
            </button>
          </div>

          {/* Quick Offline stats if cache present */}
          {this.state.cacheData ? (
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="px-3 py-1 font-semibold tracking-wider text-slate-600 text-[10px] uppercase bg-slate-200/60 border-none"
                >
                  Prikazujemo podatke koji su ranije sačuvani
                </Badge>
              </div>

              {/* Grid cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsList.map((stat, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3 rounded-[12px] ${stat.bg} ${stat.color}`}
                      >
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold tracking-wide bg-slate-100 text-slate-500 uppercase border-none"
                      >
                        KEŠIRANO
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-black text-slate-800 mt-1">
                        {stat.value}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charts & Listings row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Visited trends cached */}
                <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-slate-800">
                        Analitika poseta (Sačuvani podaci)
                      </h3>
                      <span className="text-xs text-slate-400 font-medium font-mono">
                        Poslednja 7 dana
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">
                      Grafički prikaz lokalno učitanih trendova pregleda vaših
                      aktivnih oglasa.
                    </p>
                  </div>

                  <div className="h-[260px] w-full flex items-center justify-center">
                    {trends && trends.length > 0 ? (
                      <SvgTrendChartIndigo data={trends} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100">
                        <span className="text-gray-400 text-xs">
                          Trenutno nemamo ranije sačuvane podatke za prikaz
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 2. Recent listings cached */}
                <Card className="p-6">
                  <h3 className="text-base font-bold text-slate-800 mb-4">
                    Moji nedavni oglasi (Sačuvani podaci)
                  </h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {recentAds && recentAds.length > 0 ? (
                      recentAds.map((item: any, idx: number) => (
                        <div
                          key={item.id || `ad-${idx}`}
                          className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-2 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-xs font-bold text-slate-800 truncate block max-w-[170px]">
                              {item.title}
                            </span>
                            <Badge
                              variant={
                                item.status === "active"
                                  ? "success"
                                  : "secondary"
                              }
                              className="text-[9px] px-1.5 py-0.5 border-none"
                            >
                              {item.status === "active" ? "Aktivan" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Sektor: {item.category || "Opšte"}</span>
                            <span>{item.viewsCount || 0} pregleda</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-100">
                        <p className="text-slate-400 text-xs">
                          Trenutno nemamo ranije sačuvane oglase za prikaz.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            /* fallback when absolutely no cache exists in localStorage */
            <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Potreban je internet za prikaz ovih informacija
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  Žao nam je, u ovom trenutku nemate sačuvanih lokalnih kopija
                  podataka za ovaj modul. Molimo vas proverite mrežnu vezu i
                  kliknite ispod za pokušaj osvežavanja.
                </p>
              </div>
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98]"
              >
                <RotateCw
                  className={`w-4 h-4 ${this.state.isRetrying ? "animate-spin" : ""}`}
                />
                Pokušaj ponovo
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
