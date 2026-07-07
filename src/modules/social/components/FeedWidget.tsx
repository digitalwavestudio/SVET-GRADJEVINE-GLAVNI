import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/apiClient";
import { useAuth } from "@/src/context/AuthContext";
import { Link } from "react-router-dom";

interface Activity {
  id: string;
  actorId: string;
  actorName: string;
  actorLogo: string | null;
  type: "new_ad" | "premium_upgrade" | "company_verified" | "logo_changed" | "cover_changed";
  targetId: string;
  targetType: string;
  title: string;
  createdAt: { _seconds: number; _nanoseconds: number } | string;
}

const TYPE_LABELS: Record<string, string> = {
  new_ad: "je postavio/la novi oglas",
  premium_upgrade: "je unapredio/la oglas na Premium",
  company_verified: "je verifikovan/a",
  logo_changed: "je promenio/la logo",
  cover_changed: "je promenio/la naslovnu sliku",
};

const TYPE_ICONS: Record<string, string> = {
  new_ad: "campaign",
  premium_upgrade: "stars",
  company_verified: "verified",
  logo_changed: "image",
  cover_changed: "image",
};

function formatTime(createdAt: any): string {
  if (!createdAt) return "";
  const seconds = createdAt._seconds || (typeof createdAt === "string" ? Date.parse(createdAt) / 1000 : Date.now() / 1000);
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return "upravo";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(seconds * 1000).toLocaleDateString("sr-RS");
}

function getTargetPath(activity: Activity): string {
  const typeMap: Record<string, string> = {
    jobs: "posao",
    machines: "gradjevinske-masine",
    accommodations: "smestaj",
    plots: "nekretnine",
    caterings: "ketering-provajder",
    marketplace: "alat-i-oprema",
    companies: "firma",
  };
  const prefix = typeMap[activity.targetType] || activity.targetType;
  return `/${prefix}/${activity.targetId}`;
}

interface FeedWidgetProps {
  className?: string;
}

export function FeedWidget({ className = "" }: FeedWidgetProps) {
  const { user } = useAuth();

  const { data: globalData, isLoading } = useQuery<Activity[]>({
    queryKey: ["feed", "global"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<{ activities: Activity[] }>("/feed/global?limit=15");
        return res?.activities ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const activities = globalData || [];

  if (isLoading) {
    return (
      <section className={`${className}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <h2 className="text-lg md:text-xl font-black font-headline uppercase tracking-wider text-secondary mb-6">
            Aktivnosti
          </h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!activities.length) return null;

  return (
    <section className={`${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-xl font-black font-headline uppercase tracking-wider text-secondary">
            Aktivnosti
          </h2>
          {user && (
            <Link
              to="/feed"
              className="text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-secondary transition-colors"
            >
              Moj feed
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {activities.slice(0, 8).map((activity) => (
            <Link
              key={activity.id}
              to={getTargetPath(activity)}
              className="block bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {activity.actorLogo ? (
                    <img src={activity.actorLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      {TYPE_ICONS[activity.type] || "notifications"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 leading-relaxed">
                    <span className="font-bold text-white">{activity.actorName}</span>{" "}
                    <span className="text-on-surface-variant">{TYPE_LABELS[activity.type] || activity.type}</span>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1 truncate group-hover:text-slate-300 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 mt-1 uppercase tracking-wider">
                    {formatTime(activity.createdAt)}
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-sm mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
