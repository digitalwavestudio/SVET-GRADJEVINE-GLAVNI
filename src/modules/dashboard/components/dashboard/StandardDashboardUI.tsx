import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { calculateProfileScore } from '@/src/modules/dashboard/utils/profileCompletion';
import ProfileHealth from '@/src/modules/dashboard/components/ProfileHealth';
import DashboardGuard from './DashboardGuard';

const StandardDashboardUI = memo(function StandardDashboardUI() {
  const { user } = useAuth();
  const profileScore = calculateProfileScore(user);

  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }}}
      className="flex flex-col gap-12"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="bg-[#0A0F14] border border-white/5 rounded-[10px] px-5 py-10 md:px-16 md:py-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto">
          <div className="hidden md:inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-xs font-black text-white uppercase tracking-widest">
              DOBRODOŠLI NA PLATFORMU
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-7xl font-black text-white uppercase tracking-tighter mb-10 md:mb-6 leading-[1.15] tracking-[-0.05em]">KONTROLNA TABLA,<br /><span className="text-secondary">VAŠ POČETAK</span></h2>
          <p className="hidden md:block text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-8 leading-relaxed max-w-2xl mx-auto">
            Ovo je početna stranica vašeg naloga, odakle možete napraviti prve korake i upoznati sve mogućnosti platforme.
          </p>
          
          <Link 
            to="/moj-profil/izbor-uloge" 
            className="relative block w-full bg-gradient-to-br from-[#0F1621] to-[#05080C] border-2 border-secondary/30 rounded-[16px] p-6 md:p-12 overflow-hidden group transition-all duration-500 hover:border-secondary hover:shadow-[0_0_50px_rgba(254,191,13,0.15)]"
          >
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-secondary/15 transition-all duration-700"></div>
            <div className="absolute -right-20 -bottom-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8 text-center md:flex-row md:items-center md:text-left md:justify-between">
              <div className="flex flex-col items-center gap-5 md:gap-6 md:flex-row">
                <div className="hidden md:flex relative shrink-0 items-center justify-center">
                  <div className="absolute inset-0 bg-secondary/20 rounded-full scale-125 animate-ping opacity-40"></div>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 border-2 border-secondary/35 flex items-center justify-center text-secondary shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <span className="material-symbols-outlined text-3xl animate-bounce">rocket_launch</span>
                  </div>
                </div>
                <div className="md:hidden shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-5xl text-secondary animate-bounce">rocket_launch</span>
                </div>
                <div className="space-y-3 md:space-y-2">
                  <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/25 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">JEDAN PROFIL. BEZBROJ MOGUĆNOSTI.</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-[1.1]">
                    NAPRAVITE SVOJ <span className="text-secondary">PROFIL</span>
                  </h3>
                  <p className="text-sm sm:text-base md:text-sm font-black text-white/50 uppercase tracking-wider leading-relaxed max-w-xl">
                    Kreirajte profil za sebe ili svoju firmu i povežite se sa građevinskom zajednicom i iskoristite sve mogućnosti koje platforma nudi.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-auto flex justify-center">
                <div className="w-full md:w-auto px-10 py-3 md:py-5 bg-gradient-to-br from-[#ffd54f] to-[#f57c00] hover:from-[#f57c00] hover:to-[#ffd54f] !text-black font-black rounded-[12px] text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-xl shadow-[#ffeb3b]/20 hover:shadow-[#f57c00]/30 flex items-center justify-center gap-2">
                  NAPRAVI PROFIL
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-2">arrow_forward</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>

      <div className="hidden md:block">
        <DashboardGuard variant="inline" title="Greška u zdravlju profila">
          <ProfileHealth score={profileScore} hideButton={false} />
        </DashboardGuard>
      </div>
    </motion.div>
  );
});

export default StandardDashboardUI;
