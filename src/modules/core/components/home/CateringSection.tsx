import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { UI_TOKENS } from '@/src/lib/uiTokens';

export default function CateringSection({ latestAccommodations = [], latestCaterings = [] }: any) {
  const navigate = useNavigate();
  return (<>
      {/* Smeštaj Radnika */}
      <section className="py-12 md:py-24 bg-surface-container">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#9fcaff] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[9px] min-[360px]:text-[10px] md:text-xs block">Odmor i Stanovanje</span>
                <span className="material-symbols-outlined text-[#9fcaff] text-xl md:text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>hotel</span>
              </div>
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#9fcaff_0%,#ffffff_60%)] mb-4 leading-[1.05] drop-shadow-sm">SMEŠTAJ RADNIKA</h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-2">Obezbedite kvalitetan smeštaj i odmor vašim timovima blizu gradilišta.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
            <Link className="text-secondary font-bold flex items-center gap-2 pt-2 hover:scale-110 transition-transform duration-300 origin-left md:origin-right shrink-0" to="/smestaj">
              Pogledaj sve <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="relative w-full">
            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4 md:grid md:grid-cols-3 md:gap-8 scroll-smooth w-full">
              {latestAccommodations.length > 0 ? latestAccommodations.map((acc: any, idx: number) => (
               <div key={acc.id || idx}
                 className="bg-surface rounded-[10px] border border-outline-variant/10 overflow-hidden group hover:-translate-y-6 transition-all duration-500 cursor-pointer shrink-0 w-full md:w-auto"
                 onClick={() => navigate(`/smestaj/${acc.id}`)}
               >
                 <div className="h-64 relative">
                   <OptimizedImage src={acc.images?.[0] || ""} fallbackType="accommodation" alt={acc.title} className="w-full h-full object-cover" />
                     
                   <div className="absolute bottom-4 left-4 bg-on-background/90 backdrop-blur px-3 py-1 rounded-[10px] text-secondary text-sm font-bold uppercase line-clamp-1">{typeof acc.location === 'object' ? acc.location.address : acc.location}</div>
                 </div>
                 <div className="p-5 sm:p-8">
                   <h3 className="text-xl font-bold mb-4 uppercase line-clamp-1">{acc.title}</h3>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                     {acc.capacity && (
                     <div className="flex items-center gap-2 text-on-surface-variant">
                       <span className="material-symbols-outlined text-secondary">group</span>
                       <span className="text-sm line-clamp-1">Do {acc.capacity} osoba</span>
                     </div>
                     )}
                     {acc.rooms && (
                     <div className="flex items-center gap-2 text-on-surface-variant">
                       <span className="material-symbols-outlined text-secondary">bed</span>
                       <span className="text-sm line-clamp-1">{acc.rooms} soba</span>
                     </div>
                     )}
                     {acc.bathrooms && (
                     <div className="flex items-center gap-2 text-on-surface-variant">
                       <span className="material-symbols-outlined text-secondary">shower</span>
                       <span className="text-sm line-clamp-1">{acc.bathrooms} kupatila</span>
                     </div>
                     )}
                     <div className="flex items-center gap-2 text-on-surface-variant">
                       <span className="material-symbols-outlined text-secondary">kitchen</span>
                       <span className="text-sm line-clamp-1">{acc.hasKitchen ? 'Ima kuhinju' : 'Dodatne opcije'}</span>
                     </div>
                   </div>
                   <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                     <div>
                       <span className="text-xs text-on-surface-variant block uppercase">Cena</span>
                       <span className="text-xl font-black">{acc.price ? `€${acc.price} / noć` : 'Po upitu'}</span>
                     </div>
                     <button className="bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] !text-black px-6 py-2 rounded-[10px] font-bold uppercase hover:from-[#fb8c00] hover:to-[#ffeb3b] hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300">Detalji</button>
                   </div>
                 </div>
               </div>
            )) : (
              <div className="col-span-1 md:col-span-3 bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>hotel</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema objavljenog smeštaja</h3>
                <p className="text-on-surface-variant text-base">Oglasa za smeštaj radnika trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
              </div>
            )}
            </div>
          </div>
          <Link 
            to="/postavi-oglas"
            className="w-full mt-8 bg-secondary !text-black font-black px-6 md:px-10 py-4 md:py-6 rounded-[10px] hover:bg-yellow-400 transition-all uppercase tracking-wider md:tracking-widest text-sm md:text-lg flex items-center justify-center shadow-gold-glow-subtle"
          >
            POSTAVI OGLAS ZA SMEŠTAJ
          </Link>
        </div>
      </section>

    {/* Ketering za Gradilišta */}
      <section className="py-12 md:py-24 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[#2dd4bf] font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[9px] min-[360px]:text-[10px] md:text-xs block">Ishrana na Terenu</span>
                <span className="material-symbols-outlined text-[#2dd4bf] text-xl md:text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>restaurant</span>
              </div>
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#2dd4bf_0%,#ffffff_60%)] mb-4 leading-[1.05] drop-shadow-sm">KETERING ZA GRADILIŠTA</h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-2">Topli obroci i redovna ishrana obezbeđeni direktno na radnom mestu.</p>
              <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
            </div>
            <Link className="text-secondary font-bold flex items-center gap-2 pt-2 hover:scale-110 transition-transform duration-300 origin-left md:origin-right shrink-0" to="/ketering">
              Pogledaj sve <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="relative w-full">
            <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4 md:grid md:grid-cols-3 md:gap-8 scroll-smooth w-full">
              {latestCaterings.length > 0 ? latestCaterings.map((cat: any, idx: number) => (
            <div key={cat.id || idx}
              className="bg-surface-container-low rounded-[10px] border border-white/5 overflow-hidden group hover:border-secondary/30 transition-all duration-500 cursor-pointer shadow-2xl relative shrink-0 w-full md:w-auto"
              onClick={() => navigate(`/ketering/provajder/${cat.id}`)}
            >
              <div className="absolute inset-0 blueprint-bg opacity-20 pointer-events-none"></div>
              
              <div className="h-56 relative overflow-hidden">
                <OptimizedImage
                  src={cat.images?.[0] || ""}
                  placeholder={cat.imagePlaceholders?.[0]}
                  fallbackType="catering"
                  alt={cat.title || cat.companyName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                  
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
                
                <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur-md px-3 py-1.5 rounded-[10px] border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Prima narudžbine</span>
                </div>
              </div>

              <div className="p-5 sm:p-8 pt-0 relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="pt-6">
                    <div className="flex items-center gap-2 text-secondary mb-2">
                       <span className="material-symbols-outlined text-sm">location_on</span>
                       <span className="text-xs font-bold uppercase tracking-widest line-clamp-1">{typeof cat.location === 'object' ? cat.location.address : cat.location}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight group-hover:text-secondary transition-colors line-clamp-2">{cat.title || cat.companyName}</h3>
                  </div>
                  
                  <div className="bg-gradient-to-br from-secondary to-orange-500 !text-black px-4 py-3 rounded-[10px] -mt-8 relative shadow-xl shadow-orange-500/20 border-4 border-surface-container-low flex flex-col items-center group-hover:-translate-y-2 transition-transform duration-300 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">Od</span>
                    <span className="text-xl font-black leading-none">{cat.price || cat.mealPrice || '---'}</span>
                    <span className="text-[10px] font-bold mt-0.5">RSD</span>
                  </div>
                </div>

                <div className="relative w-full overflow-hidden mb-8 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                  <div className="flex gap-6 animate-[scroll_40s_linear_infinite] hover:[animation-play-state:paused] w-max">
                    {[1, 2].map((set) => (
                      <React.Fragment key={set}>
                        <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-3 group-hover:border-secondary/50 transition-colors shrink-0">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Dostava</span>
                          <span className="text-sm text-white font-medium">{cat.deliveryRadius ? `Do ${cat.deliveryRadius}km` : 'Na upit'}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-3 group-hover:border-secondary/50 transition-colors shrink-0">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Minimum</span>
                          <span className="text-sm text-white font-medium">{cat.minOrderValue || 'Nema minimuma'}</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l-2 border-white/10 pl-3 group-hover:border-secondary/50 transition-colors shrink-0">
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Kapacitet</span>
                          <span className="text-sm text-white font-medium">{cat.maxMealsPerDay ? `${cat.maxMealsPerDay} obroka` : 'Veliki kapacitet'}</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-[10px] border border-white/5">
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Profesionalni Ketering</span>
                  </div>
                  <div className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center group-hover:bg-secondary group-hover:!text-black transition-colors border border-white/10">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </div>
                </div>
              </div>
            </div>
            )) : (
              <div className="col-span-1 md:col-span-3 bg-surface-container-low p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>restaurant</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema objavljenog keteringa</h3>
                <p className="text-on-surface-variant text-base">Oglasa za ketering trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
              </div>
            )}
            </div>
          </div>
          <Link 
            to="/postavi-oglas"
            className="w-full mt-8 bg-secondary !text-black font-black px-6 md:px-10 py-4 md:py-6 rounded-[10px] hover:bg-yellow-400 transition-all uppercase tracking-wider md:tracking-widest text-sm md:text-lg flex items-center justify-center shadow-gold-glow-subtle"
          >
            POSTAVI OGLAS ZA KETERING
          </Link>
        </div>
      </section>
  </>);
}