import React from 'react';
import AnimatedCounter from '@/src/modules/core/components/home/AnimatedCounter';

export default function AboutSection({ totalAdsCount, dynamicFirmsCount, dynamicWorkersCount, dynamicMachineryCount, dynamicRealEstateCount, dynamicViewsCount }: any) {
  return (<>
    {/* O Nama / Partneri */}
      <section className="py-12 md:py-24 bg-surface border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="text-secondary font-bold tracking-widest uppercase text-sm mb-4 block">Svet Građevine je mesto gde se posao u građevini pronalazi najbrže.</span>
              <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[3.5rem] lg:text-[4rem] font-black uppercase tracking-tighter mb-4 leading-[1.05] drop-shadow-sm">GRADIMO VEZE KOJE <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#FFF5D6] to-secondary">POKREĆU GRAĐEVINSKU INDUSTRIJU</span></h2>
              <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed">Verujemo da su uspešni projekti rezultat pravih ljudi na pravom mestu. Zato razvijamo platformu koja povezuje poslodavce sa kvalitetnim radnicima, pomaže firmama da pronađu nove klijente i omogućava profesionalcima da predstave svoje znanje i iskustvo.</p>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="group cursor-pointer hover:scale-105 transition-transform duration-300 text-center">
                <AnimatedCounter end={totalAdsCount} prefix="+" delay={0} className="text-[90px] sm:text-[140px] md:text-[160px] leading-none tracking-tighter" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant leading-tight block">Aktivnih oglasa</span>
              </div>
            </div>
          </div>
        </div>
      </section>
  </>);
}