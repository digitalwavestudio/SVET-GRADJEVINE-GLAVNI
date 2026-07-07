import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "@/src/lib/apiClient";
import { useAuth } from "@/src/context/AuthContext";
import SeoHead from "@/src/components/SeoHead";

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

export default function FeedPage() {
  const { user } = useAuth();

  const isPersonalized = !!user;

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: isPersonalized ? ["feed", "personalized"] : ["feed", "global"],
    queryFn: async () => {
      try {
        const endpoint = isPersonalized ? "/feed/personalized" : "/feed/global";
        const res = await apiClient.get<{ activities: Activity[] }>(`${endpoint}?limit=50`);
        return res?.activities ?? [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      <SeoHead
        title="Aktivnosti | Svet Građevine"
        description="Pratite najnovije aktivnosti na platformi"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-32 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tight text-white">
              Aktivnosti
            </h1>
            <p className="text-on-surface-variant text-sm mt-2 font-headline">
              {isPersonalized
                ? "Najnovije aktivnosti firmi koje pratite"
                : "Najnovije aktivnosti na platformi"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !activities?.length ? (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">stream</span>
            <h3 className="text-lg font-bold text-white mt-4">Nema aktivnosti</h3>
            <p className="text-on-surface-variant text-sm mt-2">
              {isPersonalized
                ? "Zapratite firme da biste videli njihove aktivnosti."
                : "Trenutno nema aktivnosti na platformi."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Link
                key={activity.id}
                to={getTargetPath(activity)}
                className="block bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {activity.actorLogo ? (
                      <img src={activity.actorLogo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-lg text-on-surface-variant">
                        {TYPE_ICONS[activity.type] || "notifications"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base text-slate-200 leading-relaxed">
                      <span className="font-bold text-white">{activity.actorName}</span>{" "}
                      <span className="text-on-surface-variant">{TYPE_LABELS[activity.type] || activity.type}</span>
                    </p>
                    <p className="text-sm text-on-surface-variant mt-1 group-hover:text-slate-300 transition-colors">
                      {activity.title}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider whitespace-nowrap">
                      {formatTime(activity.createdAt)}
                    </p>
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity block">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
