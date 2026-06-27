import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { JobCard } from '@/src/modules/jobs/components/JobCard';

export default function JobsSection({ latestJobs = [] }: any) {
  const prefetch = useCallback((_type: string, _id?: string) => {}, []);

  return (
    <section className="py-12 md:py-24 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-500 font-black tracking-[0.2em] md:tracking-[0.3em] uppercase text-[9px] min-[360px]:text-[10px] md:text-xs block">Poslovi U Građevini</span>
              <span className="material-symbols-outlined text-blue-500 text-xl md:text-2xl -mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>work_history</span>
            </div>
            <h2 className="font-headline text-4xl min-[360px]:text-5xl md:text-[4rem] lg:text-[4.5rem] font-black uppercase tracking-tighter text-transparent bg-clip-text bg-[linear-gradient(110deg,#3b82f6_0%,#ffffff_60%)] mb-4 leading-[1.05] drop-shadow-sm">NAJNOVIJI POSLOVI</h2>
            <p className="text-on-surface-variant text-base sm:text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-2">Pogledajte sveže oglase za posao u građevinskoj industriji.</p>
            <div className="w-24 h-1.5 bg-secondary mt-6 rounded-full"></div>
          </div>
          <Link className="text-secondary font-bold flex items-center gap-2 pt-2 hover:scale-110 transition-transform duration-300 origin-left md:origin-right shrink-0" to="/poslovi">
            Pogledaj sve <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        {latestJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {latestJobs.map((job: any, idx: number) => (
              <div key={job.id || idx}>
                <JobCard job={job} viewMode="list" prefetch={prefetch} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px]">
            <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>work_history</span>
            <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema poslova</h3>
            <p className="text-on-surface-variant text-base">Oglasa za posao trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
          </div>
        )}

        <Link
          to="/postavi-oglas"
          className="w-full mt-8 bg-secondary !text-black font-black px-6 md:px-10 py-4 md:py-6 rounded-[10px] hover:bg-yellow-400 transition-all uppercase tracking-wider md:tracking-widest text-sm md:text-lg flex items-center justify-center shadow-gold-glow-subtle"
        >
          POSTAVI OGLAS ZA POSAO
        </Link>
      </div>
    </section>
  );
}
