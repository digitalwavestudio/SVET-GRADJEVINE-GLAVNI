import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { formatDate } from '@/src/lib/dateUtils';

interface JobsUrgentProps {
  jobs: any[];
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  prefetch: (type: 'job' | 'company', id?: string) => void;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(isExpanded ? jobs : jobs.slice(0, 4))
            .map((job) => (
            <div key={job.id} className="bg-surface-container-lowest p-6 rounded-[10px] border border-error/20 hover:border-error/50 transition-all group relative flex flex-col h-full shadow-lg shadow-black/5">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-error text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-error/20">HITNO</span>
                <span className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">{formatDate(job.createdAt)}</span>
              </div>
              <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0 uppercase tracking-tight">
                  {job.title}
                </Link>
              </h3>
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-6 flex-grow">
                <span className="flex items-center gap-1 mb-1"><span className="material-symbols-outlined text-[12px]">location_on</span> {job.loc || job.lokacijaStr}</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span> {job.sal}</span>
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10 relative z-10 mt-auto">
                <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center font-bold text-slate-950 overflow-hidden shrink-0 shadow-lg shadow-black/10 p-1">
                  {job.logo ? (
                    <OptimizedImage 
                      src={job.logo} 
                      fallbackType="company" 
                      alt="Logo" 
                      className="w-full h-full object-contain p-1" 
                      containerClassName="w-full h-full border rounded-[10px]"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-950/5 rounded flex items-center justify-center text-[10px] font-black">{getInitials(job.comp)}</div>
                  )}
                </div>
                <span className="text-xs font-bold uppercase line-clamp-1">{job.comp}</span>
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                  <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                  <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema hitno istaknutih poslova</h3>
                  <p className="text-on-surface-variant text-base">Hitnih oglasa trenutno nema u bazi podataka za izabrane kriterijume.</p>
              </div>
          )}
        </div>
        
        {jobs.length > 4 && (
          <div className="mt-10 flex flex-col items-center justify-end md:flex-row md:justify-between gap-4">
            {isExpanded && hasMore && (
              <button 
                onClick={() => loadMore?.()}
                disabled={loadingMore}
                className="bg-error/10 text-error border border-error/30 px-6 py-2 rounded font-bold text-sm uppercase tracking-widest hover:bg-error/20 transition-all disabled:opacity-50"
              >
                {loadingMore ? 'Učitavanje...' : 'Učitaj još'}
              </button>
            )}
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 text-secondary font-bold text-sm uppercase tracking-widest transition-all hover:text-yellow-400 ml-auto"
            >
              <div className="flex items-center gap-2 transition-transform duration-300 group-hover:scale-[1.08] origin-right">
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
