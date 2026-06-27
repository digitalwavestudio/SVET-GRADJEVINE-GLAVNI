import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { LOCATIONS, PROFESSIONS, CORE_SECTORS } from '@/src/constants/taxonomy';

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
  if (job.type === 'job') return 'Građevinski posao';
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

export default function PremiumJobs({ premiumJobs, handleCardClick }: any) {
  return (<>
    {/* PREMIUM OGLASI SECTION */}
      <section className="py-12 md:py-24 bg-[#0F1923] relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D4AF37] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[9px] min-[360px]:text-[10px] md:text-xs block">Ekskluzivne Prilike</span>
                <span className="material-symbols-outlined text-[#D4AF37] text-xl md:text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
              </div>
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#D4AF37_0%,#ffffff_60%)] mb-4 leading-[1.05] drop-shadow-sm">PREMIUM PONUDA</h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-2">Najbolje rangirani i istaknuti oglasi proverenih kompanija.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
          </div>
          <div className="overflow-hidden relative w-full py-8 -my-8">
            {premiumJobs && premiumJobs.length > 0 ? (
            <div className="flex gap-8 animate-[scroll_60s_linear_infinite] md:animate-[scroll_150s_linear_infinite] hover:[animation-play-state:paused] w-max">
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

                const displayTitle = (job.title || job.name || 'Premium Oglas').replace(' — ', ' ');

                return (
                <Link
                  key={`${job.id}-${idx}`}
                  to={url}
                  onClick={(e) => {
                    if (job.type === 'job' || !job.type) {
                      e.preventDefault();
                      handleCardClick(url, { job });
                    }
                  }}
                  className="group/card relative flex flex-col shrink-0 min-h-[320px] md:h-[400px] rounded-[16px] transition-all duration-500 overflow-hidden border border-secondary/30 bg-gradient-to-br from-secondary/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(254,191,13,0.1)] hover:border-yellow-400/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:-translate-y-1 w-[90vw] min-w-[270px] sm:min-w-[340px] md:min-w-[620px] md:w-[620px] cursor-pointer"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50 z-0"></div>
                  <div className="p-5 md:p-7 flex flex-col w-full h-full relative flex-1 z-10">
                    
                    {/* Top Row: Logo + Header info */}
                    <div className="flex gap-4 md:gap-7 items-start md:items-center w-full min-w-0">
                      
                      {/* Logo */}
                      <div className="w-[64px] h-[64px] min-w-[64px] max-w-[64px] md:w-[72px] md:h-[72px] md:min-w-[72px] md:max-w-[72px] bg-white rounded-full p-1.5 shrink-0 group-hover/card:scale-105 transition-transform duration-500 shadow-sm relative z-10 flex items-center justify-center overflow-hidden">
                        {job.logo ? (
                          <img width="800" height="600" decoding="async" src={job?.logo} alt={`${displayTitle} - Logo`} className="w-full h-full object-contain rounded-full" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-lg md:text-2xl">
                            {job.comp?.charAt(0) || displayTitle.charAt(0) || 'P'}
                          </div>
                        )}
                        {job.isCompanyVerified && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-white shadow-[0_0_10px_rgba(34,197,94,0.5)] z-20">
                            <span className="material-symbols-outlined text-white text-[8px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Title & Desc */}
                      <div className="flex-1 min-w-0 font-sans text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between md:gap-2 gap-1.5 mb-2 relative z-10 w-full items-start md:flex-wrap">
                          <span className="bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 text-[9px] md:text-[10px] font-black px-2 md:px-2.5 py-0.5 md:py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(254,191,13,0.2)]">
                            <span className="material-symbols-outlined text-[10px] md:text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> 
                            {job.type === 'company' || job.isPremiumPartner ? 'Premium Partner' : 'Premium Oglas'}
                          </span>
                          {/* Category Badge on Mobile/Desktop */}
                          <span className="bg-white/5 border border-white/10 text-slate-300 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm">
                            {getFriendlyCategory(job)}
                          </span>
                        </div>
                        
                        <h3 className="text-base md:text-2xl font-black text-white group-hover/card:text-secondary transition-colors duration-300 mb-1 uppercase line-clamp-2 md:line-clamp-1 break-words tracking-tight">
                          {displayTitle}
                        </h3>

                        <div className="mb-2">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] text-xs md:text-[13px] font-black uppercase tracking-widest relative z-20">
                            {job.comp || 'Svet Građevine'}
                          </span>
                        </div>
                        
                        <p className="text-slate-400 text-xs md:text-sm line-clamp-2 md:line-clamp-2 pr-2">
                          {(job.description || job.body || job.content || job.opis || '')?.replace(/<[^>]*>?/gm, '') || 'Istražite najbolju priliku iz naše premium ponude proverenih kompanija.'}
                        </p>
                      </div>
                    </div>

                    {/* Middle Row: Tags */}
                    <div className="flex flex-col gap-2 w-full relative z-10 py-3 md:py-6">
                      {(() => {
                        const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                        const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                        const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                        const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

                        if (!hasSmestaj && !hasPrevoz && !hasHrana) return null;

                        return (
                          <div className="flex flex-wrap gap-2 items-center">
                            {hasSmestaj && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                                <span className="material-symbols-outlined text-[12px] text-green-400">home</span> Smeštaj
                              </span>
                            )}
                            {hasPrevoz && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                                <span className="material-symbols-outlined text-[12px] text-blue-400">commute</span> Prevoz
                              </span>
                            )}
                            {hasHrana && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                                <span className="material-symbols-outlined text-[12px] text-yellow-400">restaurant</span> Hrana
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Row: Footer Row */}
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex flex-col-reverse md:flex-row md:justify-between items-start md:items-center w-full relative z-10 pt-3 gap-4 md:gap-0">
                      <div className="w-full md:w-auto justify-center md:justify-start bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black px-5 py-3 rounded-[10px] transition-all text-[10px] md:text-xs uppercase tracking-widest flex items-center gap-2 shrink-0 relative z-20 shadow-sm">
                        {job.type === 'company' || job.isPremiumPartner ? 'POGLEDAJ FIRMU' : 'POGLEDAJ OGLAS'}
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </div>
                      {getFriendlySalary(job) && (
                        <div className="flex flex-col items-end justify-center min-w-[90px] w-full md:w-auto">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 leading-none">
                            {job.salaryType === 'hourly' ? 'Satnica' : 'Plata'}
                          </span>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFF5D6] text-2xl md:text-3xl font-black font-sans leading-none tracking-tight whitespace-nowrap">
                            {getFriendlySalary(job)}
                          </span>
                        </div>
                      )}
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