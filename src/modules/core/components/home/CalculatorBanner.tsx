import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ArrowRight } from 'lucide-react';

export default function CalculatorBanner() {
  return (
    <section className="py-8 md:py-16 bg-surface-container-low">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-950 border border-white/10 rounded-[10px] py-8 md:py-16 px-6 md:px-12 shadow-sm">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

          <Link to="/kalkulatori" className="relative z-10 flex flex-col lg:flex-row items-center gap-8 md:gap-12 group">
            {/* Icon Box */}
            <div className="w-24 h-24 rounded-[10px] bg-gradient-to-br from-secondary to-orange-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:-rotate-6 transition-transform duration-500">
              <Calculator className="!text-black w-12 h-12" />
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-headline text-3xl sm:text-4xl md:text-5xl font-[1000] md:font-[950] text-white mb-4 tracking-tighter uppercase leading-tight drop-shadow-sm">
                <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#febf0d_0%,#ffffff_60%)]">Građevinski</span> Kalkulator
              </h3>
              <p className="text-white/50 text-sm md:text-base mb-8 leading-relaxed font-medium max-w-2xl uppercase">
                ZIDAR, FASADER ILI KERAMIČAR? IZRAČUNAJ TAČNU SPECIFIKACIJU MATERIJALA I VREMENA U SEKUNDI. PRECIZNOST KOJA ŠTEDI NOVAC I VREME.
              </p>
            </div>
            
            {/* Action */}
            <div className="w-max mx-auto lg:mx-0 shrink-0 flex items-center justify-center gap-3 bg-white/5 hover:bg-secondary px-4 md:px-8 py-3 md:py-4 rounded-[10px] border border-white/10 text-white hover:!text-black font-black uppercase tracking-widest text-xs md:text-sm transition-all duration-500 group-hover:scale-105">
              Izračunaj
              <div className="bg-white/10 p-1.5 md:p-2 rounded-[10px] group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
