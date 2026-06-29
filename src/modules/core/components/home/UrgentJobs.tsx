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
              <p className="text-on-surface-variant text-lg max-w-xl">Ponude i poslovi koji zahtevaju najbržu reakciju na tržištu.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.1)] w-max">
                            <span className="material-symbols-outlined text-[10px]">local_fire_department</span> Hitno
                          </span>
                          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{ad.time || 'Danas'}</span>
                        </div>
                        
                        <div className="w-[48px] h-[48px] min-w-[48px] max-w-[48px] bg-white rounded-full p-1 shrink-0 group-hover:scale-105 transition-transform duration-500 shadow-sm relative z-10 flex items-center justify-center overflow-hidden">
                          {ad.logo ? (
                            <img width="800" height="600" decoding="async" loading="lazy" src={ad.logo} className="w-full h-full object-contain rounded-full" alt={`Logo firme ${ad.comp}`} referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-800 font-black text-xs">{(ad.comp?.charAt(0) || 'S')}</span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-black text-lg md:text-xl text-white mb-1 uppercase line-clamp-2 tracking-tight group-hover:text-red-400 transition-colors duration-300">
                        {ad.title}
                      </h3>
                      
                      <div className="mb-4 relative z-20">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-200 to-white text-[10px] md:text-xs font-black uppercase tracking-widest">
                          {ad.comp || 'Svet Građevine'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 mb-4 mt-auto">
                        <span className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[12px] text-red-400">location_on</span> {ad.loc}
                        </span>
                        {ad.salary && (
                          <span className="flex items-center gap-1.5 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[12px] text-secondary">payments</span> {ad.salary}
                          </span>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 relative z-10 flex items-center justify-center pointer-events-auto">
                        <div className="w-full justify-center bg-white/5 group-hover:bg-white/10 text-white border border-white/10 font-black px-4 py-2.5 rounded-[10px] transition-all text-[10px] uppercase tracking-widest flex items-center gap-2 relative z-20 shadow-sm">
                           POGLEDAJ OGLAS
                           <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </div>
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