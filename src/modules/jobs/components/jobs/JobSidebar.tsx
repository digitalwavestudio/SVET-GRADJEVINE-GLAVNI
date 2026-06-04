import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';

interface JobSidebarProps {
  jobData: any;
  isLoggedIn: boolean;
  isSaved: boolean;
  hasApplied: boolean;
  isApplicationPending: (id: string) => boolean;
  toggleSavedJob: (id: string) => void;
  setShowReportModal: (show: boolean) => void;
  setShowApplicationModal: (show: boolean) => void;
  navigate: (path: string) => void;
  buildJobUrl: (job: any) => string;
  displaySimilarJobs: any[];
}

export function JobSidebar({
  jobData,
  isLoggedIn,
  isSaved,
  hasApplied,
  isApplicationPending,
  toggleSavedJob,
  setShowReportModal,
  setShowApplicationModal,
  navigate,
  buildJobUrl,
  displaySimilarJobs
}: JobSidebarProps) {
  return (
    <aside className="lg:col-span-4 space-y-8 relative">
      <div className="sticky top-32 space-y-6">
        {/* Company Card */}
        <div className="bg-gradient-to-br from-surface-container-high to-surface p-8 rounded-[10px] border border-white/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-[10px] bg-white flex items-center justify-center shadow-sm border border-white/5 overflow-hidden shrink-0 p-1.5">
              {jobData.logo ? (
                <OptimizedImage 
                  src={jobData.logo} 
                  fallbackType="company" 
                  alt="Logo" 
                  className="w-full h-full object-cover aspect-square" 
                  containerClassName="w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-slate-950/5 rounded-[10px] flex items-center justify-center text-slate-950 font-black text-xl">
                  {jobData.companyId ? jobData.companyDetails?.initials : (jobData.authorName ? jobData.authorName.charAt(0) : 'S')}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-white font-black text-xl leading-tight uppercase">{jobData.company}</h3>
                {jobData.companyId && <span className="material-symbols-outlined text-emerald-500 text-lg" title="Verifikovan poslodavac">verified</span>}
              </div>
              {jobData.companyId ? (
                <Link className="text-secondary text-sm font-bold hover:underline" to={`/firma/${jobData.companyId}`}>Prikaži profil firme</Link>
              ) : (
                <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest leading-none">Nezavisni poslodavac</span>
              )}
            </div>
          </div>
          <dl className="space-y-4 mb-8 w-full">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <dt className="text-on-surface-variant font-bold">Telefon:</dt>
              <dd>
                {isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <span className="text-secondary font-bold">{jobData.companyDetails?.phone || jobData.telefon}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(jobData.companyDetails?.phone || jobData.telefon)}
                      className="px-2 py-1 border border-white/20 rounded text-[10px] font-black text-white hover:bg-white hover:text-on-surface transition-all uppercase tracking-tighter"
                    >
                      KOPIRAJ
                    </button>
                  </div>
                ) : (
                  <span className="text-on-surface-variant italic text-xs">Skriveno</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <dt className="text-on-surface-variant font-bold">Web:</dt>
              <dd><a className="text-primary font-bold hover:underline" href={`https://${jobData.companyDetails?.web}`} target="_blank" rel="noopener noreferrer">{jobData.companyDetails?.web || 'Nije navedeno'}</a></dd>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <dt className="text-on-surface-variant font-bold">Delatnost:</dt>
              <dd className="text-white font-medium">{jobData.companyDetails?.industry || 'Građevinarstvo'}</dd>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
              <dt className="text-on-surface-variant font-bold">Satnica:</dt>
              <dd className="text-white font-medium">{jobData.companyDetails?.hourlyRate || 'Po dogovoru'}</dd>
            </div>
            <div className="flex justify-between items-center text-sm pb-2">
              <dt className="text-on-surface-variant font-bold">Radno vreme:</dt>
              <dd className="text-white font-medium">{jobData.companyDetails?.workingHours || jobData.type}</dd>
            </div>
          </dl>
          <div className="flex items-center gap-2 mt-4 mb-8 text-[11px] font-bold text-secondary bg-secondary/5 py-2 px-3 rounded-[10px] border border-secondary/10 w-fit">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
            <span>Prosečno vreme odgovora: {jobData.companyDetails?.responseTime || 'Brzo'}</span>
          </div>
          <div className="space-y-3">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={() => !hasApplied && setShowApplicationModal(true)} 
                  disabled={hasApplied || isApplicationPending(jobData.id)}
                  className={(hasApplied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default" : UI_TOKENS.BTN_PRIMARY) + " w-full flex items-center justify-center gap-2 mb-2 h-14 rounded-[10px] transition-all font-black uppercase tracking-widest text-xs"}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{hasApplied ? 'check_circle' : isApplicationPending(jobData.id) ? 'hourglass_empty' : 'send'}</span>
                  {hasApplied ? 'PRIJAVA POSLATA' : isApplicationPending(jobData.id) ? 'SLANJE...' : 'Prijavi se na oglas'}
                </button>
                {(jobData.viber || jobData.whatsapp) && (
                  <div className="flex gap-3">
                    {jobData.viber && (
                      <a href={`viber://chat?number=${(jobData.telefon || jobData.companyDetails?.phone || '').replace(/[^0-9+]/g, '')}`} className="flex-1 bg-[#7360f2] text-white py-4 rounded-[10px] font-black flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-colors uppercase text-sm">
                        <span className="material-symbols-outlined">chat</span>
                        Viber
                      </a>
                    )}
                    {jobData.whatsapp && (
                      <a href={`https://wa.me/${(jobData.telefon || jobData.companyDetails?.phone || '').replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25d366] text-white py-4 rounded-[10px] font-black flex items-center justify-center gap-2 hover:brightness-110 shadow-lg transition-colors uppercase text-sm">
                        <span className="material-symbols-outlined">forum</span>
                        WhatsApp
                      </a>
                    )}
                  </div>
                )}
                <a href={`tel:${jobData.telefon || jobData.companyDetails?.phone}`} className="w-full border-2 border-white/20 text-white py-4 rounded-[10px] font-black flex items-center justify-center gap-2 hover:bg-white hover:text-on-surface transition-colors uppercase">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>phone</span>
                  Pozovite poslodavca
                </a>
              </>
            ) : (
              <button 
                onClick={() => navigate('/prijava')}
                className={UI_TOKENS.BTN_PRIMARY + " w-full text-sm tracking-widest relative z-10"}
              >
                <span className="material-symbols-outlined">lock</span>
                Prijavi se za kontakt
              </button>
            )}
            <div className="flex gap-2 w-full mt-4">
              <button 
                onClick={() => jobData?.id && toggleSavedJob(jobData.id)}
                className="flex-1 text-on-surface-variant border border-white/10 py-3 rounded-[10px] font-bold flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-colors uppercase">
                <span className="material-symbols-outlined" style={isSaved ? { fontVariationSettings: "'FILL' 1", color: '#ffb300' } : {}}>{isSaved ? 'bookmark' : 'bookmark_border'}</span>
                {isSaved ? "Sačuvano" : "Sačuvaj"}
              </button>
              <button 
                onClick={() => setShowReportModal(true)}
                className="text-red-500 border border-white/10 py-3 px-4 rounded-[10px] font-bold flex items-center justify-center hover:bg-red-500/10 transition-colors" title="Prijavi oglas">
                <span className="material-symbols-outlined">flag</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ad/Banner Space - Smeštaj */}
        <Link to="/smestaj" className="block bg-gradient-to-br from-surface-container-high to-surface p-8 rounded-[10px] border border-secondary/20 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <h4 className="text-white font-black text-xl mb-2 uppercase">Potreban vam je smeštaj?</h4>
            <p className="text-on-surface-variant text-sm mb-4">Pronađite idealan smeštaj za vaše radnike u blizini gradilišta.</p>
            <div className="text-secondary font-black uppercase text-xs tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
              Istraži smeštaj <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
            <span className="material-symbols-outlined text-9xl">bed</span>
          </div>
        </Link>

        {/* Ad/Banner Space - Ketering */}
        <Link to="/ketering" className="block bg-gradient-to-br from-surface-container-high to-surface p-8 rounded-[10px] border border-emerald-500/20 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <h4 className="text-white font-black text-xl mb-2 uppercase">Potreban vam je ketering?</h4>
            <p className="text-on-surface-variant text-sm mb-4">Najbolji obroci i ketering usluge za vašu građevinsku ekipu.</p>
            <div className="text-emerald-500 font-black uppercase text-xs tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
              Istraži ketering <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500 text-emerald-500">
            <span className="material-symbols-outlined text-9xl">restaurant</span>
          </div>
        </Link>

        {/* Ad/Banner Space - Mehanizacija */}
        <Link to="/gradjevinske-masine" className="block bg-gradient-to-br from-surface-container-high to-surface p-8 rounded-[10px] border border-blue-500/20 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <h4 className="text-white font-black text-xl mb-2 uppercase">Potrebna vam je mehanizacija?</h4>
            <p className="text-on-surface-variant text-sm mb-4">Iznajmite ili kupite bagere, dizalice i drugu opremu direktno.</p>
            <div className="text-blue-500 font-black uppercase text-xs tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
              Istraži mehanizaciju <span className="material-symbols-outlined">arrow_forward</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500 text-blue-500">
            <span className="material-symbols-outlined text-9xl">precision_manufacturing</span>
          </div>
        </Link>

        {/* ... (Other banners like Ketering, Mehanizacija could be here too, or I can just keep them in Sidebar) */}
        
        {/* Latest Jobs */}
        <div className="bg-surface-container-high p-6 rounded-[10px] border border-outline-variant/10 shadow-sm">
          <h3 className="text-lg font-black text-white mb-4 uppercase tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">schedule</span>
            Najnoviji poslovi
          </h3>
          <div className="space-y-4">
            {displaySimilarJobs.map((job: any) => (
              <Link key={job.id} to={buildJobUrl(job)} className="block group">
                <div className="bg-surface p-4 rounded-[10px] border border-outline-variant/10 hover:border-secondary/50 transition-colors">
                  <h4 className="text-white font-bold text-sm group-hover:text-secondary transition-colors truncate">{job.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                    <span className="material-symbols-outlined text-[14px]">domain</span>
                    <span className="truncate">{job.comp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-secondary font-black text-sm">{job.sal}</span>
                    <span className="text-[10px] text-on-surface-variant uppercase">{job.time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link to="/poslovi" className="block text-center text-xs font-bold text-on-surface-variant hover:text-white uppercase tracking-widest mt-4 transition-colors">
            Prikaži sve najnovije poslove →
          </Link>
        </div>
      </div>
    </aside>
  );
}
