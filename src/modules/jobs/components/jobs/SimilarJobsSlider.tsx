import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/src/lib/analytics';

interface SimilarJobsSliderProps {
  jobData: any;
  displaySimilarJobs: any[];
  buildJobUrl: (job: any) => string;
}

export function SimilarJobsSlider({ jobData, displaySimilarJobs, buildJobUrl }: SimilarJobsSliderProps) {
  if (!displaySimilarJobs || displaySimilarJobs.length === 0) return null;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      checkScroll();
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [displaySimilarJobs]);

  // Autoplay
  React.useEffect(() => {
    let interval: any;
    if (displaySimilarJobs.length > 0) {
      interval = setInterval(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          if (scrollLeft + clientWidth >= scrollWidth - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            // Skrolujemo za širinu jedne kartice
            const firstCard = scrollRef.current.firstElementChild as HTMLElement;
            const cardWidth = firstCard ? firstCard.clientWidth + 16 : 300;
            scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
          }
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [displaySimilarJobs]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const firstCard = scrollRef.current.firstElementChild as HTMLElement;
      const cardWidth = firstCard ? firstCard.clientWidth + 16 : 300;
      const offset = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const renderBadge = (job: any) => {
    if (job.isPremium) return <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-[8px] text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(234,179,8,0.2)]"><span className="material-symbols-outlined text-[11px]" style={{fontVariationSettings:"'FILL' 1"}}>hotel_class</span>Premium</span>;
    if (job.isUrgent) return <span className="backdrop-blur-sm bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-[8px] text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(239,68,68,0.2)]">Hitno</span>;
    
    if (job.createdAt) {
      const now = new Date();
      const created = job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt);
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-[8px] text-[9px] font-black uppercase tracking-widest">Nova</span>;
    }
    return null;
  };

  return (
    <section className="w-full" role="region" aria-label="Slični poslovi">
      <div className="flex items-center justify-between gap-4 mb-6 w-full flex-wrap sm:flex-nowrap">
        <h2 className="text-[16px] sm:text-2xl font-black text-white uppercase tracking-tight shrink-0">
          Još sličnih poslova
        </h2>
        <div className="flex items-center gap-4 shrink-0 ml-auto">
          {/* Strelice za navigaciju */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${canScrollLeft ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' : 'bg-transparent border-white/5 text-white/20 cursor-not-allowed'}`}
              aria-label="Prethodni poslovi"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${canScrollRight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20' : 'bg-transparent border-white/5 text-white/20 cursor-not-allowed'}`}
              aria-label="Sledeći poslovi"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          <Link to="/poslovi" className="text-yellow-500 font-bold text-[11px] sm:text-sm uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
            Prikaži sve <span className="material-symbols-outlined text-[16px] sm:text-[20px]">arrow_forward</span>
          </Link>
        </div>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory scrollbar-hide relative z-20" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displaySimilarJobs.map((job, index) => (
          <Link
            key={index}
            to={buildJobUrl(job)}
            className={`snap-center sm:snap-start shrink-0 group relative rounded-2xl overflow-hidden border transition-all duration-300 w-[280px] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] ${job.isPremium ? 'border-yellow-500/50 bg-yellow-500/[0.03] shadow-[0_0_40px_rgba(234,179,8,0.05)] hover:bg-yellow-500/[0.05]' : 'bg-[#0B0F19] border-white/10 hover:border-white/20'}`}
            onClick={() => trackEvent()}
          >
            <div className="p-3 sm:p-5 flex flex-col h-full">
              {/* Header: Company & Time */}
              <div className="flex flex-wrap justify-between items-start mb-4 gap-2 w-full">
                <div className="flex items-center gap-2 sm:gap-3 min-w-[120px] flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black text-lg border border-white/10 overflow-hidden shrink-0 shadow-inner">
                    {job.logo ? (
                      <OptimizedImage
                        src={job.logo}
                        fallbackType="company"
                        alt="Logo"
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        loading="lazy"
                      />
                    ) : (
                      job.comp?.charAt(0) || job.companyName?.charAt(0) || 'P'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white/90 font-bold text-xs truncate w-full block">{job.comp || job.companyName || 'Svet Građevine'}</p>
                    <p className="text-white/40 text-[9px] uppercase tracking-wider">{job.time || 'Skoro'}</p>
                  </div>
                </div>
                <div className="shrink-0">{renderBadge(job)}</div>
              </div>

              {/* Title */}
              <h3 className="text-white font-black text-lg mb-4 uppercase tracking-tight group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug h-12">
                {job.title}
              </h3>

              {/* Meta Tags */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(() => {
                  const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                  const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                  const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                  const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

                  return (
                    <>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-[9px] text-white/60 font-bold uppercase tracking-widest border border-white/10 shrink-0 max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">location_on</span>
                        <span className="truncate">{job.loc || job.location || 'Srbija'}</span>
                      </div>
                      
                      {hasSmestaj && (
                        <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md text-[9px] text-green-400 font-bold uppercase tracking-widest border border-green-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">home</span> Smeštaj
                        </div>
                      )}
                      
                      {hasPrevoz && (
                        <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md text-[9px] text-blue-400 font-bold uppercase tracking-widest border border-blue-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">commute</span> Prevoz
                        </div>
                      )}
                      
                      {hasHrana && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-md text-[9px] text-yellow-400 font-bold uppercase tracking-widest border border-yellow-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">restaurant</span> Hrana
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md text-[9px] text-white/60 font-bold uppercase tracking-widest border border-white/10 shrink-0">
                        <span className="material-symbols-outlined text-[12px] shrink-0">schedule</span>
                        Radno vreme
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Footer: Salary & Action */}
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest mb-0.5 font-bold">Zarada</p>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 font-black text-xl sm:text-2xl truncate">
                    {job.isNegotiable ? 'Pozvati' : job.plataMin != null
                      ? `${Number(job.plataMin).toLocaleString()}${job.plataMax != null ? ` - ${Number(job.plataMax).toLocaleString()}` : ''} €`
                      : job.sal 
                        ? `${job.sal} €`
                        : job.salary
                          ? `${job.salary} €`
                          : 'Po dogovoru'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-yellow-400 group-hover:!text-black transition-all duration-300 -rotate-45 group-hover:rotate-0 border border-white/10 group-hover:border-yellow-400">
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Scrollbar hide fallback for webkit inside style tag to ensure it works */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
