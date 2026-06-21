import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { UI_TOKENS } from '@/src/lib/uiTokens';
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
          if (minVal === maxVal) return `€${minVal.toLocaleString()}`;
          return `€${minVal.toLocaleString()} - €${maxVal.toLocaleString()}`;
        }
      }
      return `Od €${minVal.toLocaleString()}`;
    }
  }
  
  if (max !== undefined && max !== null && max !== '') {
    const maxVal = Number(max);
    if (!isNaN(maxVal)) {
      return `Do €${maxVal.toLocaleString()}`;
    }
  }
  
  const oldSalary = job.salary || job.sal || job.price;
  if (oldSalary) {
    if (typeof oldSalary === 'number') return `€${oldSalary.toLocaleString()}`;
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

export default function PremiumJobs({ premiumJobs, handleCardClick }: any) {
  return (<>
    {/* PREMIUM OGLASI SECTION */}
      <section className="py-12 md:py-24 bg-[#0F1923] relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D4AF37] font-black tracking-[0.2em] uppercase text-sm block">Ekskluzivne Prilike</span>
                <span className="material-symbols-outlined text-[#D4AF37] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
              </div>
              <h2 className="font-headline text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#D4AF37_0%,#ffffff_60%)] mb-4">PREMIUM OGLASI</h2>
              <p className="text-on-surface-variant text-lg max-w-xl">Najbolje rangirani i istaknuti oglasi proverenih kompanija.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
          </div>
          <div className="overflow-hidden relative w-full">
            <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-[#0F1923] to-transparent pointer-events-none z-10 md:hidden"></div>
            {premiumJobs && premiumJobs.length > 0 ? (
            <div className="flex gap-8 animate-[scroll_60s_linear_infinite] hover:[animation-play-state:paused] w-max">
              {Array(4).fill(premiumJobs).flat().map((job: any, idx: number) => {
                const url = (() => {
                  try {
                    if (job.type === 'company' || job.isPremiumPartner) return `/firma/${job.id}`;
                    if (job.type === 'machine') return `/gradjevinske-masine/${job.id}`;
                    if (job.type === 'real_estate') return `/placevi/${job.id}`;
                    if (job.type === 'accommodation') return `/smestaj/${job.id}`;
                    if (job.type === 'catering') return `/ketering/provajder/${job.id}`;
                    if (job.type === 'marketplace' || job.type === 'material' || job.type === 'tool') return `/alat-i-oprema/${job.id}`;
                    return buildJobUrl(job);
                  } catch(e) {
                    return `/poslovi/${job.id}`;
                  }
                })();

                const displayTitle = job.title || job.name || 'Premium Oglas';

                return (
                <Link 
                  to={url}
                  key={`${job.id}-${idx}`}
                  title={displayTitle}
                  onClick={(e) => {
                    if (handleCardClick) {
                      e.preventDefault();
                      handleCardClick(url, { job });
                    }
                  }}
                  className="gold-glow bg-gradient-to-b from-yellow-500/20 to-transparent p-[2px] rounded-[10px] group/card relative block shrink-0 w-[85vw] min-w-[270px] sm:min-w-[340px] md:min-w-[580px] md:w-[580px] cursor-pointer h-[460px] md:h-[310px]"
                >
                  <div className="bg-[#0F1923] p-6 md:p-7 flex flex-col md:flex-row gap-6 md:gap-7 items-center md:items-start rounded-[10px] border border-white/5 w-full h-full">
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-full p-2 shrink-0 group-hover/card:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10 flex items-center justify-center overflow-hidden">
                      {job.logo ? (
                        <img width="800" height="600" decoding="async" src={job?.logo} alt={`${displayTitle} - Logo`} className="w-full h-full object-contain rounded-full p-1" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-slate-950/5 rounded-full flex items-center justify-center text-slate-950 font-black text-2xl">
                          {job.comp?.charAt(0) || displayTitle.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left flex flex-col h-full justify-between min-w-0 w-full font-sans">
                      <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 relative z-10 animate-blink">
                          <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                          <span className="text-yellow-500 text-xs font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors">Premium Partner</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 uppercase line-clamp-2">
                          {displayTitle}
                        </h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                          {(job.description || job.body || job.content || job.opis || '')?.replace(/<[^>]*>?/gm, '') || 'Istražite najbolju priliku iz naše premium ponude proverenih kompanija.'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-4 items-center md:items-start relative z-10 mt-auto">
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          {getFriendlySalary(job) && (
                            <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">payments</span>
                              {getFriendlySalary(job)}
                            </span>
                          )}
                          {getFriendlyEngagement(job) && (
                            <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {getFriendlyEngagement(job)}
                            </span>
                          )}
                          <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">category</span>
                            {getFriendlyCategory(job)}
                          </span>
                          <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {getFriendlyLocation(job)}
                          </span>
                          {(() => {
                            const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                            const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                            const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                            const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

                            return (
                              <>
                                {hasSmestaj && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[11px] rounded-full font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">home</span> Smeštaj
                                  </span>
                                )}
                                {hasPrevoz && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] rounded-full font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">commute</span> Prevoz
                                  </span>
                                )}
                                {hasHrana && (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px] rounded-full font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">restaurant</span> Hrana
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <button className="bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 font-black px-6 py-2 h-fit rounded hover:from-yellow-500 hover:to-yellow-700 transition-all text-sm uppercase shadow-lg shadow-yellow-500/20">POGLEDAJ OGLAS</button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
              })}
            </div>
            ) : (
                <div className="bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                  <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
                  <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema premium istaknutih oglasa</h3>
                  <p className="text-on-surface-variant text-base">Premium oglasa trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
                </div>
            )}
          </div>
        </div>
      </section>
  </>);
}