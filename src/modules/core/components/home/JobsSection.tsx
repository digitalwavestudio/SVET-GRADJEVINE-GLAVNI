import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const getFriendlySalary = (job: any) => {
  const salary = job.salary || job.sal || job.price;
  if (salary !== undefined && salary !== null) {
    if (typeof salary === 'number') return `${salary.toLocaleString()} €`;
    if (typeof salary === 'string') {
      let clean = salary.replace(/€/g, '').trim() + ' €';
      return clean;
    }
    return String(salary);
  }
  return null;
};

const getFriendlyLocation = (job: any) => {
  const loc = job.loc || job.location || job.grad;
  if (!loc) return 'Srbija';
  if (typeof loc === 'string') return loc.charAt(0).toUpperCase() + loc.slice(1).toLowerCase();
  if (typeof loc === 'object' && loc !== null) {
    if ('address' in loc) return (loc as any).address;
    if ('name' in loc) return (loc as any).name;
  }
  return 'Srbija';
};

export default function JobsSection({ latestJobs = [] }: any) {
  const navigate = useNavigate();
  return (
    <section className="py-12 md:py-24 bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
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
          <div className="space-y-4">
            {latestJobs.map((job: any, idx: number) => {
              const salary = getFriendlySalary(job);
              const location = getFriendlyLocation(job);
              return (
                <div
                  key={job.id || idx}
                  className="bg-surface-container-lowest rounded-[10px] border border-outline-variant/10 hover:border-secondary/30 transition-all duration-300 cursor-pointer flex items-center gap-4 md:gap-6 p-4 md:p-6"
                  onClick={() => navigate(`/poslovi/${job.id}`)}
                >
                  {job.logo && (
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-[10px] overflow-hidden bg-surface-container-lowest border border-outline-variant/10 shrink-0">
                      <img src={job.logo} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base md:text-lg uppercase truncate group-hover:text-secondary transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-3 md:gap-4 text-on-surface-variant text-xs md:text-sm mt-1">
                      {job.comp && <span className="font-medium truncate">{job.comp}</span>}
                      <span className="flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {location}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {salary && (
                      <div className="text-base md:text-lg font-black text-secondary">{salary}</div>
                    )}
                    {job.isPremium && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-secondary mt-1">Premium</div>
                    )}
                  </div>
                  <button
                    aria-label={`Pogledaj detalje ${job.title}`}
                    className="p-2 rounded-[10px] border border-outline-variant/20 hover:bg-secondary hover:border-secondary transition-all duration-300 group/btn shadow-lg hover:shadow-secondary/20 shrink-0"
                  >
                    <span className="material-symbols-outlined group-hover/btn:text-on-secondary transition-colors text-white">chevron_right</span>
                  </button>
                </div>
              );
            })}
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
