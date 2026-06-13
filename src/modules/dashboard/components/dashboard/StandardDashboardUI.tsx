import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useDashboardMetrics } from '@/src/modules/dashboard/hooks/useDashboardStats';

const StandardDashboardUI = memo(function StandardDashboardUI() {
  const { data: activeMetrics } = useDashboardMetrics();
  const data = activeMetrics;
  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }}}
      className="flex flex-col gap-12"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 md:p-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8">
            <div className={`w-2 h-2 rounded-full ${!data ? 'bg-orange-400 animate-pulse' : 'bg-secondary'}`}></div>
            <span className="text-xs font-black text-white uppercase tracking-widest">
              {!data ? 'Sistemski podaci su privremeno isključeni' : 'DOBRODOŠLI NA PLATFORMU'}
            </span>
          </div>
          <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-6 leading-none tracking-[-0.05em]">KONTROLNA TABLA, <span className="text-secondary text-nowrap">VAŠ POČETAK</span></h2>
          <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-2xl mx-auto">
            VAŠA POLAZNA TAČKA ZA SVE U GRAĐEVINARSTVU. POGLEDAJTE AKTUELNE OGLASE, IZABERITE ULOGU KOJA VAM ODGOVARA ZA PUNO KORISNIČKO ISKUSTVO ILI POSTAVITE OGLAS NA PLATFORMI U SAMO 3 LAKA KORAKA.
          </p>
          
          <div className="flex flex-col items-center gap-4 w-full justify-center mt-6">
            <Link to="/postavi-oglas" className="w-full md:w-auto px-16 py-6 bg-secondary text-slate-950 font-black rounded-[10px] text-base tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-2xl">add_circle</span>
              POSTAVI OGLAS
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }}}>
        <Link 
          to="/moj-profil/izbor-uloge" 
          className="relative block w-full bg-gradient-to-br from-[#0F1621] to-[#05080C] border-2 border-secondary/30 rounded-[16px] p-12 md:p-20 overflow-hidden group transition-all duration-500 hover:border-secondary hover:shadow-[0_0_50px_rgba(254,191,13,0.15)]"
        >
          {/* Animirani i blurovani pozadinski efekti sjaja */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-secondary/15 transition-all duration-700"></div>
          <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
              {/* Velika ikona sa pulsirajućim krugovima */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-secondary/20 rounded-full scale-125 animate-ping opacity-40"></div>
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 border-2 border-secondary/35 flex items-center justify-center text-secondary shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <span className="material-symbols-outlined text-5xl md:text-6xl animate-bounce">rocket_launch</span>
                </div>
              </div>

              {/* Informacije */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/25 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.2em]">ULAZNA KAPIJA ZA MAJSTORE I FIRME</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none tracking-[-0.03em]">
                  AKTIVIRAJTE SVOJU <span className="text-secondary">PRO ULOGU</span>
                </h3>
                <p className="text-sm md:text-base font-bold text-white/50 uppercase tracking-[0.15em] max-w-2xl leading-relaxed">
                  Postanite registrovani majstor, građevinska firma ili ponuđač smeštaja i opreme. Otključajte direktan kontakt sa klijentima, napredne metrike i sve profesionalne alate na platformi.
                </p>
              </div>
            </div>

            {/* Dugme za poziv na akciju sa desne strane */}
            <div className="shrink-0 w-full lg:w-auto flex justify-center">
              <div className="w-full lg:w-auto px-12 py-6 bg-secondary text-slate-950 font-black rounded-[12px] text-sm md:text-base tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-secondary/10 group-hover:bg-yellow-400 group-hover:shadow-secondary/25 flex items-center justify-center gap-3">
                ZAPOČNI ODMAH
                <span className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:translate-x-2">arrow_forward</span>
              </div>
            </div>

          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
});

export default StandardDashboardUI;
