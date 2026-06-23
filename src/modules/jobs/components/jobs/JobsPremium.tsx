import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { LOCATIONS, PROFESSIONS, CORE_SECTORS, ENGAGEMENT_TYPES } from '@/src/constants/taxonomy';

const getFriendlyLocation = (job: any) => {
  const slug = job.locationSlug || job.location || job.loc || job.lokacijaStr;
  if (!slug) return 'Srbija';
  
  if (typeof slug === 'string') {
    const cleanSlug = slug.toLowerCase().trim();
    const found = LOCATIONS.find(l => l.slug === cleanSlug || l.id === cleanSlug);
    if (found) return found.name;
    return slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  }
  
  if (typeof slug === 'object' && slug !== null) {
    if ('name' in slug) return (slug as any).name;
    if ('address' in slug) return (slug as any).address;
  }
  
  return 'Srbija';
};

const getFriendlyCategory = (job: any) => {
  if (job.type === 'job') {
    const profSlug = job.professionSlug;
    if (profSlug) {
      for (const sector in PROFESSIONS) {
        const found = PROFESSIONS[sector].find(p => p.slug === profSlug || p.id === profSlug);
        if (found) return found.name;
      }
    }
    
    const sectSlug = job.sectorSlug || job.categorySlug || job.sector;
    if (sectSlug) {
      const found = CORE_SECTORS.find(s => s.slug === sectSlug || s.id === sectSlug);
      if (found) return found.name;
    }
    
    return 'Građevinski posao';
  }
  
  if (job.type === 'machine') return 'Građevinska mašina';
  if (job.type === 'real_estate') return 'Plac / Zemljište';
  if (job.type === 'company') return 'Firma';
  if (job.type === 'accommodation') return 'Smeštaj za radnike';
  if (job.type === 'catering') return 'Ketering';
  
  return 'Premium oglas';
};

const getFriendlySalary = (job: any) => {
  const min = job.plataMin;
  const max = job.plataMax;
  
  if (min !== undefined && min !== null && min !== '') {
    const minVal = Number(min);
    if (!isNaN(minVal)) {
      if (max !== undefined && max !== null && max !== '') {
        const maxVal = Number(max);
        if (!isNaN(maxVal)) {
          if (minVal === maxVal) return `${minVal.toLocaleString()} €`;
          return `${minVal.toLocaleString()} - ${maxVal.toLocaleString()} €`;
        }
      }
      return `Od ${minVal.toLocaleString()} €`;
    }
  }
  
  if (max !== undefined && max !== null && max !== '') {
    const maxVal = Number(max);
    if (!isNaN(maxVal)) {
      return `Do ${maxVal.toLocaleString()} €`;
    }
  }
  
  const oldSalary = job.salary || job.sal || job.price;
  if (oldSalary) {
    if (typeof oldSalary === 'number') return `${oldSalary.toLocaleString()} €`;
    if (typeof oldSalary === 'string') {
      let clean = oldSalary.replace(/€/g, '').trim();
      if (!clean.endsWith('€') && !clean.endsWith('E') && !clean.endsWith('e')) {
        clean = clean + ' €';
      }
      return clean;
    }
    return oldSalary;
  }
  
  return null;
};

const getFriendlyEngagement = (job: any) => {
  if (job.type && job.type !== 'job') {
    return null;
  }
  const slug = job.tipAngazmana || job.engagementSlug || job.engagement || job.time;
  const custom = job.customEngagement || job.radnoVreme;
  
  if (slug === 'upisi') return custom || 'Radno vreme';
  if (!slug) return custom || 'Puno radno vreme';
  
  if (typeof slug === 'string') {
    const cleanSlug = slug.toLowerCase().trim();
    const found = ENGAGEMENT_TYPES.find(e => e.slug === cleanSlug || e.id === cleanSlug);
    if (found) return found.name;
    return slug.replace(/-/g, ' ').charAt(0).toUpperCase() + slug.slice(1).toLowerCase().replace(/-/g, ' ');
  }
  
  return custom || 'Puno radno vreme';
};

interface JobsPremiumProps {
  jobs: any[];
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  prefetch: (type: 'job' | 'company', id?: string) => void;
  getInitials: (name: string) => string;
  hasMore?: boolean;
  loadMore?: () => void;
  loadingMore?: boolean;
}

