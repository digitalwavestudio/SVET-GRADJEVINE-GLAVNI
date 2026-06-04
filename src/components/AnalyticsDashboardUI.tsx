import React from 'react';
import { TrendingUp, Users, MapPin, Briefcase, ChevronRight, Activity, Cpu } from 'lucide-react';
import { ACCOMMODATION_TYPES, MARKETPLACE_CATEGORIES, PROFESSIONS, LOCATIONS, } from '@/src/constants/taxonomy';
import { usePseoInsights } from '@/src/modules/dashboard/hooks/useStats';

interface AnalyticsDashboardUIProps {
  type: 'jobs' | 'machines' | 'accommodations';
  zanimanjeSlug?: string;
  gradSlug?: string;
}

export function AnalyticsDashboardUI({ type, zanimanjeSlug, gradSlug }: AnalyticsDashboardUIProps) {
  const { data, isLoading: loading, error } = usePseoInsights({
    collection: type,
    grad: gradSlug,
    zanimanje: zanimanjeSlug
  });

  const getNameFromSlug = (slug?: string, isLocation = false) => {
    if (!slug) return 'Sve';
    if (isLocation) {
      return LOCATIONS.find(l => l.slug === slug)?.name || slug;
    }
    
    if (type === 'jobs') {
      const profs = Object.values(PROFESSIONS).flat();
      return profs.find(p => p.slug === slug)?.name || slug;
    } else if (type === 'machines') {
      return MARKETPLACE_CATEGORIES.find(c => c.slug === slug)?.name || slug;
    } else if (type === 'accommodations') {
      return ACCOMMODATION_TYPES.find(a => a.slug === slug)?.name || slug;
    }
    return slug;
  };

  const name = getNameFromSlug(zanimanjeSlug);
  const gradName = getNameFromSlug(gradSlug, true);

  if (loading) {
    return (
      <div className="w-full bg-white/5 border border-white/10 rounded-[10px] p-8 animate-pulse flex flex-col gap-6">
        <div className="h-6 w-1/3 bg-white/10 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="h-24 bg-white/10 rounded"></div>
           <div className="h-24 bg-white/10 rounded"></div>
           <div className="h-24 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full bg-red-500/10 border border-red-500/30 rounded-[10px] p-8 text-center text-red-400">
        Trenutno nemamo dovoljno statističkih podataka za ovu regiju i kategoriju.
      </div>
    );
  }

  const getMetricLabel = () => {
    if (type === 'jobs') return 'Prosečna plata';
    if (type === 'machines') return 'Prosečna cena najma';
    return 'Prosečna cena';
  };

  return (
    <article className="w-full bg-surface-dark border border-white/5 rounded-2xl p-8 lg:p-10" id="ai-blueprint">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Activity className="text-secondary w-5 h-5" />
              <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{type === 'jobs' ? 'Analiza Tržišta Rada' : 'Analiza Tržišta Mašina'}</span>
           </div>
           <h2 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
             {name} {gradSlug ? `u mestu ${gradName}` : ''}
           </h2>
           <p className="text-white/50 text-sm mt-2">Zvanična statistika i pokazatelji kretanja na tržištu na osnovu agregiranih podataka sa Svet Građevine.</p>
        </div>
      </header>

      <section>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Salary */}
          <div className="bg-[#0a1622] rounded-[10px] p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <dt className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
               <TrendingUp className="w-4 h-4 text-secondary" />
               {getMetricLabel()}
            </dt>
            <dd className="text-4xl font-black text-white tracking-tighter">
               {(data.averagePrice ?? 0) > 0 ? `${data.averagePrice?.toLocaleString()}` : '--'}
               {(data.averagePrice ?? 0) > 0 && <span className="text-lg text-secondary ml-1">{data.currency}</span>}
            </dd>
            <div className="mt-4 text-xs text-white/30 px-3 py-1.5 bg-white/5 rounded-md inline-block">
               {(data.averagePrice ?? 0) > 0 ? 'Na osnovu proseka trenutnih oglasa' : 'Nedovoljno podataka o ceni'}
            </div>
          </div>

          {/* Volume */}
          <div className="bg-[#0a1622] rounded-[10px] p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <dt className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
               {type === 'jobs' ? <Briefcase className="w-4 h-4 text-accent" /> : <Cpu className="w-4 h-4 text-accent" />}
               Trenutna Ponuda / Potražnja
            </dt>
            <dd className="text-4xl font-black text-white tracking-tighter">
               {data.estimatedTotal}
            </dd>
            <div className="mt-4 text-xs text-white/30 px-3 py-1.5 bg-white/5 rounded-md inline-block">
               Aktivnih oglasa u sistemu
            </div>
          </div>

          {/* Region */}
          <div className="bg-[#0a1622] rounded-[10px] p-6 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <dt className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">
               <MapPin className="w-4 h-4 text-blue-500" />
               Odabrana Regija
            </dt>
            <dd className="text-xl md:text-2xl font-black text-white tracking-tighter self-center my-auto pt-2">
               {gradName}
            </dd>
          </div>
        </dl>
      </section>

    </article>
  );
}
