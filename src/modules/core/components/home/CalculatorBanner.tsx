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
              <Calculator className="text-slate-950 w-12 h-12" />
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-tight">
                AI<span className="text-secondary"> Građevinski</span><br className="hidden md:block lg:hidden" /> Kalkulator
              </h3>
              <p className="text-base font-medium text-slate-400 max-w-2xl leading-relaxed">
                Zidar, fasader ili keramičar? Izračunaj tačnu specifikaciju materijala i vremena u sekundi. Preciznost koja štedi novac i vreme.
              </p>
            </div>
            
            {/* Action */}
            <div className="w-full md:w-auto shrink-0 flex items-center justify-between md:justify-center gap-4 bg-white/5 hover:bg-secondary pl-6 md:pl-8 pr-4 md:pr-6 py-4 rounded-[10px] border border-white/10 text-white hover:text-slate-950 font-black uppercase tracking-widest text-sm transition-all duration-500 group-hover:scale-105">
              Isprobaj odmah 
              <div className="bg-white/10 p-2 rounded-[10px] group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
