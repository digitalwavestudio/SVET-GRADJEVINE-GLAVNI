import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedCounter from '@/src/modules/core/components/home/AnimatedCounter';

export default function AboutSection({ totalAdsCount, dynamicFirmsCount, dynamicWorkersCount, dynamicMachineryCount, dynamicRealEstateCount, dynamicViewsCount }: any) {
  return (<>
    {/* O Nama / Partneri */}
      <section className="py-12 md:py-24 bg-surface border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-secondary font-bold tracking-widest uppercase text-sm mb-4 block">Svet Građevine je mesto gde se posao u građevini pronalazi najbrže.</span>
              <h2 className="font-headline text-4xl md:text-5xl font-black mb-8 leading-tight uppercase">SVE ZA GRAĐEVINU <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#FFF5D6] to-secondary">NA JEDNOM MESTU</span></h2>
              <p className="text-on-surface-variant mb-12 text-lg">Svet Građevine svakog meseca povezuje firme, radnike, dobavljače i investitore na jednoj platformi. Brže do posla, opreme, saradnika i novih projekata širom Srbije i regiona.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-4 md:gap-x-8">
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={totalAdsCount} suffix="+" delay={0} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Aktivnih<br />Oglasa</span>
                </div>
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={dynamicFirmsCount} suffix="+" delay={200} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Registrovanih<br />Firmi</span>
                </div>
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={dynamicWorkersCount} suffix="+" delay={400} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Baza<br />Radnika</span>
                </div>
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={dynamicMachineryCount} suffix="+" delay={600} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Mašina i<br />Opreme</span>
                </div>
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={dynamicRealEstateCount} suffix="+" delay={800} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Smeštaj i<br />Placevi</span>
                </div>
                <div className="group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                  <AnimatedCounter end={dynamicViewsCount} suffix="+" delay={1000} />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Pregleda<br />Oglasa</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Link to="/firme" className="col-span-1 md:col-span-2 glass-card p-8 rounded-[10px] border border-white/10 relative overflow-hidden group hover:border-secondary transition-all duration-500 min-h-[260px] flex flex-col justify-end shadow-sm">
                <div className="absolute top-0 right-0 p-8">
                  <span className="material-symbols-outlined text-secondary text-5xl opacity-10 group-hover:opacity-100 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-1.5 bg-secondary mb-6 rounded-full shadow-[0_0_15px_rgba(254,191,13,0.5)]"></div>
                  <h4 className="text-3xl font-black text-white uppercase mb-3 tracking-tighter">Premium Firme</h4>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium mb-8">Ekskluzivni pristup najbolje ocenjenim građevinskim kompanijama u regionu.</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-12 h-12 rounded-[10px] border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-black text-secondary shadow-xl group-hover:translate-x-1 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
                          <span className="material-symbols-outlined text-sm">business</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-secondary text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      Prikaži sve <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/poslovi" className="glass-card p-8 rounded-[10px] border border-white/10 group hover:border-blue-500 transition-all duration-500 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="w-10 h-1.5 bg-blue-500 mb-6 rounded-full relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <span className="material-symbols-outlined text-blue-500 mb-6 block text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300">work_history</span>
                <h4 className="text-xl font-black text-white uppercase mb-2 tracking-tighter relative z-10">Najnoviji poslovi</h4>
                <div className="mt-auto flex items-center gap-2 relative z-10">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-slate-500 text-[9px] uppercase tracking-widest font-black">Dnevno ažurirano</span>
                </div>
              </Link>

              <Link to="/oprema" className="glass-card p-8 rounded-[10px] border border-white/10 group hover:border-secondary transition-all duration-500 shadow-sm relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl group-hover:bg-secondary/10 transition-colors"></div>
                <div className="w-10 h-1.5 bg-secondary mb-6 rounded-full relative z-10 shadow-[0_0_15px_rgba(254,191,13,0.5)]"></div>
                <span className="material-symbols-outlined text-secondary mb-6 block text-4xl relative z-10 group-hover:rotate-12 transition-transform duration-300">precision_manufacturing</span>
                <h4 className="text-xl font-black text-white uppercase mb-2 tracking-tighter relative z-10">Mehanizacija</h4>
                <div className="mt-auto relative z-10">
                  <span className="text-slate-500 text-[9px] uppercase tracking-widest font-black">Top ponude</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
  </>);
}