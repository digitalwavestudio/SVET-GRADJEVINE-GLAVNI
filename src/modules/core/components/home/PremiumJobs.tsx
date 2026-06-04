import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { ENGAGEMENT_TYPES } from '@/src/constants/taxonomy';

export default function PremiumJobs({ premiumJobs, handleCardClick }: any) {
  return (<>
    {/* PREMIUM OGLASI SECTION */}
      <section className="py-24 bg-[#0F1923] relative">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#D4AF37] font-black tracking-[0.2em] uppercase text-sm block">Ekskluzivne Prilike</span>
                <span className="material-symbols-outlined text-[#D4AF37] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
              </div>
              <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#D4AF37_0%,#ffffff_60%)] mb-4">PREMIUM OGLASI</h2>
              <p className="text-on-surface-variant text-lg max-w-xl">Najbolje rangirani i istaknuti oglasi proverenih kompanija.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
          </div>
          <div className="overflow-hidden relative w-full">
            {premiumJobs && premiumJobs.length > 0 ? (
            <div className="flex gap-8 animate-[scroll_60s_linear_infinite] hover:[animation-play-state:paused] w-max">
              {Array(8).fill(premiumJobs).flat().map((job: any, idx: number) => {
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
                const formatPrice = (val: any) => {
                  if (typeof val === 'number') return `€${val.toLocaleString()}`;
                  return val;
                };

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
                  className={`${UI_TOKENS.PREMIUM_CARD} block w-[85vw] md:w-[580px] cursor-pointer`}
                >
                  <div className={`${UI_TOKENS.PREMIUM_CARD_INNER} px-6 py-8 md:px-7 md:py-9 flex flex-col md:flex-row items-center md:items-start gap-8`}>
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-[10px] p-2.5 shrink-0 group-hover/card:scale-105 transition-transform duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-950 font-bold overflow-hidden p-2 relative z-10">
                      {job.logo ? (
                        <img width="800" height="600" decoding="async" src={job?.logo} alt={`${displayTitle} - Logo`} className="w-full h-full object-contain aspect-square rounded-[8px]" loading="lazy" />
                      ) : (
                        <span className="text-3xl font-black text-slate-950">{job.comp?.charAt(0) || displayTitle.charAt(0) || 'P'}</span>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                        <span className="text-yellow-500 text-[13px] font-black uppercase tracking-widest text-left">PREMIUM</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white group-hover/card:text-secondary transition-colors line-clamp-1 uppercase tracking-tighter mb-4 text-left">{displayTitle}</h3>
                      
                      <div className="flex flex-col gap-4 items-center md:items-start">
                        <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                          {job.salary && <span className={UI_TOKENS.BADGE_PREMIUM}>{formatPrice(job.salary)}</span>}
                          {job.type && <span className={UI_TOKENS.BADGE_DEFAULT}>
                            {job.type === 'job' ? 'POSAO' : job.type === 'machine' ? 'MAŠINA' : job.type === 'real_estate' ? 'NEKRETNINA' : job.type === 'company' ? 'KOMPANIJA' : job.type === 'accommodation' ? 'SMEŠTAJ' : job.type === 'catering' ? 'KETERING' : 'OGLAS'}
                          </span>}
                          {job.loc && <span className={UI_TOKENS.BADGE_DEFAULT}>{job.loc}</span>}
                        </div>
                        <button className={UI_TOKENS.BTN_PREMIUM}>POGLEDAJ OGLAS</button>
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