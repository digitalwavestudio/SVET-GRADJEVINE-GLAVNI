import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CORE_SECTORS } from '@/src/constants/taxonomy';

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <div className="lg:col-span-2 relative w-full h-full flex flex-col">
            {latestJobs.length > 0 ? (
              <div className="flex overflow-x-auto no-scrollbar gap-6 pb-4 md:grid md:grid-cols-2 md:gap-8 scroll-smooth w-full h-full">
                {latestJobs.map((job: any, idx: number) => {
                  const salary = getFriendlySalary(job);
                  const location = getFriendlyLocation(job);
                  return (
                  <div key={job.id || idx} className="bg-surface-container-lowest rounded-[10px] overflow-hidden border border-outline-variant/10 group shrink-0 w-full md:w-auto h-full flex flex-col cursor-pointer hover:border-secondary/30 transition-all duration-300" onClick={() => navigate(`/poslovi/${job.id}`)}>
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {job.isPremium && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
                              Premium
                            </span>
                          )}
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 ml-auto">{job.typeSlug || 'Posao'}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-3 uppercase line-clamp-2 group-hover:text-secondary transition-colors">{job.title}</h3>
                        <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-4">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            {location}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant/10">
                        <div className="flex items-center gap-3">
                          {job.logo && (
                            <div className="w-10 h-10 rounded-[10px] overflow-hidden bg-surface-container-lowest border border-outline-variant/10 shrink-0">
                              <img src={job.logo} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-bold text-white block">{job.comp || 'Poslodavac'}</span>
                            {salary && (
                              <span className="text-lg font-black text-secondary">{salary}</span>
                            )}
                          </div>
                        </div>
                        <button
                          aria-label={`Pogledaj detalje ${job.title}`}
                          className="p-2 rounded-[10px] border border-outline-variant/20 hover:bg-secondary hover:border-secondary transition-all duration-300 group/btn shadow-lg hover:shadow-secondary/20"
                        >
                          <span className="material-symbols-outlined group-hover/btn:text-on-secondary transition-colors text-white">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            ) : (
              <div className="bg-surface-container-lowest p-12 rounded-[10px] border border-white/5 text-center w-full flex flex-col items-center justify-center min-h-[350px] h-full flex-1">
                <span className="material-symbols-outlined text-white/10 text-6xl mb-4" style={{ fontVariationSettings: '"FILL" 1' }}>work_history</span>
                <h3 className="font-black text-2xl text-white/50 mb-2 uppercase tracking-tighter">Trenutno nema poslova</h3>
                <p className="text-on-surface-variant text-base">Oglasa za posao trenutno nema u bazi podataka. Pokušajte malo kasnije.</p>
              </div>
            )}
          </div>
          <div className="bg-surface-container-low p-6 sm:p-10 rounded-[10px] border border-white/10 flex flex-col relative shadow-xl overflow-hidden group/sidebar h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] pointer-events-none group-hover/sidebar:bg-blue-500/20 transition-colors duration-500"></div>
            <div className="absolute top-0 left-0 w-[2px] bg-blue-500 h-0 group-hover/sidebar:h-full transition-all duration-700"></div>

            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 border-b border-white/10 pb-5">
              Kategorije Poslova
            </h3>
            <ul className="space-y-3 flex-1 flex flex-col justify-center">
              {CORE_SECTORS.slice(0, 6).map((sector, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center p-5 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/20 hover:translate-x-1 transition-all duration-300 cursor-pointer group/item"
                  onClick={() => navigate(`/poslovi?sektor=${sector.slug}`)}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-500 text-lg">{sector.icon || 'work'}</span>
                    <span className="group-hover/item:text-white transition-colors uppercase font-black text-sm tracking-widest text-[#B4B9BE]">
                      {sector.name}
                    </span>
                  </span>
                  <span className="material-symbols-outlined text-lg text-white/20 group-hover/item:text-secondary group-hover/item:translate-x-1 transition-all duration-300">
                    arrow_forward
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to="/poslovi"
              className="w-full mt-10 py-4 md:py-5 flex items-center justify-center gap-2 uppercase font-black text-xs tracking-[0.1em] md:tracking-[0.2em] bg-secondary !text-black hover:bg-yellow-400 transition-all duration-500 rounded-[12px] shadow-lg hover:scale-[1.02]"
            >
              Svi poslovi
              <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
            </Link>
          </div>
        </div>

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