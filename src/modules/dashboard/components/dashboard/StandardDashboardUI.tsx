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
          <p className="text-white/40 text-sm md:text-base font-bold uppercase tracking-widest mb-8 leading-relaxed">
            VAŠA CENTRALNA TAČKA ZA SVE U GRAĐEVINARSTVU. POGLEDAJTE AKTUELNE OGLASE ILI POSTAVITE SVOJ OGLAS VEĆ DANAS.
          </p>
          
          <div className="flex justify-center gap-8 mb-12 flex-wrap">
             <div className="text-center rounded-[10px] p-4 bg-white/[0.02] border border-white/5 min-w-[120px]">
                <div className="text-3xl font-black text-white">
                  {activeMetrics?.jobsCount !== undefined ? activeMetrics.jobsCount : 'N/A'}
                </div>
                <div className="text-[10px] font-black text-white/40 tracking-widest uppercase mt-2">AKTIVNIH OGLASA</div>
             </div>
             <div className="text-center rounded-[10px] p-4 bg-white/[0.02] border border-white/5 min-w-[120px]">
                <div className="text-3xl font-black text-secondary">
                  {activeMetrics?.companiesCount !== undefined ? activeMetrics.companiesCount : 'N/A'}
                </div>
                <div className="text-[10px] font-black text-white/40 tracking-widest uppercase mt-2">KOMPANIJA</div>
             </div>
             <div className="text-center rounded-[10px] p-4 bg-white/[0.02] border border-white/5 min-w-[120px]">
                <div className="text-3xl font-black text-blue-400">
                  {activeMetrics?.machinesCount !== undefined ? activeMetrics.machinesCount : 'N/A'}
                </div>
                <div className="text-[10px] font-black text-white/40 tracking-widest uppercase mt-2">MAŠINA I OPREME</div>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 w-full justify-center">
            <Link to="/postavi-oglas" className="w-full md:w-auto px-10 py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20 flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              POSTAVI OGLAS
            </Link>
            <Link to="/poslovi" className="w-full md:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-[10px] text-sm tracking-[0.2em] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-xl">explore</span>
              POGLEDAJ SVE OGLASE
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/moj-profil/izbor-uloge" className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 hover:border-secondary/30 transition-all group flex items-center gap-8">
          <div className="w-20 h-20 rounded-[10px] bg-secondary/10 flex items-center justify-center text-secondary group-hover:rotate-12 transition-all">
            <span className="material-symbols-outlined text-4xl">rocket_launch</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">PROMENI STATUS / ULOGU</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Postani majstor, firma ili ponuđač usluga</p>
          </div>
        </Link>
        <Link to="/podesavanja" className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 hover:border-white/20 transition-all group flex items-center gap-8 text-white">
          <div className="w-20 h-20 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 group-hover:rotate-12 transition-all">
            <span className="material-symbols-outlined text-4xl">person_edit</span>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">DOPUNI SVOJ PROFIL</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Tvoj profil se vidi u pretrazi radnika</p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
});

export default StandardDashboardUI;