export const JobsPremium: React.FC<JobsPremiumProps> = ({ jobs, isExpanded, setIsExpanded, prefetch, getInitials, hasMore, loadMore, loadingMore }) => {
  console.log("JobsPremium render, jobs count:", jobs?.length, "jobs:", jobs);
  return (
    <section className="py-20 bg-[#0F1923] relative">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#D4AF37] font-black tracking-[0.2em] uppercase text-sm block">Ekskluzivne Prilike</span>
              <span className="material-symbols-outlined text-[#D4AF37] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
            </div>
            <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#D4AF37_0%,#ffffff_60%)] mb-4">PREMIUM POSLOVI</h2>
            <p className="text-on-surface-variant text-lg max-w-xl">Najbolje rangirani i istaknuti oglasi proverenih kompanija.</p>
            <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
          </div>
        </div>
        <div className={`relative w-full ${isExpanded ? '' : 'overflow-hidden'}`}>
          {jobs.length > 0 ? (
            <div className={isExpanded ? "grid grid-cols-1 xl:grid-cols-2 gap-8" : "flex gap-8 animate-[scroll_60s_linear_infinite] hover:[animation-play-state:paused] w-max"}>
              {(isExpanded ? jobs : Array(4).fill(jobs.slice(0, 4)).flat())
                .map((job, idx) => (
                <div key={`${job.id}-${idx}`} className={`gold-glow bg-gradient-to-b from-yellow-500/20 to-transparent p-[2px] rounded-[10px] group/card relative block shrink-0 h-[400px] md:h-[360px] ${isExpanded ? 'w-full' : 'w-[90vw] sm:min-w-[340px] md:min-w-[620px] md:w-[620px]'}`}>
                  <div className="bg-[#0F1923] p-5 md:p-7 flex flex-col justify-between rounded-[10px] border border-white/5 w-full h-full relative">
                    
                    {/* Top Row: Logo + Header info */}
                    <div className="flex gap-4 md:gap-7 items-start md:items-center w-full min-w-0">
                      
                      {/* Logo */}
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full p-1 md:p-1.5 shrink-0 group-hover/card:scale-105 transition-transform duration-500 shadow-[0_0_15px_rgba(255,255,255,0.08)] relative z-10 flex items-center justify-center overflow-hidden">
                        {job.logo ? (
                          <OptimizedImage 
                            src={job.logo} 
                            fallbackType="company" 
                            alt="Logo" 
                            className="w-full h-full object-contain rounded-full p-1" 
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-950/5 rounded-full flex items-center justify-center text-slate-950 font-black text-lg md:text-2xl">{getInitials(job.comp)}</div>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div className="flex-1 min-w-0 font-sans">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 relative z-10 w-full">
                          <div className="flex items-center gap-1 animate-blink">
                            <span className="material-symbols-outlined text-yellow-500 text-sm md:text-base" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                            <span className="text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-widest">Premium Oglas</span>
                          </div>
                          {/* Category Badge on Mobile/Desktop */}
                          <span className="bg-gradient-to-r from-[#D4AF37]/10 to-[#FDE68A]/5 text-[#D4AF37] border border-[#D4AF37]/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(212,175,55,0.05)]">
                            {getFriendlyCategory(job)}
                          </span>
                        </div>
                        
                        <h3 className="text-base md:text-2xl font-bold text-white mb-1.5 uppercase line-clamp-2">
                          <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0">
                            {job.title?.replace(' — ', ' ') || 'Premium Posao'}
                          </Link>
                        </h3>
                        
                        <p className="text-slate-400 text-xs md:text-sm line-clamp-2 md:line-clamp-3 pr-2">
                          {(job.description || job.body || job.content || job.opis || '')?.replace(/<[^>]*>?/gm, '') || 'Pridružite se modernom timu na velikim projektima i osigurajte najbolje uslove rada u industriji.'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Tags (Vertically Centered) */}
                    <div className="flex flex-col gap-2 w-full relative z-10 my-auto py-4">
                      {getFriendlyEngagement(job) && (
                        <div className="flex">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 text-white/70 text-[9px] md:text-[10px] rounded-full font-bold uppercase tracking-widest">
                            <span className="material-symbols-outlined text-[12px] md:text-[14px] text-white/40">schedule</span>
                            {getFriendlyEngagement(job)}
                          </span>
                        </div>
                      )}
                      
                      {(() => {
                        const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                        const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                        const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                        const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

                        if (!hasSmestaj && !hasPrevoz && !hasHrana) return null;

                        return (
                          <div className="flex flex-wrap gap-2 items-center">
                            {hasSmestaj && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 text-white/70 text-[9px] md:text-[10px] rounded-full font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[12px] md:text-[14px] text-green-400">home</span> Smeštaj
                              </span>
                            )}
                            {hasPrevoz && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 text-white/70 text-[9px] md:text-[10px] rounded-full font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[12px] md:text-[14px] text-blue-400">commute</span> Prevoz
                              </span>
                            )}
                            {hasHrana && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/5 text-white/70 text-[9px] md:text-[10px] rounded-full font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[12px] md:text-[14px] text-yellow-400">restaurant</span> Hrana
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Row: Footer Row (Pinned to Bottom) */}
                    <div className="flex justify-between items-center w-full relative z-10 pt-4 border-t border-white/5 mt-auto">
                      <button className="bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 font-black px-4 py-2.5 md:px-6 md:py-3 rounded-[10px] hover:from-yellow-500 hover:to-yellow-700 hover:-translate-y-1 transition-all text-[10px] md:text-sm uppercase shadow-lg shadow-yellow-500/20 flex items-center gap-2 shrink-0">
                        APLICIRAJ
                        <span className="material-symbols-outlined text-sm hidden md:block">arrow_forward</span>
                      </button>
                      
                      {getFriendlySalary(job) && (
                        <div className="flex flex-col items-end justify-center min-w-[90px]">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-0.5">Zarada</span>
                          <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#FDE68A] via-[#D4AF37] to-[#B45309] text-3xl md:text-4xl font-black font-headline tracking-tighter leading-none whitespace-nowrap">
                            {getFriendlySalary(job)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema premium istaknutih poslova</h3>
                <p className="text-on-surface-variant text-base">Premium poslova trenutno nema u bazi podataka za izabrane kriterijume.</p>
            </div>
          )}
        </div>
        
        {jobs.length > 4 && (
          <div className="mt-10 flex flex-col items-center justify-end md:flex-row md:justify-between gap-4">
            {isExpanded && hasMore && (
              <button 
                onClick={() => loadMore?.()}
                disabled={loadingMore}
                className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-6 py-2 rounded font-bold text-sm uppercase tracking-widest hover:bg-yellow-500/20 transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Učitavanje...' : 'Učitaj još'}
              </button>
            )}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest transition-all hover:text-yellow-400 ml-auto"
            >
              <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-105 origin-right">
                <span>{isExpanded ? 'Zatvori premium poslove' : 'Otvori sve premium poslove'}</span>
                <span className="material-symbols-outlined">
                  {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
