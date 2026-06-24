import { motion } from 'motion/react';
import { useMemo, useEffect, useState } from 'react';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { getJobLink } from '@/src/lib/routeFilters';
import { useMyApplicationsNode } from '@/src/modules/dashboard/hooks/useMyApplicationsNode';

export default function MyApplicationsPage() {
  const { user } = useAuth();
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);
  
  const { 
    applications, 
    jobs,
    loadingApps,
    loadingJobs,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useMyApplicationsNode(debouncedQuery);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !loadingApps) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, loadingApps, fetchNextPage]);

  const isLoading = loadingApps || loadingJobs;

  const myApplications = useMemo(() => {
    if (!user) return [];
    
    return applications
      .map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        
        let statusString = 'U OBRADI';
        let colorClass = 'text-blue-500';
        let bgClass = 'bg-blue-500/10';
        
        if (app.status === 'accepted') {
          statusString = 'PRIHVAĆENO';
          colorClass = 'text-green-500';
          bgClass = 'bg-green-500/10';
        } else if (app.status === 'rejected') {
          statusString = 'ODBIJENO';
          colorClass = 'text-red-500';
          bgClass = 'bg-red-500/10';
        } else if ((app.status as unknown) === 'reviewed') {
          statusString = 'U RAZMATRANJU';
          colorClass = 'text-purple-500';
          bgClass = 'bg-purple-500/10';
        }

        // Formatirati createdAt
        const createdAtVar = app.createdAt as unknown as { toDate?: () => Date };
        const dateObj = createdAtVar?.toDate ? createdAtVar.toDate() : new Date();
        const dateStr = dateObj.toLocaleDateString('sr-RS', { day: 'numeric', month: 'short', year: 'numeric' });

        return {
          id: app.id,
          company: job?.company || job?.comp || 'Poslodavac',
          position: app.jobTitle || job?.title || 'Nepoznata pozicija',
          location: job?.loc || 'Nije navedena',
          salary: job?.sal || 'Po dogovoru',
          status: statusString,
          date: dateStr,
          color: colorClass,
          bg: bgClass,
          jobId: app.jobId,
        };
      });
  }, [applications, jobs, user]);

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">MOJE PRIJAVE</h1>
            <div className="flex items-center gap-2 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              PRATITE STATUS VAŠIH KONKURSA U REALNOM VREMENU
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-full md:w-80">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
                <input 
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  type="text" 
                  placeholder="Pretraži prijave..." 
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all" 
                />
            </div>
            <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">USPEŠNOST PRIJAVA</div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight">
                {myApplications.length > 0 ? Math.round((myApplications.filter(a => a.status === 'PRIHVAĆENO').length / (myApplications.length || 1)) * 100) : 0}% RESPONSE RATE
              </div>
            </div>
            <div className="w-10 h-10 rounded-[10px] bg-secondary/10 flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary">analytics</span>
            </div>
          </div>
        </div>
      </div>

        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/[0.01]">
            <div className="grid grid-cols-5 gap-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <div className="col-span-2">POSLODAVAC I POZICIJA</div>
              <div>LOKACIJA / PLATA</div>
              <div>DATUM PRIJAVE</div>
              <div className="text-right">STATUS</div>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {myApplications.length === 0 ? (
              <div className="p-16 text-center">
                <span className="material-symbols-outlined text-4xl text-white/10 mb-4">move_to_inbox</span>
                <div className="text-white/40 font-black uppercase text-xs tracking-widest">
                  NEMATE NIJEDNU AKTIVNU PRIJAVU
                </div>
                <Link to="/poslovi" className="mt-6 inline-block text-[10px] font-black text-secondary uppercase tracking-widest hover:underline">
                  PRETRAŽI OGLASE →
                </Link>
              </div>
            ) : (
              myApplications.map((app, i) => (
                <motion.div 
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 grid grid-cols-5 gap-4 items-center hover:bg-white/[0.02] transition-all group"
                >
                  <div className="col-span-2 flex items-center gap-6">
                    <div className="w-14 h-14 bg-white/5 rounded-[10px] flex items-center justify-center font-black text-white/20 text-xl group-hover:bg-secondary/10 group-hover:text-secondary transition-all border border-white/5">
                      {app.company.charAt(0)}
                    </div>
                    <div>
                      <Link to={getJobLink(app.jobId)}>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight mb-1 hover:text-secondary transition-colors line-clamp-1">{app.company}</h3>
                      </Link>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest line-clamp-1">{app.position}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest">{app.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="material-symbols-outlined text-[12px]">payments</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{app.salary}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    {app.date}
                  </div>
                  
                  <div className="text-right flex items-center justify-end gap-4">
                    <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${app.bg} ${app.color} border border-current/10 whitespace-nowrap`}>
                      {app.status}
                    </span>
                    {app.status === 'PRIHVAĆENO' && (
                       <Link to="/poruke" className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary hover:!text-black transition-colors border border-secondary/20 shrink-0" title="Započni konverzaciju">
                         <span className="material-symbols-outlined text-sm">chat</span>
                       </Link>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {hasNextPage && (
            <div ref={ref} className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></div>
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></div>
                 <div className="w-2 h-2 rounded-full bg-secondary animate-bounce"></div>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">Učitavanje još prijava...</span>
               </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-[10px] p-8">
            <span className="material-symbols-outlined text-blue-500 mb-4">info</span>
            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2">SAVET ZA INTERVJU</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
              AKO JE VAŠ STATUS "PRIHVAĆENO", OBAVEZNO POGLEDAJTE DETALJE OGLASA JOŠ JEDNOM I PRIPREMITE PITANJA O GRADILIŠTU.
            </p>
          </div>
          <div className="bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20 rounded-[10px] p-8">
            <span className="material-symbols-outlined text-secondary mb-4">history</span>
            <h4 className="text-xs font-black text-white uppercase tracking-tight mb-2">ISTORIJA PRIJAVA</h4>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-relaxed">
              VAŠE PRIJAVE SE ČUVAJU 12 MESECI. MOŽETE IH KORISTITI KAO REFERENCU ZA BUDUĆE KONKURSE.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
