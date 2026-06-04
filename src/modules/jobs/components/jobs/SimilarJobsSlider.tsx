import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface SimilarJobsSliderProps {
  jobData: any;
  displaySimilarJobs: any[];
  buildJobUrl: (job: any) => string;
}

export function SimilarJobsSlider({ jobData, displaySimilarJobs, buildJobUrl }: SimilarJobsSliderProps) {
  return (
    <section className="max-w-7xl mx-auto px-8 pb-16 mt-24 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-black text-white font-headline uppercase border-l-[3px] border-secondary pl-4">
          Još sličnih poslova: <span className="text-secondary">{jobData?.cat || 'Svi'} / {jobData?.tacnaLokacija || 'Srbija'}</span>
        </h2>
        <Link to="/poslovi" className="text-secondary font-bold text-sm uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
          Prikaži sve <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
      </div>

      <div className="relative -mx-4 px-4 md:mx-0 md:px-0 pb-8">
        <motion.div 
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, ease: "linear", duration: 60 }}
        >
          {[...displaySimilarJobs, ...displaySimilarJobs, ...displaySimilarJobs, ...displaySimilarJobs].map((job: any, index) => (
            <Link 
              key={`${job.id}-${index}`} 
              to={buildJobUrl(job)} 
              className="w-[300px] md:w-[360px] shrink-0 bg-surface-container-high rounded-[10px] border border-white/5 hover:border-secondary/40 transition-all duration-500 group flex flex-col relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-white/5 group-hover:bg-secondary transition-colors duration-500"></div>
              
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
                        />
                      ) : (
                        job.comp.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{job.comp}</p>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-wider">{job.time}</p>
                    </div>
                  </div>
                  <span className="bg-secondary/10 text-secondary text-[10px] font-black px-2.5 py-1 rounded-[10px] uppercase tracking-widest border border-secondary/20">
                    Hitno
                  </span>
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
