import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMastersList } from '@/src/modules/masters/hooks/useMasters';
import { useMachinesList } from '@/src/modules/machines';
import { useJobs } from '@/src/modules/jobs';
import { ChevronRight, Settings, Wrench, Briefcase } from 'lucide-react';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface CrossVerticalHubProps {
  gradSlug?: string;
  zanimanjeSlug?: string;
  currentVertical: string;
}

export function CrossVerticalHub({ gradSlug, zanimanjeSlug, currentVertical }: CrossVerticalHubProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '250px' });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const gradName = LOCATIONS.find(l => l.slug === gradSlug)?.name || gradSlug;
  const filterParams = gradSlug && gradSlug !== 'all' ? { locationSlug: gradSlug } : {};

  // Fetch a small slice of data to form the SEO cluster, only if actually needed and in view
  const { data: jobsData } = useJobs({ ...filterParams, limit: 3 }, { enabled: isVisible && currentVertical !== 'poslovi' });
  const { data: mastersData } = useMastersList({ ...filterParams, limit: 3 }, { enabled: isVisible && currentVertical !== 'majstori' });
  const { data: machinesData } = useMachinesList({ ...filterParams, limit: 3 }, { enabled: isVisible && currentVertical !== 'masine' });

  const jobs = jobsData?.pages?.[0]?.items || [];
  const masters = mastersData?.pages?.[0]?.docs || [];
  const machines = machinesData?.pages?.[0]?.items || [];

  return (
    <nav ref={containerRef} aria-labelledby="hub-navigation" className="max-w-7xl mx-auto px-4 sm:px-8 w-full pt-4 md:pt-8 pb-6 md:pb-8 relative z-10">
      <div className="bg-[#050A0F]/80 border border-white/10 rounded-2xl px-6 py-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <header className="mb-10 text-center">
          <h2 id="hub-navigation" className="text-2xl font-black uppercase tracking-tight text-white mb-2">
            Povezane Usluge {gradName ? `u mestu ${gradName}` : ''}
          </h2>
          <p className="text-white/70 text-sm">Pronađite sve što vam treba za građevinski projekat na jednom mestu.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentVertical !== 'poslovi' && (
            <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-secondary/30 transition-colors flex flex-col justify-between md:h-[340px]">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm">Aktuelni Poslovi</h3>
                    <p className="text-xs uppercase tracking-widest text-white/60">Zapošljavanje u građevini</p>
                  </div>
                </div>
                {jobsData && jobs.length > 0 ? (
                  <ul className="space-y-4 mb-6">
                    {jobs.slice(0,3).map((job: any) => (
                      <li key={job.id}>
                        <Link to={`/posao/${job.id}`} className="block group">
                           <h4 className="text-xs font-bold text-white group-hover:text-secondary transition-colors line-clamp-1">{job.title}</h4>
                           <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs text-white/70 bg-white/5 px-1.5 py-0.5 rounded font-mono uppercase">{job.salary || 'Po dogovoru'}</span>
                           </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Pregledajte aktuelnu ponudu poslova iz oblasti građevinarstva, arhitekture i inženjeringa.</p>
                  </div>
                )}
              </div>
              <Link to={gradSlug ? `/poslovi/${gradSlug}` : '/poslovi'} className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-widest hover:text-white transition-colors mt-auto">
                Pregledaj ponudu <ChevronRight size={14} />
           </Link>
            </div>
          )}

          {currentVertical !== 'firme' && (
             <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
               <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                     <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-[20px]">domain</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-white uppercase text-sm">Građevinske Firme</h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">Izvođači radova i usluge</p>
                     </div>
                  </div>
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Baza proverenih izvođača radova, projektantskih biroa i specijalizovanih preduzeća.</p>
                     <ul className="flex flex-wrap gap-2 pt-2">
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Visokogradnja</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Niskogradnja</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Inženjering</span></li>
                     </ul>
                  </div>
               </div>
               <Link to={gradSlug ? `/firme/${gradSlug}` : '/firme'} className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                 Pronađi firmu <ChevronRight size={14} />
               </Link>
             </div>
          )}

          {currentVertical !== 'majstori' && (
            <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm">Majstori i Ekipe</h3>
                    <p className="text-xs uppercase tracking-widest text-white/60">Specijalisti i zanatlije</p>
                  </div>
                </div>
                {mastersData && masters.length > 0 ? (
                  <ul className="space-y-4 mb-6">
                    {masters.slice(0,3).map((master: any) => (
                      <li key={master.id}>
                        <Link to={`/majstori/profil/${master.id}`} className="block group">
                          <h4 className="text-xs font-bold text-white group-hover:text-blue-500 transition-colors line-clamp-1">{master.name || master.title}</h4>
                          <p className="text-xs text-white/70 line-clamp-1 mt-1 leading-snug">{master.description || master.professionTitle}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Baza stručnih majstora sa proverenim recenzijama i gotovim radovima.</p>
                  </div>
                )}
              </div>
              <Link to={gradSlug ? `/majstori/${gradSlug}` : '/majstori'} className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                Angažuj majstore <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {currentVertical !== 'smestaj' && (
             <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-teal-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
               <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                     <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500">
                        <span className="material-symbols-outlined text-[20px]">bed</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-white uppercase text-sm">Smeštaj za Radnike</h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">Smeštajni kapaciteti</p>
                     </div>
                  </div>
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Kvalitetan smeštaj za organizovane grupe radnika i mehanizaciju.</p>
                     <ul className="flex flex-wrap gap-2 pt-2">
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Prenoćište</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Hosteli</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Stanovi</span></li>
                     </ul>
                  </div>
               </div>
               <Link to={gradSlug ? `/smestaj/lokacija/${gradSlug}` : '/smestaj'} className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                 Pregledaj smeštaj <ChevronRight size={14} />
               </Link>
             </div>
          )}

          {currentVertical !== 'masine' && (
            <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-green-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white uppercase text-sm">Mehanizacija</h3>
                    <p className="text-xs uppercase tracking-widest text-white/60">Najam i prodaja mašina</p>
                  </div>
                </div>
                {machinesData && machines.length > 0 ? (
                  <ul className="space-y-4 mb-6">
                    {machines.slice(0,3).map((machine: any) => (
                      <li key={machine.id}>
                        <Link to={`/gradjevinske-masine/${machine.id}`} className="block group">
                          <h4 className="text-xs font-bold text-white group-hover:text-green-500 transition-colors line-clamp-1">{machine.title || machine.adTitle}</h4>
                          <p className="text-xs text-white/70 mt-1 bg-white/5 px-1.5 py-0.5 rounded inline-block">{machine.price ? `${machine.price}€` : 'Po dogovoru'}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Baza teške i lake građevinske mehanizacije, opreme, skela i alata.</p>
                  </div>
                )}
              </div>
              <Link to={gradSlug ? `/gradjevinske-masine/${gradSlug}` : '/gradjevinske-masine'} className="flex items-center gap-2 text-xs font-bold text-green-500 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                Pregledaj ponudu <ChevronRight size={14} />
              </Link>
            </div>
          )}

          {currentVertical !== 'ketering' && (
             <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-amber-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
               <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                     <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <span className="material-symbols-outlined text-[20px]">restaurant</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-white uppercase text-sm">Radnički Ketering</h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">Ishrana na terenu</p>
                     </div>
                  </div>
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Organizovana priprema i dostava toplih obroka za gradilišta i kolektive.</p>
                     <ul className="flex flex-wrap gap-2 pt-2">
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Kuvana jela</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Lanč paketi</span></li>
                        <li><span className="text-xs px-2 py-1 bg-white/5 rounded text-white/70 border border-white/5">Dostava</span></li>
                     </ul>
                  </div>
               </div>
               <Link to={gradSlug ? `/ketering/lokacija/${gradSlug}` : '/ketering'} className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                 Pregledaj ketering <ChevronRight size={14} />
               </Link>
             </div>
          )}

          {currentVertical !== 'alat-i-oprema' && (
             <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-pink-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
               <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                     <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                        <span className="material-symbols-outlined text-[20px]">handyman</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-white uppercase text-sm">Berza Alata</h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">Prodaja i oprema</p>
                     </div>
                  </div>
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Novi i polovni profesionalni alati, HTZ oprema, skele i građevinski materijal.</p>
                  </div>
               </div>
               <Link to={gradSlug ? `/alat-i-oprema/lokacija/${gradSlug}` : '/alat-i-oprema'} className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                 Pregledaj berzu <ChevronRight size={14} />
               </Link>
             </div>
          )}

          {currentVertical !== 'placevi' && (
             <div className="bg-[#0A1118]/50 border border-white/5 rounded-2xl p-6 hover:border-lime-500/30 transition-colors flex flex-col justify-between md:h-[340px]">
               <div>
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                     <div className="w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center text-lime-500">
                        <span className="material-symbols-outlined text-[20px]">landscape</span>
                     </div>
                     <div>
                        <h3 className="font-bold text-white uppercase text-sm">Placevi</h3>
                        <p className="text-xs uppercase tracking-widest text-white/60">Zemljište za gradnju</p>
                     </div>
                  </div>
                  <div className="space-y-3 mb-6">
                     <p className="text-sm text-white/70 leading-relaxed font-medium">Ponuda atraktivnog zemljišta, građevinskih parcela i industrijskih zona.</p>
                  </div>
               </div>
               <Link to={gradSlug ? `/placevi/lokacija/${gradSlug}` : '/placevi'} className="flex items-center gap-2 text-xs font-bold text-lime-400 uppercase tracking-widest hover:text-white transition-colors mt-auto">
                 Pregledaj placeve <ChevronRight size={14} />
               </Link>
             </div>
          )}
        </div>
      </div>
    </nav>
  );
}
