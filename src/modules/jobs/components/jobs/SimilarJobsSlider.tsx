import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { motion, useAnimation } from 'motion/react';
import { Link } from 'react-router-dom';
import { trackEvent } from '@/src/lib/analytics';

interface SimilarJobsSliderProps {
  jobData: { cat?: string; tacnaLokacija?: string };
  displaySimilarJobs: Array<Record<string, unknown>>;
  buildJobUrl: (job: Record<string, unknown>) => string;
}

export function SimilarJobsSlider({ jobData, displaySimilarJobs, buildJobUrl }: SimilarJobsSliderProps) {
  const trackControls = useAnimation();

  const handleMouseEnter = () => trackControls.stop();
  const handleMouseLeave = () => {
    trackControls.start({
      x: ['0%', '-100%'],
      transition: { repeat: Infinity, ease: 'linear', duration: 10 },
    });
  };

  const handleTouchStart = () => trackControls.stop();
  const handleTouchEnd = () => handleMouseLeave();

  // Start animation on mount
  React.useEffect(() => {
    handleMouseLeave();
  }, []);

  const renderBadge = (job: Record<string, unknown>) => {
    if (job.isUrgent) return <span className="badge-urgent">Hitno</span>;
    // Example: New badge for recent jobs (posted within 3 days)
    if (job.createdAt) {
      const now = new Date();
      const created = job.createdAt.toDate ? job.createdAt.toDate() : new Date(job.createdAt);
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 3) return <span className="badge-new">Nova</span>;
    }
    return null;
  };

  return (
    <section className="similar-jobs-carousel max-w-7xl mx-auto px-8 pb-16 mt-24" role="region" aria-label="Slični poslovi">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black text-white font-headline uppercase border-l-[3px] border-secondary pl-4">
          Još sličnih poslova: <span className="text-secondary">{jobData?.cat || 'Svi'} / {jobData?.tacnaLokacija || 'Srbija'}</span>
        </h2>
        <Link to="/poslovi" className="text-secondary font-bold text-sm uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
          Prikaži sve <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <motion.div
          className="similar-jobs-track"
          animate={trackControls}
        >
          {(displaySimilarJobs || []).map((job, index) => (
            <Link
              key={index}
              to={buildJobUrl(job)}
              className="group similar-job-card relative bg-surface-container rounded-[20px] overflow-hidden border border-white/5 hover:border-secondary/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,107,0,0.1)] block w-[350px]"
              onClick={() => trackEvent('job', 'similar_job_click', job.id)}
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5 group-hover:bg-secondary transition-colors duration-500"></div>

              {/* Badge */}
              {renderBadge(job)}

              <div className="p-6 flex flex-col h-full">
                {/* Header: Company & Time */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-surface-container-highest flex items-center justify-center text-white font-black text-lg border border-white/10 group-hover:border-secondary/30 transition-colors overflow-hidden">
                      {job.logo ? (
                        <OptimizedImage
                          src={job.logo}
                          fallbackType="company"
                          alt="Logo"
                          className="w-full h-full object-contain"
                          containerClassName="w-full h-full"
                          loading="lazy"
                        />
                      ) : (
                        job.comp?.charAt(0) || 'P'
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{job.comp}</p>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-wider">{job.time}</p>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white font-black text-xl mb-4 uppercase tracking-tight group-hover:text-secondary transition-colors line-clamp-2 leading-snug">
                  {job.title}
                </h3>

                {/* Meta Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-[10px] text-xs text-on-surface-variant font-medium border border-white/5">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {job.loc}
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container-highest px-3 py-1.5 rounded-[10px] text-xs text-on-surface-variant font-medium border border-white/5">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    Puno radno vreme
                  </div>
                </div>

                {/* Footer: Salary & Action */}
                <div className="mt-auto pt-5 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-0.5">Zarada</p>
                    <p className="text-secondary font-black text-lg">{job.sal}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-white group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300 -rotate-45 group-hover:rotate-0">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
