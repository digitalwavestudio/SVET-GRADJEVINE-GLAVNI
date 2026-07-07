import React from 'react';
import { Link } from 'react-router-dom';
import { BENEFITS, LOCATIONS } from '@/src/constants/taxonomy';
import { buildJobUrl } from '@/src/lib/seo';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { PremiumBadge } from '@/src/components/ui/PremiumBadge';

const getInitials = (name?: string) => {
  if (!name) return "SG";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export const JobCard = React.memo(({ job, viewMode, prefetch }: { job: any; viewMode: 'list' | 'grid'; prefetch: (t: string, id?: string) => void }) => {
  const parseDate = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null && typeof val.toDate === 'function') return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };
  const createdDate = parseDate(job.createdAt);

  const friendlyLoc = LOCATIONS.find(l => l.slug === job.loc || l.slug === job.location)?.name || job.loc || job.location || 'Srbija';

  const getSalaryDisplay = () => {
    if (job.plataMin != null) {
      const min = Number(job.plataMin).toLocaleString();
      const max = job.plataMax != null ? ` – ${Number(job.plataMax).toLocaleString()}` : '';
      return `${min}${max} €`;
    }
    return job.sal || job.salary || 'Dogovor';
  };

  const isNovo = createdDate && (new Date().getTime() - createdDate.getTime() < 48 * 60 * 60 * 1000);

  const fallbackAuthor = job.authorName || job.userName || job.creatorName || job.contactName || job.contactPerson || job?.contact?.name || job?.contact?.person || job?.user?.name || job?.user?.displayName || 'Anonimni Korisnik';

  const rawComp = job.comp || job.company || job.companyName;
  const companyNameDisplay = (rawComp && rawComp.toLowerCase() !== 'kompanija' && rawComp.toLowerCase() !== 'company') 
    ? rawComp 
    : fallbackAuthor;

  const titleParts = (job.title || '').split(/\s*—\s*|\s*-\s*/);
  const sektor = titleParts[0] || '';
  const grad = titleParts[1] || '';
  const cleanTitle = grad ? `${sektor} ${grad}` : sektor;

  const firstSpaceIdx = companyNameDisplay.indexOf(' ');
  const compRow1 = firstSpaceIdx !== -1 ? companyNameDisplay.substring(0, firstSpaceIdx) : companyNameDisplay;
  const compRow2 = firstSpaceIdx !== -1 ? companyNameDisplay.substring(firstSpaceIdx + 1) : '';

  return (
    <>
      {/* Mobile Card Layout */}
      <article 
        itemScope itemType="https://schema.org/JobPosting"
        className={`md:hidden group relative h-[285px] rounded-[16px] p-5 flex flex-col transition-all duration-300 overflow-hidden ${
          job.isPremium 
            ? 'border border-secondary/30 bg-gradient-to-br from-secondary/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(254,191,13,0.1)]' 
            : 'border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-lg'
        }`}
      >
        {createdDate && (
          <span hidden itemProp="datePosted">{createdDate.toISOString()}</span>
        )}

        {/* Absolute Top Right Logo */}
        <div className="absolute top-5 right-5 w-10 h-10 shrink-0 bg-white rounded-full p-1 flex items-center justify-center border border-white/5 z-20 overflow-hidden shadow-sm">
          {job.logo ? (
            <OptimizedImage
              src={job.logo}
              placeholder={job.logoPlaceholder}
              alt="Logo"
              className="w-full h-full object-contain aspect-square rounded-full"
              width={40}
              height={40}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-xs">
              {getInitials(companyNameDisplay)}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="relative z-10 mb-0.5 pr-12 w-full min-w-0">
          <h3 itemProp="title" className="text-lg font-sans font-black text-white group-hover:text-secondary transition-colors duration-300 uppercase tracking-tight leading-snug w-full min-w-0">
            <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0 flex flex-col items-start w-full min-w-0">
              <span className="truncate w-full text-left" style={{ fontSize: '1.1em', lineHeight: '1.2' }}>{sektor}</span>
              {grad && <span className="truncate w-full text-left font-bold" style={{ fontSize: '0.75em', marginTop: '2px' }}>{grad}</span>}
            </Link>
          </h3>
        </div>

        {/* Company, Category & Premium Badge Row */}
        <div className="flex items-center justify-between mt-3 mb-2 relative z-10 border-b border-white/5 pb-2">
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-start gap-1">
              {job.companyId ? (
                <Link to={`/firma/${job.companyId}`} className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] hover:brightness-110 text-xs font-black uppercase tracking-widest relative z-20 flex flex-col items-start leading-tight">
                  <span>{compRow1}</span>
                  {compRow2 && <span>{compRow2}</span>}
                </Link>
              ) : (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] text-xs font-black uppercase tracking-widest flex flex-col items-start leading-tight">
                  <span>{compRow1}</span>
                  {compRow2 && <span>{compRow2}</span>}
                </span>
              )}
              {job.isCompanyVerified && (
                <span className="material-symbols-outlined text-green-500 text-[12px] font-black mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              )}
            </div>
            {!job.isPremium && (
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider truncate">{job.cat}</span>
            )}
          </div>

          {job.isPremium && (
            <div className="shrink-0 flex items-center">
              <span className="bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(254,191,13,0.2)]">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Premium
              </span>
            </div>
          )}
        </div>

        {/* Header: Tags */}
        {(job.isUrgent || isNovo) && (
          <div className="flex flex-wrap items-center gap-2 mb-3 relative z-10 pr-12">
            {isNovo && (
              <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] shadow-md flex items-center">
                NOVO
              </span>
            )}
            {job.isUrgent && (
              <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
              </span>
            )}
          </div>
        )}

        {/* Benefits (Middle) */}
        {(() => {
          const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
          const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
          const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
          const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;

          if (!hasSmestaj && !hasPrevoz && !hasHrana) return <div className="mb-2"></div>;

          return (
            <div className="flex flex-wrap gap-1 mb-2 relative z-10">
              {hasSmestaj && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[8px] rounded-md font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                  <span className="material-symbols-outlined text-[10px] text-green-400">home</span> Smeštaj
                </span>
              )}
              {hasPrevoz && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[8px] rounded-md font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                  <span className="material-symbols-outlined text-[10px] text-blue-400">commute</span> Prevoz
                </span>
              )}
              {hasHrana && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white/5 border border-white/10 text-slate-300 text-[8px] rounded-md font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                  <span className="material-symbols-outlined text-[10px] text-yellow-400">restaurant</span> Hrana
                </span>
              )}
            </div>
          );
        })()}

        {/* Footer: Salary & Views (Bottom) */}
        <div className="mt-auto pt-2 flex items-end justify-between relative z-10">
          <div className="flex items-center text-slate-400 gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-blue-400">visibility</span> 
            <span className="text-xs font-black font-sans">{job.viewsCount || 0}</span>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2.5 leading-none">
              {job.salaryType === 'hourly' ? 'Satnica' : 'Plata'}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFF5D6] font-black text-xl font-sans leading-none tracking-tight">
              {getSalaryDisplay()}
            </span>
          </div>
        </div>

        {/* Action Link for entire card on Mobile */}
        <Link 
          to={buildJobUrl(job)}
          className="absolute inset-0 z-0"
          aria-label="Pogledaj oglas"
        />
      </article>

      {/* Desktop Card Layout */}
      <article 
        itemScope itemType="https://schema.org/JobPosting"
        className={`hidden md:flex group relative h-full rounded-[16px] transition-all duration-500 overflow-hidden ${viewMode === 'list' ? 'p-5 flex-row items-center gap-5' : 'p-5 flex-col items-center text-center'} ${
          job.isPremium 
            ? 'border border-secondary/30 bg-gradient-to-br from-secondary/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(254,191,13,0.1)] hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:-translate-y-1' 
            : 'border border-white/10 bg-white/[0.02] backdrop-blur-sm shadow-lg hover:bg-white/[0.04] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:-translate-y-1'
        }`}
      >
        {createdDate && (
          <>
            <span hidden itemProp="datePosted">{createdDate.toISOString()}</span>
            {job.isPremium && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50"></div>
            )}
          </>
        )}

        {/* Logo Section */}
        <div className={`${viewMode === 'list' ? 'w-16 h-16' : 'w-14 h-14 mb-3'} shrink-0 bg-white rounded-full p-1.5 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform duration-500 relative z-10 overflow-hidden shadow-sm`}>
          {job.logo ? (
            <OptimizedImage
              src={job.logo}
              placeholder={job.logoPlaceholder}
              alt="Logo"
              className="w-full h-full object-contain aspect-square rounded-full"
              width={64}
              height={64}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-xl">
              {getInitials(companyNameDisplay)}
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className={`flex-grow w-full relative z-10 ${viewMode === 'grid' ? 'flex flex-col items-center' : ''}`}>
            {/* Title + Badges + Salary row */}
          <div className={`flex items-start gap-3 mb-1 flex-wrap w-full ${viewMode === 'grid' ? 'justify-center' : ''}`}>
            <div className="flex flex-col items-start min-w-0 md:max-w-[450px]">
              <h3 itemProp="title" className={`${viewMode === 'list' ? 'text-xl' : 'text-sm'} font-sans font-black text-white group-hover:text-secondary transition-colors duration-300 uppercase tracking-tight leading-snug w-full min-w-0`}>
                <Link onMouseEnter={() => prefetch('job', job.id)} to={buildJobUrl(job)} className="after:absolute after:inset-0 flex flex-col items-start w-full min-w-0">
                  <span className="truncate w-full text-left" style={{ fontSize: '1.1em', lineHeight: '1.2' }}>{sektor}</span>
                  {grad && <span className="truncate w-full text-left font-bold" style={{ fontSize: '0.75em', marginTop: '2px' }}>{grad}</span>}
                </Link>
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {job.isUrgent && (
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
                </span>
              )}
              {job.isPremium && (
                <span className="bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(254,191,13,0.2)]">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Premium
                </span>
              )}
            </div>
            {viewMode === 'list' && (
              <div className="ml-auto text-right flex flex-col items-end">
                <div className="flex items-center gap-1.5 mb-2">
                  {isNovo && (
                    <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] shadow-md">
                      NOVO
                    </span>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
                    {job.salaryType === 'hourly' ? 'Satnica' : 'Plata'}
                  </span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFF5D6] font-black text-[22px] font-sans leading-none tracking-tight">
                  {getSalaryDisplay()}
                </span>
              </div>
            )}
          </div>

          {/* Company */}
          <div className={`flex items-center gap-2 mb-2 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
            {job.companyId ? (
              <div className="flex items-center gap-1" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                <Link itemProp="url" to={`/firma/${job.companyId}`} className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] hover:brightness-110 text-xs font-black uppercase tracking-widest relative z-20">
                  <span itemProp="name">{companyNameDisplay}</span>
                </Link>
                {job.isCompanyVerified && (
                  <span className="material-symbols-outlined text-green-500 text-[12px] font-black ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1" itemProp="hiringOrganization" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name" className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] text-xs font-black uppercase tracking-widest">{companyNameDisplay}</span>
                {job.isCompanyVerified && (
                  <span className="material-symbols-outlined text-green-500 text-[12px] font-black ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                )}
              </div>
            )}
          </div>

          {/* Benefits + Views + POGLEDAJ row */}
          {viewMode === 'list' ? (
            <div className="hidden md:flex items-center justify-between gap-2">
              <div className="flex gap-1.5 items-center flex-wrap">
                {(() => {
                  const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                  const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                  const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                  const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;
                  return (
                    <>
                      {hasSmestaj && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                          <span className="material-symbols-outlined text-[12px] text-green-400">home</span> Smeštaj
                        </span>
                      )}
                      {hasPrevoz && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                          <span className="material-symbols-outlined text-[12px] text-blue-400">commute</span> Prevoz
                        </span>
                      )}
                      {hasHrana && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 border border-white/10 text-slate-300 text-[9px] rounded-md font-bold uppercase tracking-wider shadow-sm">
                          <span className="material-symbols-outlined text-[12px] text-yellow-400">restaurant</span> Hrana
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-[14px] text-blue-400">visibility</span>
                  <span className="text-xs font-black font-sans">{job.viewsCount || 0}</span>
                </span>
                <Link 
                  to={buildJobUrl(job)}
                  state={{ job: {
                    title: cleanTitle,
                    company: companyNameDisplay,
                    location: job.loc,
                    tacnaLokacija: job.tacnaLokacija,

                    start: 'Odmah',
                    salary: job.sal,
                    time: job.time,
                    status: job.status,
                    isPremium: job.isPremium,
                    isUrgent: job.isUrgent
                  }}}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-black px-5 py-2.5 rounded-[10px] border border-white/10 transition-all uppercase tracking-widest text-[10px]"
                >
                  POGLEDAJ 
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className={`flex gap-1.5 items-center flex-wrap ${viewMode === 'grid' ? 'justify-center mb-3' : ''}`}>
              {(() => {
                const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
                const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
                const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
                const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;
                return (
                  <>
                    {hasSmestaj && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] rounded-full font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[9px]">home</span> Smeštaj
                      </span>
                    )}
                    {hasPrevoz && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] rounded-full font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[9px]">commute</span> Prevoz
                      </span>
                    )}
                    {hasHrana && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[8px] rounded-full font-bold uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[9px]">restaurant</span> Hrana
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-blue-400 text-[9px] font-mono ml-auto">
                      <span className="material-symbols-outlined text-[12px] text-blue-400">visibility</span> {job.viewsCount || 0}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Action Section (grid only) */}
        {viewMode !== 'list' && (
          <div className="w-full mt-auto pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
            <div className="text-transparent bg-clip-text bg-gradient-to-br from-[#FDE68A] via-[#D4AF37] to-[#B45309] font-black text-xl font-sans tracking-tight">
              {getSalaryDisplay()}
            </div>
            <Link 
              to={buildJobUrl(job)}
              className="w-10 h-10 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-white hover:bg-white/10 hover:text-secondary transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        )}
      </article>
    </>
  );
});
