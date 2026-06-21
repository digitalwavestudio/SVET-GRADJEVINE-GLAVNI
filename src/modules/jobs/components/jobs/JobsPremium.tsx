import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';

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
            <div className={isExpanded ? "grid grid-cols-1 xl:grid-cols-2 gap-8" : "flex gap-8 animate-[scroll_120s_linear_infinite] hover:[animation-play-state:paused] w-max"}>
              {(isExpanded ? jobs : Array(4).fill(jobs.slice(0, 4)).flat())
                .map((job, idx) => (
                <div key={`${job.id}-${idx}`} className={`gold-glow bg-gradient-to-b from-yellow-500/20 to-transparent p-[2px] rounded-[10px] group/card relative block shrink-0 ${isExpanded ? 'w-full' : 'w-[85vw] md:w-[580px]'}`}>
                  <div className="bg-[#0F1923] p-6 md:p-7 flex flex-col md:flex-row gap-6 md:gap-7 items-center rounded-[10px] border border-white/5 h-full">
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-full p-2 shrink-0 group-hover/card:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative z-10">
                      {job.logo ? (
                        <OptimizedImage 
                          src={job.logo} 
                          fallbackType="company" 
                          alt="Logo" 
                          className="w-full h-full object-contain rounded-full p-1" 
                          containerClassName="w-full h-full"
                        />
                          
                      ) : (
                        <div className="w-full h-full bg-slate-950/5 rounded-full flex items-center justify-center text-slate-950 font-black text-2xl">{getInitials(job.comp)}</div>
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left flex flex-col h-full justify-center">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2 relative z-10 animate-blink">
                        <span className="material-symbols-outlined text-yellow-500 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                        <Link to={`/firma/${job.comp}`} className="text-yellow-500 text-xs font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors">Premium Partner</Link>
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2 uppercase line-clamp-2">
                        <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0">
                          {job.title}
                        </Link>
                      </h3>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {(job.description || job.body || job.content || job.opis || '')?.replace(/<[^>]*>?/gm, '') || 'Pridružite se modernom timu na velikim projektima i osigurajte najbolje uslove rada u industriji.'}
                      </p>
                      <div className="flex flex-col gap-4 items-center md:items-start relative z-10 mt-auto">
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                          {(job.sal || job.salary) && (
                            <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">payments</span>
                              {job.sal || job.salary}
                            </span>
                          )}
                          <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {job.time || job.radnoVreme || (job.engagementSlug === 'puno-radno-vreme' ? 'Puno radno vreme' : job.engagementSlug?.replace(/-/g, ' ')) || 'Puno radno vreme'}
                          </span>
                          {(job.loc || job.lokacijaStr || job.location) && (
                            <span className="bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">location_on</span>
                              {job.loc || job.lokacijaStr || job.location}
                            </span>
                          )}
                        </div>
                        <button className="bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 font-black px-6 py-2 h-fit rounded hover:from-yellow-500 hover:to-yellow-700 transition-all text-sm uppercase shadow-lg shadow-yellow-500/20">APLICIRAJ</button>
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
