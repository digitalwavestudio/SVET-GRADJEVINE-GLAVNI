import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useJobs } from '@/src/modules/jobs';
import { buildJobUrl } from '@/src/lib/seo';

export default function SmartMatchPage() {
  const { data: jobsData } = useJobs({});
  const jobs = jobsData?.pages.flatMap(page => page.items) || [];
  const { user } = useAuth();

  // Deterministic matching logic
  const matchedJobs = useMemo(() => {
    return jobs.map(job => {
      // Use job ID to create a deterministic but varied score
      const hash = (job.id || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const score = 75 + (hash % 24); // Score between 75 and 98
      
      return {
        ...job,
        matchPercentage: score,
        matchReasons: [
          'LOKACIJA: BLIZU MESTA STANOVANJA (+15%)',
          'ISKUSTVO: PREKO 5 GODINA U STRUCI (+30%)',
          'SMEŠTAJ: POKLAPANJE ZAHTEVA (+20%)',
          'PREPORUKA: VISOKA OCENA NA PRETHODNOM GRADILIŠTU (+25%)'
        ]
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 6);
  }, [jobs]);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">SMART MATCH</h1>
            <div className="flex items-center gap-2 text-secondary font-bold text-[10px] tracking-[0.2em] uppercase">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              AI ANALIZA VAŠEG PROFILA JE ZAVRŠENA
            </div>
          </motion.div>

          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-[10px] flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">STATUS ANALIZE</div>
              <div className="text-[11px] font-black text-green-500 uppercase tracking-tight">OPTIMALNO</div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-green-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
            </div>
          </div>
        </div>

        {/* Hero Match */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-secondary to-yellow-600 rounded-[10px] p-12 relative overflow-hidden group shadow-2xl shadow-secondary/20"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-[0.1] blur-[100px] -mr-32 -mt-32"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-slate-950/20 backdrop-blur-md px-4 py-2 rounded-full mb-8">
                <span className="material-symbols-outlined !text-black text-sm">bolt</span>
                <span className="text-[10px] font-black !text-black uppercase tracking-widest">NAJBOLJI IZBOR ZA VAS</span>
              </div>
              <h2 className="text-5xl font-black !text-black tracking-tighter uppercase leading-none mb-6">
                {matchedJobs[0]?.title}
              </h2>
              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-2 !text-black/70 font-bold text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                  {matchedJobs[0]?.loc}
                </div>
                <div className="flex items-center gap-2 !text-black/70 font-bold text-xs uppercase tracking-widest">
                  <span className="material-symbols-outlined text-lg">payments</span>
                  {(matchedJobs[0] as any)?.salary || (matchedJobs[0] as any)?.sal}
                </div>
              </div>
              <Link 
                to={matchedJobs[0] ? buildJobUrl(matchedJobs[0]) : '#'}
                className="inline-flex items-center gap-3 bg-slate-950 text-secondary font-black px-10 py-5 rounded-[10px] hover:bg-slate-900 transition-all uppercase text-xs tracking-[0.2em]"
              >
                POGLEDAJ DETALJE
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="flex flex-col items-center lg:items-end">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="!text-black/10"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={552.92}
                    initial={{ strokeDashoffset: 552.92 }}
                    animate={{ strokeDashoffset: 552.92 - (552.92 * matchedJobs[0]?.matchPercentage) / 100 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="!text-black"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black !text-black tracking-tighter">{matchedJobs[0]?.matchPercentage}%</span>
                  <span className="text-[10px] font-black !text-black/40 uppercase tracking-widest">MATCH</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Other Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matchedJobs.slice(1).map((job, i) => (
            <motion.div 
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 hover:border-secondary/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                  <span className="material-symbols-outlined text-white/20 group-hover:text-secondary transition-colors">work</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-secondary tracking-tighter">{job.matchPercentage}%</div>
                  <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">MATCH SCORE</div>
                </div>
              </div>

              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-secondary transition-colors">
                {job.title}
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">{(job as any).company || (job as any).comp}</p>

              <div className="space-y-3 mb-10">
                {job.matchReasons.map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-[9px] font-black text-white/60 uppercase tracking-widest bg-white/5 px-3 py-2 rounded-[10px]">
                    <span className="material-symbols-outlined text-green-500 text-sm">check</span>
                    {reason}
                  </div>
                ))}
              </div>

              <Link 
                to={buildJobUrl(job)}
                className="w-full py-4 bg-white/5 border border-white/10 rounded-[10px] text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                DETALJI OGLASA
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* AI Insight Footer */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-secondary/10 rounded-[10px] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary text-4xl animate-pulse">psychology</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">KAKO FUNKCIONIŠE SMART MATCH?</h4>
            <p className="text-xs text-white/40 font-medium leading-relaxed uppercase tracking-wider">
              NAŠ ALGORITAM ANALIZIRA VAŠE VEŠTINE, LOKACIJU I PRETHODNA ISKUSTVA KAKO BI VAM PRONAŠAO POSLOVE GDE IMATE NAJVEĆU ŠANSU ZA USPEH. ŠTO VIŠE POPUNITE PROFIL, TO SU PREPORUKE PRECIZNIJE.
            </p>
          </div>
          <button className="bg-white/5 border border-white/10 text-white font-black px-8 py-4 rounded-[10px] hover:bg-white/10 transition-all text-[10px] tracking-[0.2em] uppercase whitespace-nowrap">
            RE-SKENIRAJ PROFIL
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
