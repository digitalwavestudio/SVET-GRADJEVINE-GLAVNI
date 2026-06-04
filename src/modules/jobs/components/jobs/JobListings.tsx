import React from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import { JobCard } from '@/src/modules/jobs/components/JobCard';
import { Link } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Briefcase } from 'lucide-react';

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name.substring(0, 2).toUpperCase();
};

// You might need to import or tweak the types depending on how they are defined in your app
interface JobListingsProps {
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  filteredJobs: any[];
  filteredPremiumJobs: any[];
  filteredUrgentJobs: any[];
  jobs: any[];
  loadingJobs: boolean;
  hasMore: boolean;
  loadMore: () => void;
  handleResetFilters: () => void;
  prefetch: (type: string, id?: string) => void;
  isDeepPagingLimitReached?: boolean;
}

export function JobListings({
  viewMode,
  setViewMode,
  filteredJobs,
  filteredPremiumJobs,
  filteredUrgentJobs,
  jobs,
  loadingJobs,
  hasMore,
  loadMore,
  handleResetFilters,
  prefetch,
  isDeepPagingLimitReached
}: JobListingsProps) {
  return (
    <div className="min-w-0 space-y-4">
      {/* AI Recommendation Strip */}
      <div className="bg-[#111a22]/60 backdrop-blur-xl border border-secondary/20 p-6 rounded-[10px] relative overflow-hidden shadow-2xl group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 blur-[100px] rounded-full group-hover:bg-secondary/20 transition-all duration-1000"></div>
        
        <div className="flex justify-between items-center mb-5 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 px-2 py-1 rounded-[10px]">
                <span className="material-symbols-outlined text-[14px] text-secondary animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">AI Preporuka</span>
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest opacity-40">Personalizovano za vas</span>
            </div>
          </div>
          <button className="text-secondary text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/btn">
            Sve preporuke 
            <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_right_alt</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 relative z-10">
          {[...filteredPremiumJobs, ...filteredUrgentJobs].slice(0, 6).map((job) => (
            <Link onMouseEnter={() => prefetch('job', job.id)} key={`ai-${job.id}`}
              to={buildJobUrl(job)}
              className="shrink-0 bg-white/5 border border-white/5 rounded-[10px] px-5 py-4 flex items-center gap-4 hover:bg-white/10 hover:border-secondary/30 transition-all cursor-pointer group/item shadow-xl min-w-[240px]"
            >
              <div className="w-10 h-10 rounded-[10px] bg-white p-1 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform overflow-hidden shrink-0">
                {job.logo ? (
                  <OptimizedImage 
                    src={job.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <div className="text-slate-950 font-black text-[10px]">{getInitials(job.comp)}</div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white group-hover/item:text-secondary transition-colors line-clamp-1 uppercase tracking-tight">{job.title}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-white/40 font-bold">{job.loc}</span>
                  <span className="w-1 h-1 rounded-full bg-secondary/40"></span>
                  <span className="text-[10px] text-secondary font-black">{job.sal}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Job List */}
      <div>
        {loadingJobs && jobs.length === 0 ? (
          <ListingSkeleton 
            count={viewMode === 'grid' ? 6 : 4} 
            viewMode={viewMode}
          />
        ) : filteredJobs.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest p-16 rounded-[10px] border border-white/5 text-center shadow-2xl flex flex-col items-center justify-center min-h-[400px]">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
               <span className="material-symbols-outlined text-6xl text-white/10" style={{ fontVariationSettings: '"FILL" 1' }}>search_off</span>
             </div>
             <h3 className="text-2xl font-black text-white/50 mb-3 uppercase tracking-tighter">Nema rezultata pretrage</h3>
             <p className="text-on-surface-variant text-base max-w-md mx-auto mb-8 font-medium">Trenutno nema poslova koji se poklapaju sa vašim kriterijumima. Pokušajte da promenite filtere ili lokaciju.</p>
             <button 
               onClick={handleResetFilters}
               className="bg-secondary text-slate-950 font-black px-12 py-5 rounded-[10px] text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(254,191,13,0.1)] active:scale-95"
             >
               Poništi sve filtere
             </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-4'}>
            {filteredJobs.map((job, index) => (
               <div key={job.id || index}>
                 <JobCard job={job} viewMode={viewMode} prefetch={prefetch} />
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Indicator */}
      {isDeepPagingLimitReached && jobs.length > 0 && (
        <div className="mt-12 text-center flex justify-center w-full">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
            <p className="text-xs text-red-400 font-bold">
              Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
            </p>
          </div>
        </div>
      )}

      {hasMore && jobs.length > 0 && (
        <div className="mt-12 text-center text-secondary font-black uppercase text-sm">
           {loadingJobs ? (
              "Učitavanje..."
           ) : (
              <button 
                 onClick={loadMore}
                 className="px-8 py-3 bg-white/5 border border-white/10 rounded-[10px] text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-xs"
              >
                 Učitaj još oglasa
              </button>
           )}
        </div>
      )}

      <div className="mt-4">
        <VerticalCTA 
          title="TRAŽITE RADNIKE?"
          description="POSTAVITE OGLAS ZA POSAO I PRONAĐITE NAJBOLJE MAJSTORE, INŽENJERE I STRUČNE TIMOVE ZA VAŠE PROJEKTE."
          buttonText="POSTAVI OGLAS"
          buttonLink="/postavi-oglas"
          icon={Briefcase}
        />
      </div>
    </div>
  );
}
