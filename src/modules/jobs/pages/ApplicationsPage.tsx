import { OptimizedImage } from '@/src/components/OptimizedImage';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/src/hooks/useDebounce';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useUserApplications, useJobMutations } from '@/src/modules/jobs/hooks/useJobs';
import { jobsService } from '@/src/modules/jobs/services/jobsService';
import { useMessages } from '@/src/context/MessagesContext';
import { clearDashboardCache } from '@/src/lib/idbService';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [localQuery, setLocalQuery] = useState('');
  const debouncedQuery = useDebounce(localQuery, 400);

  const role = user?.role === 'majstor' ? 'applicant' : user?.role === 'poslodavac' ? 'employer' : 'both';
  const { data: appsData, isLoading: loadingApps, refetch } = useUserApplications(user?.id, role, debouncedQuery);
  const applications = appsData || [];
  const { startConversation } = useMessages();
  const navigate = useNavigate();
  const { updateApplicationStatus } = useJobMutations();

  const handleUpdateStatus = async (appId: string, status: any, jobId: string) => {
    if (!user) return;
    try {
      await updateApplicationStatus({ appId, status, jobId, userId: user.id, role });
    } catch (err) {
      console.error(err);
    }
  };

  const moveCandidate = async (appId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected', jobId: string) => {
    if (!user) return;
    try {
      await updateApplicationStatus({ appId, status: newStatus, jobId, userId: user.id, role });
      clearDashboardCache(user.id);
    } catch (err) {
      console.error("Došlo je do greške:", err);
    }
  };

  const columns = [
    { id: 'pending', label: 'NOVE PRIJAVE', color: 'bg-blue-500' },
    { id: 'reviewed', label: 'U RAZMATRANJU', color: 'bg-purple-500' },
    { id: 'accepted', label: 'INTERVJU/PONUDA', color: 'bg-secondary' },
    { id: 'rejected', label: 'ARHIVA/ODBIJENO', color: 'bg-error' },
  ] as const;

  const isLoading = loadingApps;

  return (
    <DashboardLayout>
      <div className="space-y-10 h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">UPRAVLJANJE KANDIDATIMA</h1>
            <div className="flex items-center gap-4 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                UKUPNO {applications.length} AKTIVNIH PRIJAVA
              </span>
            </div>
          </motion.div>

          <div className="flex items-center gap-3">
            <div className="relative text-white/40">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg">search</span>
              <input 
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                type="text" 
                placeholder="PRETRAŽI KANDIDATE..." 
                className="bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-[10px] font-black tracking-widest uppercase focus:border-secondary transition-all outline-none text-white"
              />
            </div>
          </div>
        </div>

        {isLoading && applications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-white/20">
              <span className="animate-spin material-symbols-outlined text-4xl">refresh</span>
              <span className="text-xs font-black uppercase tracking-[0.2em]">Učitavanje kandidata...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-6 no-scrollbar min-h-[600px]">
            {columns.map((col) => {
              const colApps = applications.filter(c => c.status === col.id);
              return (
                <div key={col.id} className="w-80 shrink-0 flex flex-col gap-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${col.color}`}></div>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{col.label}</h3>
                    </div>
                    <span className="bg-white/5 text-[9px] font-black text-white/40 px-2 py-0.5 rounded-full">
                      {colApps.length}
                    </span>
                  </div>

                  <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[10px] p-4 space-y-4 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="popLayout">
                      {colApps.map((application) => {
                        const ca = application.createdAt as unknown as { toDate?: () => Date };
                        const formattedDate = ca?.toDate 
                          ? ca.toDate().toLocaleDateString('sr-RS')
                          : 'Nema datum';

                        return (
                        <motion.div
                          key={application.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-[#0F1720] border border-white/5 rounded-[10px] p-5 shadow-xl hover:border-secondary/30 transition-all group"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3">
                              {application.applicantProfileImage ? (
                                <OptimizedImage 
                                  src={application.applicantProfileImage} 
                                  fallbackType="default" 
                                  alt={application.applicantName || "Slika kandidata"} 
                                  className="w-full h-full object-cover" 
                                  containerClassName="w-12 h-12 rounded-[10px] bg-white border border-white/5 overflow-hidden"
                                /> 
                                  
                              ) : (
                                <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center font-black text-white/20 uppercase text-lg">
                                  {application.applicantName?.charAt(0) || 'K'}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                                  {application.applicantName || `ID: ${application.applicantId.substring(0, 8)}...`}
                                </h4>
                                <div className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[10px] text-secondary">location_on</span>
                                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{application.applicantCity || 'Lokacija nije navedena'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{formattedDate}</div>
                              {(application.applicantProfileScore || 0) > 0 && (
                                <div className="flex items-center gap-1 bg-secondary/10 px-2 py-0.5 rounded-[10px] border border-secondary/20">
                                  <span className="material-symbols-outlined text-secondary text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_check</span>
                                  <span className="text-[8px] font-black text-secondary tracking-widest">{application.applicantProfileScore}%</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">{application.applicantRole || 'Radnik'}</div>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-tighter line-clamp-1">{application.jobTitle || 'Nepoznat posao'}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {application.applicantSkillsSummary && application.applicantSkillsSummary.split(',').slice(0, 3).map((skill: string, i: number) => (
                              <span key={i} className="text-[8px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-[10px] uppercase tracking-widest whitespace-nowrap">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-white/20 text-sm">mail</span>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{application.applicantEmail || 'Nema emaila'}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-white/20 text-sm">phone</span>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{application.phone || 'Nema telefona'}</span>
                          </div>

                          <div className="bg-white/5 p-3 rounded-[10px] text-[11px] leading-relaxed text-white/60 mb-4 italic line-clamp-3 border border-white/5">
                            "{application.message}"
                          </div>
                          
                          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                            <div className="flex justify-between gap-2">
                              <button className="flex-1 py-2 bg-white/5 rounded-[10px] flex items-center justify-center gap-2 hover:bg-white/10 text-[9px] font-bold transition-all uppercase tracking-widest text-secondary border border-secondary/20" onClick={() => window.open(`/profil/${application.applicantId}`, '_blank')}>
                                Vidi profil
                              </button>
                            </div>
                            {col.id === 'accepted' && (
                              <button className="w-full py-2 bg-white/5 rounded-[10px] flex items-center justify-center gap-2 hover:bg-secondary hover:!text-black text-secondary text-[9px] font-bold transition-all uppercase tracking-widest border border-white/5" onClick={async () => {
                                 if (!user) return;
                                 try {
                                 await startConversation(application.applicantId, { id: application.jobId, type: 'job', title: application.jobTitle || 'Nepoznata pozicija' }, 'Zdravo, želimo da vas obavestimo da je vaša prijava za poziciju prihvaćena! Pozdrav.');
                                 // Add an initial message logic or similar if backend supports it
                                 navigate('/poruke');
                                 } catch(err) {
                                    if (import.meta.env.DEV) console.log(err);
                                 }
                              }}>
                                <span className="material-symbols-outlined text-sm">chat</span> Započni konverzaciju
                              </button>
                            )}
                            <div className="relative group/menu w-full">
                              <button className="w-full py-2 bg-white/5 rounded-[10px] flex items-center justify-center gap-2 hover:bg-secondary hover:!text-black text-xs font-bold transition-all uppercase tracking-widest text-white/60">
                                Promeni status <span className="material-symbols-outlined text-sm">expand_more</span>
                              </button>
                              <div className="absolute bottom-full left-0 mb-2 w-full bg-[#141B23] border border-white/10 rounded-[10px] shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 p-2">
                                {columns.filter(c => c.id !== application.status).map(c => (
                                  <button
                                    key={c.id}
                                    onClick={() => moveCandidate(application.id as string, c.id, application.jobId)}
                                    className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-white/5 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-secondary transition-all"
                                  >
                                    {c.id === 'accepted' ? 'PRIHVATI KANDIDATA' : c.id === 'rejected' ? 'ODBIJ KANDIDATA' : c.id === 'reviewed' ? 'U RAZMATRANJE' : 'VRATI U NOVE'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )})}
                    </AnimatePresence>
                    
                    {colApps.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[10px] opacity-20">
                        <span className="material-symbols-outlined text-2xl mb-2">inbox</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">NEMA PRIJAVA</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
