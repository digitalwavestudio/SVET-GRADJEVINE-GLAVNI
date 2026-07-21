import React from 'react';
import { JobCard } from '@/src/modules/jobs/components/JobCard';

interface JobsPremiumProps {
  jobs: any[];
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  prefetch: (type: string, id?: string) => void;
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
            <p className="text-on-surface-variant text-lg max-w-xl">Najistaknutije poslovne prilike vodećih kompanija u građevinskoj industriji.</p>
            <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
          </div>
        </div>
        
        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch auto-rows-fr">
            {(isExpanded ? jobs : jobs.slice(0, 4)).map((job) => (
              <JobCard key={job.id} job={job} viewMode="grid" prefetch={prefetch} />
            ))}
          </div>
        ) : (
          <div className="w-full bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
              <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
              <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema premium istaknutih poslova</h3>
              <p className="text-on-surface-variant text-base">Premium poslova trenutno nema u bazi podataka za izabrane kriterijume.</p>
          </div>
        )}
        
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
