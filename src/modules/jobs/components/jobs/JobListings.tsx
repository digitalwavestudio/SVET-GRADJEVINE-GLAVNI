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
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
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
{/* AI recommendation removed */}
      

      {/* Job List */}
      <div>
        {loadingJobs && jobs.length === 0 ? (
          <ListingSkeleton 
            count={viewMode === 'grid' ? 6 : 4} 
            viewMode={viewMode}
          />
        ) : filteredJobs.length === 0 ? (
          <div className="w-full bg-[#13212e]/20 p-12 rounded-[10px] border border-white/5 text-center flex flex-col items-center justify-center min-h-[350px]">
            <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>search_off</span>
            <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Nema pronađenih oglasa</h3>
            <p className="text-on-surface-variant text-base">Pokušajte da izmenite filtere ili pretragu.</p>
            <button onClick={handleResetFilters} className="mt-6 px-6 py-2.5 bg-secondary text-black font-black rounded uppercase text-xs tracking-widest hover:bg-yellow-500 transition-colors">Resetuj filtere</button>
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
