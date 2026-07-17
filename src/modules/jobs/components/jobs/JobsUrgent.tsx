import React from 'react';
import { JobCard } from '@/src/modules/jobs/components/JobCard';

interface JobsUrgentProps {
  jobs: any[];
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  prefetch: (type: string, id?: string) => void;
  getInitials: (name: string) => string;
  hasMore?: boolean;
  loadMore?: () => void;
  loadingMore?: boolean;
}

export const JobsUrgent: React.FC<JobsUrgentProps> = ({ jobs, isExpanded, setIsExpanded, prefetch, getInitials, hasMore, loadMore, loadingMore }) => {
  return (
    <section className="py-20 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-start mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#ff512f] font-black tracking-[0.2em] uppercase text-sm block">Premium Prioritet</span>
              <span className="material-symbols-outlined text-[#ff512f] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>local_fire_department</span>
            </div>
            <h2 className="font-headline text-5xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#ff512f_0%,#ffffff_60%)] mb-4">HITNI POSLOVI</h2>
            <p className="text-on-surface-variant text-lg max-w-xl">Ponude i poslovi koji zahtevaju najbržu reakciju na tržištu.</p>
            <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch auto-rows-fr">
          {(isExpanded ? jobs : jobs.slice(0, 4)).map((job) => (
            <JobCard key={job.id} job={job} viewMode="grid" prefetch={prefetch} />
          ))}
        </div>
        
        {jobs.length > 4 && (
          <div className="mt-10 flex flex-col items-center justify-end md:flex-row md:justify-between gap-4">
            {isExpanded && hasMore && (
              <button 
                onClick={() => loadMore?.()}
                disabled={loadingMore}
                className="bg-red-500/10 text-red-500 border border-red-500/30 px-6 py-2 rounded font-bold text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Učitavanje...' : 'Učitaj još'}
              </button>
            )}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 text-red-500 font-bold text-sm uppercase tracking-widest transition-all hover:text-red-400 ml-auto"
            >
              <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-105 origin-right">
                <span>{isExpanded ? 'Zatvori hitne poslove' : 'Otvori sve hitne poslove'}</span>
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
