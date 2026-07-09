import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/src/lib/analytics';

const cleanTitle = (title: string, location: string) => {
  if (!title) return '';
  if (!location) return title;
  const locLower = location.toLowerCase().trim();
  const cleanRegex = new RegExp(`\\s*[-—/|]\\s*${locLower}\\s*$`, 'i');
  return title.replace(cleanRegex, '').trim();
};

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
      <div className="flex items-center justify-center gap-4 mb-6 w-full text-center">
        <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider text-center mx-auto">
          Još sličnih poslova
        </h2>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-6 pt-2 px-2 -mx-2 snap-x snap-mandatory scrollbar-hide relative z-20" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displaySimilarJobs.map((job, index) => (
          <Link
            key={index}
            to={buildJobUrl(job)}
            className={`snap-center sm:snap-start shrink-0 group relative rounded-2xl overflow-hidden border transition-all duration-300 w-[280px] sm:w-[calc((100%-16px)/2)] md:w-[calc((100%-32px)/3)] lg:w-[calc((100%-48px)/4)] 
              ${job.isPremium 
                ? 'border-yellow-500/35 bg-gradient-to-b from-yellow-500/[0.06] to-yellow-500/[0.01] backdrop-blur-md shadow-[0_8px_32px_0_rgba(234,179,8,0.03),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-yellow-500/60 hover:bg-yellow-500/[0.08]' 
                : 'border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:border-white/20 hover:from-white/[0.08] hover:to-white/[0.02]'
              }`}
            onClick={() => trackEvent()}
          >
            <div className="p-4 sm:p-5 flex flex-col h-full">
              {/* Header: Company & Badge */}
              <div className="flex flex-wrap justify-between items-center mb-4 gap-2 w-full">
                <div className="flex items-center gap-2.5 min-w-[120px] flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center text-white font-black text-lg border border-white/10 overflow-hidden shrink-0 shadow-inner">
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
                    <p className="text-white font-bold text-xs sm:text-sm truncate w-full block tracking-wide">{job.comp || job.companyName || 'Svet Građevine'}</p>
                  </div>
                </div>
                <div className="shrink-0">{renderBadge(job)}</div>
              </div>

              {/* Title */}
              <h3 className="text-white font-black text-[16px] sm:text-lg mb-4 uppercase tracking-tight group-hover:text-yellow-400 transition-colors line-clamp-2 leading-snug h-12">
                {cleanTitle(job.title, job.loc || job.location)}
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
                      <div className="flex items-center gap-1 bg-white/[0.04] backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-white/70 font-bold uppercase tracking-wider border border-white/[0.05] shrink-0 max-w-full">
                        <span className="material-symbols-outlined text-[12px] shrink-0">location_on</span>
                        <span className="truncate">{job.loc || job.location || 'Srbija'}</span>
                      </div>
                      
                      {hasSmestaj && (
                        <div className="flex items-center gap-1 bg-green-500/10 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-green-400 font-bold uppercase tracking-wider border border-green-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">home</span> Smeštaj
                        </div>
                      )}
                      
                      {hasPrevoz && (
                        <div className="flex items-center gap-1 bg-blue-500/10 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">commute</span> Prevoz
                        </div>
                      )}
                      
                      {hasHrana && (
                        <div className="flex items-center gap-1 bg-yellow-500/10 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] text-yellow-400 font-bold uppercase tracking-wider border border-yellow-500/20 shrink-0">
                          <span className="material-symbols-outlined text-[12px] shrink-0">restaurant</span> Hrana
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Footer: Salary & Action */}
              <div className="mt-auto pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/40 text-[9px] uppercase tracking-widest mb-0.5 font-bold">Zarada</p>
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 font-black text-lg sm:text-xl truncate">
                    {job.isNegotiable ? 'Pozvati' : job.plataMin != null
                      ? `${Number(job.plataMin).toLocaleString()}${job.plataMax != null ? ` - ${Number(job.plataMax).toLocaleString()}` : ''} €`
                      : job.sal 
                        ? `${job.sal} €`
                        : job.salary
                          ? `${job.salary} €`
                          : 'Po dogovoru'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/[0.03] backdrop-blur-sm flex items-center justify-center text-white/50 group-hover:bg-yellow-400 group-hover:text-black transition-all duration-300 -rotate-45 group-hover:rotate-0 border border-white/[0.08] group-hover:border-yellow-400 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
