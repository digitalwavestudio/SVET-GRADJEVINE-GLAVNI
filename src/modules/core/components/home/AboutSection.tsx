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
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter mb-4 leading-[1.05] drop-shadow-sm">SVE ZA GRAĐEVINU <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#FFF5D6] to-secondary">NA JEDNOM MESTU</span></h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-12">Svet Građevine svakog meseca povezuje firme, radnike, dobavljače i investitore na jednoj platformi. Brže do posla, opreme, saradnika i novih projekata širom Srbije i regiona.</p>
              <div className="grid grid-cols-2 gap-y-10 gap-x-4 md:gap-x-8">
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
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <Link to="/firme" className="col-span-1 md:col-span-2 p-6 md:p-8 rounded-[16px] border border-secondary/20 bg-gradient-to-br from-secondary/5 via-slate-900 to-slate-950 relative overflow-hidden group hover:border-secondary/60 transition-all duration-500 min-h-[220px] md:min-h-[260px] flex flex-col justify-end shadow-[0_4px_20px_rgba(254,191,13,0.1)] hover:shadow-[0_0_30px_rgba(254,191,13,0.2)] hover:-translate-y-1">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50 z-0"></div>
                
                <div className="relative z-10">
                  <div className="w-12 h-1.5 bg-secondary mb-6 rounded-full shadow-[0_0_15px_rgba(254,191,13,0.5)]"></div>
                  <span className="material-symbols-outlined text-secondary mb-6 block text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <h4 className="text-2xl md:text-3xl font-black text-white uppercase mb-2 md:mb-3 tracking-tighter">Premium Firme</h4>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium mb-8">Ekskluzivni pristup najbolje ocenjenim građevinskim kompanijama u regionu.</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-12 h-12 rounded-[10px] border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs font-black text-secondary shadow-xl group-hover:translate-x-1 transition-transform duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
                          <span className="material-symbols-outlined text-sm">business</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-secondary text-[10px] font-black uppercase tracking-widest opacity-100 lg:opacity-0 group-hover:opacity-100 translate-x-0 lg:translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      Prikaži sve <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link to="/poslovi" className="p-6 md:p-8 rounded-[16px] border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-slate-900 to-slate-950 group hover:border-blue-500/60 transition-all duration-500 shadow-[0_4px_20px_rgba(59,130,246,0.1)] hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:-translate-y-1 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 z-0"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
                <div className="w-10 h-1.5 bg-blue-500 mb-6 rounded-full relative z-10 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                <span className="material-symbols-outlined text-blue-500 mb-6 block text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300">work_history</span>
                <h4 className="text-xl font-black text-white uppercase mb-2 tracking-tighter relative z-10">Najnoviji poslovi</h4>
                <div className="mt-auto flex items-center gap-2 relative z-10 pt-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black">Dnevno ažurirano</span>
                </div>
              </Link>

              <Link to="/oprema" className="p-6 md:p-8 rounded-[16px] border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-slate-900 to-slate-950 group hover:border-orange-500/60 transition-all duration-500 shadow-[0_4px_20px_rgba(249,115,22,0.1)] hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:-translate-y-1 relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50 z-0"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>
                <div className="w-10 h-1.5 bg-orange-500 mb-6 rounded-full relative z-10 shadow-[0_0_15px_rgba(249,115,22,0.5)]"></div>
                <span className="material-symbols-outlined text-orange-500 mb-6 block text-4xl relative z-10 group-hover:rotate-12 transition-transform duration-300">precision_manufacturing</span>
                <h4 className="text-xl font-black text-white uppercase mb-2 tracking-tighter relative z-10">Mehanizacija</h4>
                <div className="mt-auto relative z-10 pt-4">
                  <span className="text-slate-400 text-[9px] uppercase tracking-widest font-black">Top ponude</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
  </>);
}