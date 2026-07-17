import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildJobUrl } from '@/src/lib/seo';

const typeLabels: Record<string, string> = {
  job: 'POSLOVI',
  machine: 'MAŠINE',
  accommodation: 'SMEŠTAJ',
  catering: 'KETERING',
  plot: 'ZEMLJIŠTE',
  company: 'FIRMA',
};

// Universal helper to build the target URL depending on 'type'
const buildAdUrl = (ad: any) => {
  if (ad.type === 'job' || !ad.type) return buildJobUrl(ad);
  if (ad.type === 'machine') return `/gradjevinske-masine/${ad.id}`;
  if (ad.type === 'accommodation') return `/smestaj/${ad.id}`;
  if (ad.type === 'catering') return `/ketering/provajder/${ad.id}`;
  if (ad.type === 'plot') return `/placevi/${ad.id}`;
  if (ad.type === 'company') return `/firma/${ad.authorId || ad.id}`;
  if (ad.type === 'marketplace' || ad.type === 'material' || ad.type === 'tool') return `/alat-i-oprema/${ad.id}`;
  return `/oglas/${ad.id}`;
};

export default function UrgentJobs({ urgentJobs, handleCardClick, isLoading }: any) {
  const navigate = useNavigate();

  const parseDate = (val: any) => {
    if (!val) return null;
    if (typeof val === 'object' && val !== null && typeof val.toDate === 'function') return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  return (<>
    {/* Hitni Oglasi */}
      <section className="py-12 md:py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex justify-between items-start mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#ff512f] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[9px] min-[360px]:text-[10px] md:text-xs block">Premium Prioritet</span>
                <span className="material-symbols-outlined text-[#ff512f] text-xl md:text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
              </div>
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-7xl font-[1000] md:font-[950] uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#ff512f_0%,#ffffff_60%)] mb-4 leading-tight">HITNI<br className="md:hidden" /> OGLASI</h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-xl font-medium leading-relaxed">Ponude i poslovi koji zahtevaju najbržu reakciju na tržištu.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Skeletons during loading
              [...Array(12)].map((_, i) => (
                <div key={i} className="bg-surface-container-lowest p-6 rounded-[10px] border border-white/5 opacity-40">
                  <div className="w-20 h-4 bg-white/10 rounded mb-4"></div>
                  <div className="w-full h-6 bg-white/10 rounded mb-2"></div>
                  <div className="w-2/3 h-4 bg-white/10 rounded mb-6"></div>
                  <div className="pt-4 border-t border-white/5 flex gap-3 items-center">
                    <div className="w-10 h-10 bg-white/5 rounded-[10px]"></div>
                    <div className="w-24 h-4 bg-white/5 rounded"></div>
                  </div>
                </div>
              ))
            ) : urgentJobs && urgentJobs.length > 0 ? (
              urgentJobs.slice(0, 12).map((ad: any) => {
                const url = buildAdUrl(ad);
                const createdDate = parseDate(ad.createdAt);
                const isNovo = createdDate && (new Date().getTime() - createdDate.getTime() < 48 * 60 * 60 * 1000);
                return (
                  <div 
                    key={ad.id}
                    className="group relative flex flex-col shrink-0 h-full rounded-[16px] transition-all duration-500 overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-500/5 via-slate-900 to-slate-950 shadow-[0_4px_20px_rgba(239,68,68,0.05)] hover:border-red-500/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:-translate-y-1"
                  >
                    <Link 
                      to={url} 
                      onClick={(e) => {
                         if (ad.type === 'job' || !ad.type) {
                           e.preventDefault();
                           if (typeof handleCardClick === 'function') handleCardClick(url, { job: ad });
                         }
                      }}
                      className="absolute inset-0 z-10 rounded-[16px]"
                      aria-label={`Pogledaj oglas ${ad.title}`}
                    />
                    
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 z-0"></div>
                    
                    <div className="p-5 flex flex-col w-full h-full relative z-20 pointer-events-none">
                      <div className="flex justify-between items-start mb-0">
                        <div className="flex flex-col gap-0">
                          <div className="flex items-center gap-1.5">
                            <span className="backdrop-blur-sm bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 shadow-[0_0_14px_rgba(239,68,68,0.25)] w-max">
                              <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
                            </span>
                            {isNovo && (
                              <span className="bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] shadow-md">NOVO</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="w-[56px] h-[56px] min-w-[56px] max-w-[56px] md:w-[64px] md:h-[64px] md:min-w-[64px] md:max-w-[64px] bg-white rounded-full p-1.5 shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm relative z-10 flex items-center justify-center overflow-hidden">
                          {ad.logo ? (
                            <img width="800" height="600" decoding="async" loading="lazy" src={ad.logo} className="w-full h-full object-contain rounded-full" alt={`Logo firme ${ad.authorSnapshot?.companyName || ad.authorSnapshot?.displayName || ad.comp || ''}`} referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-xs">{(ad.authorSnapshot?.companyName?.charAt(0) || ad.authorSnapshot?.displayName?.charAt(0) || ad.comp?.charAt(0) || 'S')}</span>
                          )}
                        </div>
                      </div>

                        <h3 className="text-xl md:text-2xl font-black text-white group-hover/card:text-red-400 transition-colors duration-300 -mt-4 mb-1 uppercase break-words tracking-tight leading-tight">
                          {(() => {
                            const t = ad.title?.replace(' — ', ' ') || 'Hitno';
                            const i = t.lastIndexOf(' ');
                            if (i === -1) return t;
                            return <>{t.slice(0, i)}<br />{t.slice(i + 1)}</>;
                          })()}
                        </h3>
                      <div className="mb-4 relative z-20">
                        <div className="flex items-center gap-1">
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDE68A] via-[#D4AF37] to-[#B45309] text-xs md:text-xs font-black uppercase tracking-widest">
                            {ad.authorSnapshot?.companyName || ad.authorSnapshot?.displayName || ad.comp || 'Svet Građevine'}
                          </span>
                          {ad.isCompanyVerified && (
                            <span className="material-symbols-outlined text-green-500 text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const b = ad.benefits || ad.benefiti || [];
                        const hasSmestaj = b.includes('smestaj');
                        const hasPrevoz = b.includes('prevoz');
                        const hasHrana = b.includes('topli-obrok') || b.includes('hrana');
                        if (!hasSmestaj && !hasPrevoz && !hasHrana) return null;
                        return (
                          <div className="flex flex-col gap-1.5 mb-3 relative z-10">
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
                        );
                      })()}

                      <div className="pt-4 border-t border-white/5 relative z-10 flex items-end justify-between md:pointer-events-auto pointer-events-none">
                        <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[12px] text-blue-400">visibility</span> {ad.viewsCount || 0}
                        </span>
                        {(ad.plataMin != null || ad.plataMax != null) ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Satnica</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-[#FFF5D6] font-black text-2xl md:text-[28px] font-sans leading-none tracking-tight">
                              {ad.plataMin ? `${ad.plataMin}${ad.plataMax != null ? ` – ${ad.plataMax}` : ''}` : ad.plataMax} €
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Po dogovoru</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              // Empty State
              <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>campaign</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema hitno istaknutih oglasa</h3>
                <p className="text-on-surface-variant text-base">Hitnih oglasa trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
              </div>
            )}
          </div>
        </div>
      </section>
  </>);
}