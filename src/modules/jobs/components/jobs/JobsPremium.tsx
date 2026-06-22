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
                <div key={`${job.id}-${idx}`} className={`gold-glow bg-gradient-to-b from-yellow-500/20 to-transparent p-[2px] rounded-[10px] group/card relative block shrink-0 h-[380px] md:h-[340px] ${isExpanded ? 'w-full' : 'w-[90vw] sm:min-w-[340px] md:min-w-[620px] md:w-[620px]'}`}>
                  <div className="bg-[#0F1923] p-5 md:p-7 flex flex-col justify-between rounded-[10px] border border-white/5 w-full h-full relative">
                    
                    {/* Top Row: Logo + Header info */}
                    <div className="flex gap-4 md:gap-7 items-start w-full min-w-0">
                      
                      {/* Logo */}
                      <div className="w-16 h-16 md:w-28 md:h-28 bg-white rounded-full p-1.5 md:p-2 shrink-0 group-hover/card:scale-105 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10 flex items-center justify-center overflow-hidden">
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
                        <div className="flex flex-wrap items-center gap-2 mb-1.5 relative z-10">
                          <div className="flex items-center gap-1 animate-blink">
                            <span className="material-symbols-outlined text-yellow-500 text-sm md:text-base" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                            <span className="text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-widest">Premium Oglas</span>
                          </div>
                          {/* Category Badge on Mobile/Desktop */}
                          <span className="bg-white/5 text-slate-300 px-2 py-0.5 md:px-3 md:py-1 rounded text-[9px] md:text-[11px] font-bold uppercase whitespace-nowrap">
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

                    {/* Bottom Content Area: Tags + Footer Row */}
                    <div className="flex flex-col gap-3 w-full mt-4">
                      
                      {/* Tags row */}
                      <div className="flex flex-wrap gap-2 items-center w-full relative z-10">
                        {getFriendlyEngagement(job) && (
                          <span className="bg-white/5 text-slate-300 px-2.5 py-0.5 rounded text-[10px] md:text-[11px] font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] md:text-[14px]">schedule</span>
                            {getFriendlyEngagement(job)}
                          </span>
                        )}
                        
                        {(() => {
                          const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                          const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                          const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                          const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

                          return (
                            <>
                              {hasSmestaj && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] md:text-[11px] rounded font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[12px] md:text-[14px]">home</span> Smeštaj
                                </span>
                              )}
                              {hasPrevoz && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-[11px] rounded font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[12px] md:text-[14px]">commute</span> Prevoz
                                </span>
                              )}
                              {hasHrana && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] md:text-[11px] rounded font-bold uppercase tracking-wider">
                                  <span className="material-symbols-outlined text-[12px] md:text-[14px]">restaurant</span> Hrana
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Footer Row: Button + Salary */}
                      <div className="flex justify-between items-center w-full relative z-10 pt-2 border-t border-white/5">
                        <button className="bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 font-black px-6 py-2 md:px-9 md:py-2.5 rounded hover:from-yellow-500 hover:to-yellow-700 transition-all text-xs md:text-sm uppercase shadow-lg shadow-yellow-500/20">
                          APLICIRAJ
                        </button>
                        
                        {getFriendlySalary(job) && (
                          <span className="text-[#D4AF37] text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight">
                            {getFriendlySalary(job)}
                          </span>
                        )}
                      </div>

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
