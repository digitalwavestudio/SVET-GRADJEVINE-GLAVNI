import React from 'react';
import { Link } from 'react-router-dom';
import { BENEFITS } from '@/src/constants/taxonomy';
import { buildJobUrl } from '@/src/lib/seo';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { PremiumBadge } from '@/src/components/ui/PremiumBadge';

const getInitials = (name?: string) => {
  if (!name) return "SG";
  return name.substring(0, 2).toUpperCase();
};

export const JobCard = React.memo(({ job, viewMode, prefetch }: { job: any; viewMode: 'list' | 'grid'; prefetch: (t: string, id?: string) => void }) => {
  return (
    <article 
      itemScope itemType="https://schema.org/JobPosting"
      className={`group relative h-full glass-card border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 overflow-hidden ${viewMode === 'list' ? 'p-5 flex flex-col md:flex-row items-center gap-5' : 'p-5 flex flex-col'} ${job.isPremium ? 'border-secondary/30 bg-secondary/[0.03] shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}
    >
      <span hidden itemProp="datePosted">{job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString()}</span>
      {/* Premium Glow Effect */}
      {job.isPremium && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50"></div>
      )}

      {/* New Badge */}
      {job.createdAt && (new Date().getTime() - new Date(job.createdAt).getTime() < 48 * 60 * 60 * 1000) && (
        <span className="absolute top-4 right-4 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] z-20">
          NOVO
        </span>
      )}

      {/* Logo Section */}
      <div className={`${viewMode === 'list' ? 'w-20 h-20' : 'w-16 h-16 mb-4'} shrink-0 bg-white rounded-[10px] p-2 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-500 relative z-10 overflow-hidden`}>
        {job.logo ? (
          <OptimizedImage
            src={job.logo}
            placeholder={job.logoPlaceholder}
            alt="Logo"
            className="w-full h-full object-contain aspect-square"
            width={80}
            height={80}
          />
        ) : (
          <div className="w-full h-full bg-slate-950/5 rounded-[10px] flex items-center justify-center text-slate-950 font-black text-xl">
            {getInitials(job.comp)}
          </div>
        )}
        {job.isCompanyVerified && (
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border border-white shadow-[0_0_10px_rgba(34,197,94,0.5)] z-20">
            <span className="material-symbols-outlined text-white text-[8px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="flex-grow w-full relative z-10">
        <div className="flex flex-col mb-3">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h3 itemProp="title" className={`${viewMode === 'list' ? 'text-xl' : 'text-lg'} font-black text-white group-hover:text-secondary transition-colors duration-300 uppercase tracking-tight`}>
              <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0">
                {job.title}
              </Link>
            </h3>
            {job.isUrgent && (
              <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.1em] shadow-lg shadow-red-500/20 flex items-center gap-1">
                🔥 HITNO
              </span>
            )}
            {job.isPremium && <PremiumBadge />}
          </div>
          <div className="flex items-center gap-2">
            {job.companyId ? (
              <div className="flex items-center gap-1" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                <Link itemProp="url" to={`/firma/${job.companyId}`} className="text-secondary text-[10px] font-bold uppercase tracking-widest opacity-80 hover:underline relative z-20">
                  <span itemProp="name">{job.comp}</span>
                </Link>
                {job.isCompanyVerified && (
                  <div className="hidden md:flex items-center gap-1.5 bg-[#0A1A0F]/90 border border-green-500/30 backdrop-blur-xl px-2 py-0.5 rounded-[4px] shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                    <span className="text-[7px] font-black tracking-[0.15em] uppercase text-green-400">APR Verifikovan</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name" className="text-secondary text-[10px] font-bold uppercase tracking-widest opacity-80">{job.comp}</span>
                {job.isCompanyVerified && (
                  <div className="hidden md:flex items-center gap-1.5 bg-[#0A1A0F]/90 border border-green-500/30 backdrop-blur-xl px-2 py-0.5 rounded-[4px] shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                    <span className="text-[7px] font-black tracking-[0.15em] uppercase text-green-400">APR Verifikovan</span>
                  </div>
                )}
              </div>
            )}
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">{job.cat}</span>
          </div>
        </div>

        {/* Tags/Benefits & Stats */}
        <div className="flex gap-4 flex-wrap mb-4 items-center">
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Lokacija</span>
            <span itemProp="jobLocation" itemScope itemType="https://schema.org/Place" className="flex items-center gap-1 text-white/60 text-[10px] font-bold">
              <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">location_on</span>
              <span itemProp="address" itemScope itemType="https://schema.org/PostalAddress"><span itemProp="addressLocality">{job.loc}</span></span>
            </span>
          </div>
          
          <div className="hidden md:flex flex-col border-l border-white/5 pl-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Pregledi</span>
            <span className="flex items-center gap-1 text-white/60 text-[10px] font-mono">
              <span className="material-symbols-outlined text-[14px] text-secondary">visibility</span> {job.viewsCount || 0}
            </span>
          </div>

          <div className="hidden md:flex flex-col border-l border-white/5 pl-4">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Prijave</span>
            <span className="flex items-center gap-1 text-white/60 text-[10px] font-mono">
              <span className="material-symbols-outlined text-[14px] text-blue-400">group</span> {job.app || job.applicantsCount || 0}
            </span>
          </div>

          <div className="hidden md:flex flex-wrap gap-2">
            {(job.benefits || []).slice(0, viewMode === 'list' ? 3 : 2).map((benefitSlug: string) => {
              const benefit = BENEFITS.find(b => b.slug === benefitSlug);
              if (!benefit) return null;
              return (
                <span key={benefitSlug} className="flex items-center gap-1 px-2 py-0.5 bg-white/5 text-white/50 text-[9px] rounded-sm font-bold border border-white/5 uppercase tracking-wider">
                   {benefit.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className={`${viewMode === 'list' ? 'md:min-w-[150px] md:text-right flex md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-white/5' : 'mt-auto pt-4 border-t border-white/5 flex items-center justify-between'} relative z-10`}>
        <div className="flex flex-col items-start md:items-end">
          <div className="text-secondary font-black text-lg mb-1 font-mono">
            {job.sal}
          </div>
          {viewMode === 'list' && (
            <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-3 font-mono">
              {job.time}
            </div>
          )}
        </div>
        
        {viewMode === 'list' ? (
          <Link 
            to={buildJobUrl(job)}
            state={{ job: {
              title: job.title,
              company: job.comp,
              location: job.loc,
              tacnaLokacija: job.tacnaLokacija,
              type: job.engagementSlug === 'puno-radno-vreme' ? 'FULL TIME' : job.engagementSlug,
              start: 'Odmah',
              salary: job.sal,
              time: job.time,
              status: job.status,
              isPremium: job.isPremium,
              isUrgent: job.isUrgent
            }}}
            className="hidden md:inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black px-6 py-3 rounded-[10px] border border-white/10 transition-all uppercase tracking-widest text-[10px]"
          >
            POGLEDAJ 
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        ) : (
          <Link 
            to={buildJobUrl(job)}
            className="hidden md:flex w-10 h-10 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-white hover:bg-white/10 hover:text-secondary transition-all"
          >
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        )}
      </div>
    </article>
  );
});
