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
                <span className="text-[#ff512f] font-black tracking-[0.2em] uppercase text-sm block">Premium Prioritet</span>
                <span className="material-symbols-outlined text-[#ff512f] text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>local_fire_department</span>
              </div>
              <h2 className="font-headline text-4xl md:text-6xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#ff512f_0%,#ffffff_60%)] mb-4">HITNI OGLASI</h2>
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
                    className="relative bg-surface-container-lowest p-6 rounded-[10px] border border-error/20 hover:border-error/50 hover:shadow-[0_0_30px_rgba(239,68,68,0.12)] transition-all duration-500 group flex flex-col h-full"
                  >
                    <Link 
                      to={url} 
                      onClick={() => {
                         if (ad.type === 'job' || !ad.type) {
                           if (typeof handleCardClick === 'function') handleCardClick(url, { job: ad });
                         }
                      }}
                      className="absolute inset-0 z-10 rounded-[10px]"
                      aria-label={`Pogledaj oglas ${ad.title}`}
                    />
                    <div className="flex justify-between items-start mb-4 relative z-20 pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="bg-error text-white text-[10px] font-black px-3 py-1 rounded-[10px] uppercase tracking-tighter animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]">HITNO</span>
                        <span className="bg-white/10 text-white/90 border border-white/20 text-[10px] font-black px-3 py-1 rounded-[10px] uppercase tracking-tighter">{typeLabels[ad.type] || 'OGLAS'}</span>
                      </div>
                      <span className="text-on-surface-variant text-sm whitespace-nowrap ml-2">{ad.time || 'Danas'}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2 relative z-20 pointer-events-none">{ad.title}</h3>
                    <p className="text-on-surface-variant text-sm mb-6 flex-grow relative z-20 pointer-events-none">
                      Lokacija: {ad.loc}
                      {ad.salary && <><br />Cena/Plata: {ad.salary}</>}
                    </p>
                    <div className="flex items-center gap-3 pt-4 border-t border-outline-variant/10 mt-auto relative z-20">
                      <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center font-bold text-slate-950 overflow-hidden shrink-0 shadow-lg shadow-black/10 p-1 pointer-events-none">
                        {ad.logo ? (
                          <img width="800" height="600" decoding="async" loading="lazy" src={ad.logo} className="w-full h-full object-contain aspect-square" alt={`Logo firme ${ad.comp}`} referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-black text-xs">{(ad.comp?.charAt(0) || 'S')}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0 w-full">
                        <Link 
                          to={`/firma/${ad.authorId || ad.id}`} 
                          className="text-xs font-bold uppercase hover:text-primary transition-colors line-clamp-1 relative z-20 max-w-[110px] sm:max-w-none truncate"
                        >
                          {ad.comp}
                        </Link>
                        {ad.isCompanyVerified && (
                          <div className="flex items-center gap-1.5 bg-[#0A1A0F]/90 border border-green-500/30 backdrop-blur-xl px-1.5 py-0.5 rounded-[4px] shadow-[0_0_15px_rgba(34,197,94,0.1)] shrink-0">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                            <span className="text-[7.5px] font-black tracking-[0.15em] uppercase text-green-400">APR Verifikovan</span>
                          </div>
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