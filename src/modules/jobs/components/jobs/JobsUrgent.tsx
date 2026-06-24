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
            <div key={job.id} className="group relative flex flex-col shrink-0 h-full rounded-[16px] transition-all duration-500 overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-500/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(239,68,68,0.05)] hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:-translate-y-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 z-0"></div>
              
              <div className="p-5 flex flex-col w-full h-full relative z-10">
                
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.1)] w-max">
                      <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
                    </span>
                    <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{formatDate(job.createdAt)}</span>
                  </div>
                  
                  {/* Logo Top Right */}
                  <div className="w-[48px] h-[48px] min-w-[48px] max-w-[48px] bg-white rounded-full p-1 shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm relative z-10 flex items-center justify-center overflow-hidden">
                    {job.logo ? (
                      <OptimizedImage 
                        src={job.logo} 
                        fallbackType="company" 
                        alt="Logo" 
                        className="w-full h-full object-contain rounded-full" 
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-xs">
                        {getInitials(job.comp)}
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-black text-lg md:text-xl text-white mb-1 uppercase line-clamp-2 tracking-tight group-hover:text-red-400 transition-colors duration-300">
                  <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0">
                    {job.title}
                  </Link>
                </h3>
                
                <div className="mb-4 relative z-20">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-200 to-white text-[10px] md:text-xs font-black uppercase tracking-widest">
                    {job.comp || 'Svet Građevine'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 mb-4 mt-auto">
                  <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[12px] text-red-400">location_on</span> {job.loc || job.lokacijaStr}
                  </span>
                  {job.sal && (
                    <span className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[12px] text-secondary">payments</span> {job.sal}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-white/5 relative z-10 flex items-center justify-center">
                   <Link to={buildJobUrl(job)} className="w-full justify-center bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black px-4 py-2.5 rounded-[10px] transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 relative z-20 shadow-sm">
                     POGLEDAJ OGLAS
                     <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                   </Link>
                </div>
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
