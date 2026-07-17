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
    if (job.isNegotiable) {
      return 'Pozvati';
    }

    let salaryText = '';
    if (job.plataMin != null && Number(job.plataMin) > 0) {
      const min = Number(job.plataMin).toLocaleString();
      const max = job.plataMax != null && Number(job.plataMax) > 0 && job.plataMax !== job.plataMin 
        ? `-${Number(job.plataMax).toLocaleString()}` 
        : '';
      salaryText = `${min}${max} €`;
    } else {
      salaryText = job.sal || job.salary || 'Po dogovoru';
    }

    // Fix redundant ranges like "5-5" -> "5" or "1000-1000" -> "1000"
    salaryText = salaryText.replace(/(\d+)\s*-\s*\1/g, '$1');

    // Style currency symbols to be smaller and slightly transparent
    const parts = salaryText.split(/(€|eur|din|rsd)/i);
    if (parts.length > 1) {
      return (
        <>
          {parts.map((part, index) => {
            if (/^(€|eur|din|rsd)$/i.test(part)) {
              return <span key={index} className="text-[0.7em] opacity-70 ml-[2px]">{part}</span>;
            }
            return part;
          })}
        </>
      );
    }

    return salaryText;
  };

  const isNovo = createdDate && (new Date().getTime() - createdDate.getTime() < 48 * 60 * 60 * 1000);

  const companyNameDisplay = job.authorSnapshot?.companyName || job.authorSnapshot?.displayName || job.comp || job.company || job.companyName || 'Svet Građevine Član';

  const titleParts = (job.title || '').split(/\s*—\s*|\s*-\s*/);
  const sektor = titleParts[0] || '';

  const grad = titleParts[1] || '';
  const cleanTitle = grad ? `${sektor} ${grad}` : sektor;

  const firstSpaceIdx = companyNameDisplay.indexOf(' ');
  const compRow1 = firstSpaceIdx !== -1 ? companyNameDisplay.substring(0, firstSpaceIdx) : companyNameDisplay;
  const compRow2 = firstSpaceIdx !== -1 ? companyNameDisplay.substring(firstSpaceIdx + 1) : '';

  const isPremium = job.isPremium;
  const isUrgent = job.isUrgent || job.isHitno;

  return (
    <article
      itemScope itemType="https://schema.org/JobPosting"
      className={`group relative flex flex-col h-full self-stretch min-h-[320px] md:min-h-[320px] rounded-[16px] transition-all duration-500 ${
        isPremium
          ? 'border border-secondary/30 bg-gradient-to-br from-secondary/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(254,191,13,0.1)] hover:border-yellow-400/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] hover:-translate-y-1'
          : isUrgent
            ? 'border border-red-500/15 bg-gradient-to-br from-red-500/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(239,68,68,0.03)] hover:border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.08)] hover:-translate-y-1'
            : 'border border-white/10 bg-white/[0.02] shadow-lg hover:bg-white/[0.04] hover:border-blue-400/30 hover:shadow-[0_0_30px_rgba(96,165,250,0.15)] hover:-translate-y-1'
      }`}
    >
      {createdDate && (
        <span hidden itemProp="datePosted">{createdDate.toISOString()}</span>
      )}

      <Link
        to={buildJobUrl(job)}
        onMouseEnter={() => prefetch('job', job.id)}
        className="absolute inset-0 z-10 rounded-[16px]"
        aria-label={`Pogledaj oglas ${job.title}`}
      />

      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent opacity-50 z-0 ${
        isPremium ? 'via-secondary' : isUrgent ? 'via-red-500' : 'via-white/20'
      }`}></div>

      <div className="p-4 md:p-5 flex flex-col w-full flex-1 relative z-20 pointer-events-none">
        {/* Logo - absolute top-right */}
        <div className="absolute top-4 right-4 w-[56px] h-[56px] min-w-[56px] max-w-[56px] md:w-[64px] md:h-[64px] md:min-w-[64px] md:max-w-[64px] bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1 shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm z-10 flex items-center justify-center overflow-hidden">
          {job.logo ? (
            <OptimizedImage
              src={job.logo}
              placeholder={job.logoPlaceholder}
              alt="Logo"
              className="w-full h-full object-contain rounded-full"
              width={64}
              height={64}
            />
          ) : (
            <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-800">
              {/* Blurred background effect to simulate a blurred logo */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-black blur-[2px] scale-110"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-40 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              {/* Padlock icon in the center */}
              <span className="material-symbols-outlined text-secondary relative z-10 text-[22px] md:text-[26px] drop-shadow-md">lock</span>
            </div>
          )}
        </div>

        {/* Badges row - mobile above title */}
        {(isUrgent || isPremium || isNovo) && (
          <div className="flex items-center gap-1.5 mb-2 pr-[68px] md:hidden">
            {isUrgent && (
                <span className="backdrop-blur-sm bg-red-500/8 text-red-400/80 border border-red-500/15 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 w-max">
                <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
              </span>
            )}
            {isPremium && (
              <span className="backdrop-blur-sm bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-[0_0_14px_rgba(254,191,13,0.3)]">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Premium
              </span>
            )}
            {isNovo && (
              <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-[0.1em] shadow-md">NOVO</span>
            )}
          </div>
        )}

        {/* Desktop: title + badges in one row */}
        <div className="flex flex-wrap items-start gap-2 pr-[68px] mb-2">
          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-secondary transition-colors duration-300 mt-1 uppercase break-words tracking-wide leading-tight flex-1 min-w-[120px]">
            {(() => {
              const t = job.title || '';
              const i = t.indexOf(' — ');
              if (i === -1) return t;
              return <>{t.slice(0, i)}<br />{t.slice(i + 3)}</>;
            })()}
          </h3>
          {(isUrgent || isPremium || isNovo) && (
            <div className="hidden md:flex items-center gap-1.5 shrink-0 mt-1">
              {isUrgent && (
              <span className="backdrop-blur-sm bg-red-500/8 text-red-400/80 border border-red-500/15 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 w-max">
                  <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
                </span>
              )}
              {isPremium && (
                <span className="backdrop-blur-sm bg-gradient-to-r from-secondary/20 to-secondary/5 text-secondary border border-secondary/30 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-[0_0_14px_rgba(254,191,13,0.3)]">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span> Premium
                </span>
              )}
              {isNovo && (
                <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] shadow-md">NOVO</span>
              )}
            </div>
          )}
        </div>

        <div className="pb-3 md:pb-4 border-b border-white/5 relative z-20">
          <div className="flex items-center gap-1">
            {job.companyId ? (
              <Link
                to={`/firma/${job.companyId}`}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold uppercase tracking-widest relative z-20 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {companyNameDisplay}
              </Link>
            ) : (
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {companyNameDisplay}
              </span>
            )}
            {job.isCompanyVerified && (
              <span className="material-symbols-outlined text-green-500 text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            )}
          </div>
        </div>

        {(() => {
          const benefitsSlugs = job.benefits || job.benefiti || job.rawBenefits || [];
          const hasSmestaj = benefitsSlugs.includes('smestaj') || job.smestaj === true || job.housing === true;
          const hasPrevoz = benefitsSlugs.includes('prevoz') || job.prevoz === true || job.transport === true;
          const hasHrana = benefitsSlugs.includes('topli-obrok') || benefitsSlugs.includes('hrana') || job.hrana === true || job.food === true || job.topliObrok === true;
          return (
            <div className="mt-auto relative z-10 flex items-end justify-between min-h-[48px] pt-4">
              {/* Left side: Badges or Views */}
              <div className="flex flex-col gap-1.5">
                {hasSmestaj && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] rounded-md font-bold uppercase tracking-wider shadow-sm w-full">
                    <span className="material-symbols-outlined text-[13px] text-green-400">home</span> Smeštaj
                  </span>
                )}
                {hasPrevoz && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] rounded-md font-bold uppercase tracking-wider shadow-sm w-full">
                    <span className="material-symbols-outlined text-[13px] text-blue-400">commute</span> Prevoz
                  </span>
                )}
                {hasHrana && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] rounded-md font-bold uppercase tracking-wider shadow-sm w-full">
                    <span className="material-symbols-outlined text-[13px] text-yellow-400">restaurant</span> Hrana
                  </span>
                )}
              </div>

              {/* Right side: Salary */}
              {(job.isNegotiable || job.plataMin != null || job.plataMax != null || job.sal || job.salary) ? (
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Satnica</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFF5D6] font-black text-xl md:text-2xl font-sans leading-none tracking-tight">
                    {getSalaryDisplay()}
                  </span>
                </div>
              ) : (
                <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest shrink-0 mb-1">Po dogovoru</span>
              )}
            </div>
          );
        })()}
      </div>
    </article>
  );
});
