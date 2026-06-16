import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { format } from 'date-fns';
import { sr } from 'date-fns/locale';
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { apiClient } from '@/src/lib/apiClient';
import { useAdminAbuse, AbuseReport } from '@/src/modules/admin/hooks/useAdminAbuse';
import { queryKeys as factoryQueryKeys, dashboardKeys } from '@/src/lib/queryKeysFactory';
import { toast } from 'react-hot-toast';

export interface AbuseMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt?: { _seconds: number; _nanoseconds: number };
}

export function AbuseTab() {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<AbuseReport | null>(null);
  const [transcript, setTranscript] = useState<AbuseMessage[]>([]);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  const { ref, inView } = useInView({ threshold: 0 });

  const { 
    abuseReports: reports, 
    isLoading, 
    isFetchingNextPage, 
    hasMore, 
    fetchReports 
  } = useAdminAbuse();

  useEffect(() => {
    if (inView && hasMore && !isFetchingNextPage) {
      fetchReports();
    }
  }, [inView, hasMore, isFetchingNextPage, fetchReports]);

  const viewTranscript = async (report: AbuseReport) => {
    setSelectedReport(report);
    if (report.targetType === 'conversation' || report.targetType === 'chat') {
       setIsTranscriptLoading(true);
       try {
         const data = await apiClient.get<{ messages: AbuseMessage[] }>(`/admin/abuse-reports/${report.id}/transcript`);
         setTranscript(data?.messages || []);
       } catch (e) {
         console.error(e);
       } finally {
         setIsTranscriptLoading(false);
       }
    }
  };

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status, note }: { reportId: string, status: 'RESOLVED' | 'DISMISSED', note: string }) => {
      return apiClient.post(`/admin/abuse-reports/${reportId}/resolve`, { status, note });
    },
    onMutate: async ({ reportId, status }) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.adminAbuseReports() });
      await queryClient.cancelQueries({ queryKey: factoryQueryKeys.admin.abuseReports });

      const previousReports = queryClient.getQueryData(dashboardKeys.adminAbuseReports());
      const previousLegacyReports = queryClient.getQueryData(factoryQueryKeys.admin.abuseReports);

      queryClient.setQueryData<InfiniteData<{ reports: AbuseReport[]; nextPageParam: string | null }>>(
        dashboardKeys.adminAbuseReports(),
        (old) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              reports: page.reports.filter((item) => item.id !== reportId)
            }))
          };
        }
      );

      queryClient.setQueryData<any>(
        factoryQueryKeys.admin.abuseReports,
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.filter((item: any) => item.id !== reportId);
          }
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => {
                if (Array.isArray(page)) {
                  return page.filter((item: any) => item.id !== reportId);
                }
                if (page.reports) {
                  return {
                    ...page,
                    reports: page.reports.filter((item: any) => item.id !== reportId)
                  };
                }
                return page;
              })
            };
          }
          return old;
        }
      );

      setSelectedReport(null);

      return { previousReports, previousLegacyReports };
    },
    onError: (err, variables, context) => {
      if (context?.previousReports) {
        queryClient.setQueryData(dashboardKeys.adminAbuseReports(), context.previousReports);
      }
      if (context?.previousLegacyReports) {
        queryClient.setQueryData(factoryQueryKeys.admin.abuseReports, context.previousLegacyReports);
      }
      if (context?.previousReports) {
        const allReports = (context.previousReports as any).pages?.flatMap((p: any) => p.reports) || [];
        const failedReport = allReports.find((r: any) => r.id === variables.reportId);
        if (failedReport) {
          setSelectedReport(failedReport);
        }
      }

      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || 'Greška pri ažuriranju prijave');
    },
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'RESOLVED' ? 'Prijava označena kao rešena' : 'Prijava odbačena');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.adminAbuseReports() });
      queryClient.invalidateQueries({ queryKey: factoryQueryKeys.admin.abuseReports });
    }
  });

  const resolveReport = async (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedReport) return;
    const note = prompt('Dodajte internu belešku o rešavanju:');
    if (note === null) return;

    resolveReportMutation.mutate({ reportId: selectedReport.id, status, note });
  };

  const suspendUser = async (userId: string) => {
    if (!confirm('Da li ste sigurni da želite da SUSPENDUJETE ovog korisnika?')) return;
    const reason = prompt('Razlog suspenzije (vidljivo korisniku):');
    if (!reason) return;

    try {
      await apiClient.post(`/admin/users/${userId}/suspend`, { status: 'suspended', reason });
      alert('Korisnik je suspendovan.');
    } catch (e) {
      console.error(e);
    }
  };

  const formatCreatedAt = (createdAt: { _seconds: number; _nanoseconds: number } | string | undefined): string => {
    if (!createdAt) return '';
    if (typeof createdAt === 'object' && '_seconds' in createdAt) {
      return format(new Date(createdAt._seconds * 1000), 'd. MMM yyyy, HH:mm', { locale: sr });
    }
    return format(new Date(createdAt), 'd. MMM yyyy, HH:mm', { locale: sr });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F14] border border-white/5 rounded-[10px] p-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Prijave Sadržaja & Abuse Panel</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Sistem za moderaciju sporova i neadekvatnog ponašanja</p>
        </div>
        <button onClick={() => fetchReports()} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-[8px] text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
          Osveži listu
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List of Reports */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
             <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Aktivne prijave</h3>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-10 text-center text-white/20">Učitavanje...</div>
            ) : reports.length === 0 ? (
              <div className="p-10 text-center text-white/20">Nema aktivnih prijava</div>
            ) : (
              reports.map(report => (
                <button 
                  key={report.id}
                  onClick={() => viewTranscript(report)}
                  className={`w-full text-left p-4 hover:bg-white/[0.03] transition-all flex justify-between items-start ${selectedReport?.id === report.id ? 'bg-white/[0.05] border-l-2 border-error' : ''}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest ${report.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                         {report.status}
                       </span>
                       <span className="text-white/60 text-[10px] font-mono">#{report.id.substring(0, 8)}</span>
                    </div>
                    <p className="text-white font-bold text-sm">{report.targetName || report.targetType}</p>
                    <p className="text-error text-xs font-medium">{report.reason}</p>
                    <p className="text-white/40 text-[10px] uppercase font-bold">{report.reporterName} • {formatCreatedAt(report.createdAt)}</p>
                  </div>
                  <span className="material-symbols-outlined text-white/20">chevron_right</span>
                </button>
              ))
            )}

            {hasMore && (
              <div ref={ref} className="p-4 border-t border-white/5 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-secondary animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-1 h-1 rounded-full bg-secondary animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-1 h-1 rounded-full bg-secondary animate-pulse"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Detail & Actions */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 lg:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {!selectedReport ? (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-20"
              >
                <span className="material-symbols-outlined text-6xl mb-4">gavel</span>
                <p className="font-black uppercase tracking-widest text-xs">Izaberite prijavu za pregled</p>
              </motion.div>
            ) : (
              <motion.div 
                key="detail" 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-start">
                   <div>
                     <h3 className="text-lg font-black text-white uppercase tracking-tighter">{selectedReport.reason}</h3>
                     <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Prijava od: <span className="text-white">{selectedReport.reporterName}</span></p>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => resolveReport('RESOLVED')} className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded hover:bg-green-500/20 transition-all" title="Označi kao rešeno">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                     </button>
                     <button onClick={() => resolveReport('DISMISSED')} className="p-2 bg-white/5 text-white/40 border border-white/10 rounded hover:bg-white/10 transition-all" title="Odbaci prijavu">
                        <span className="material-symbols-outlined text-sm">cancel</span>
                     </button>
                   </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                  <p className="text-white/60 text-xs italic">"{selectedReport.details || 'Nema dodatnih detalja'}"</p>
                </div>

                {/* Evidence / Transcript */}
                {(selectedReport.targetType === 'conversation' || selectedReport.targetType === 'chat') && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">forum</span>
                      Transkript razgovora (Zadnjih 50 poruka)
                    </h4>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-4 h-[300px] overflow-y-auto space-y-3 font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/10">
                       {isTranscriptLoading ? (
                         <div className="h-full flex items-center justify-center text-white/20 italic">Učitavanje...</div>
                       ) : transcript.length === 0 ? (
                         <div className="h-full flex items-center justify-center text-white/20 italic">Istorija poruka nije pronađena</div>
                       ) : (
                         transcript.map((msg, i) => (
                           <div key={msg.id} className={`p-2 rounded ${msg.senderId === selectedReport.reporterId ? 'bg-white/5' : 'bg-error/5'}`}>
                             <div className="flex justify-between items-baseline mb-1">
                               <span className="font-bold text-white/40">{msg.senderId === selectedReport.reporterId ? 'Prijavljivač' : 'Prijavljeni'}</span>
                               <span className="text-[9px] text-white/20">{msg.createdAt?._seconds ? format(new Date(msg.createdAt._seconds * 1000), 'HH:mm') : ''}</span>
                             </div>
                             <p className="text-white/80">{msg.text}</p>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                )}

                {/* Powerful Actions */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Kaznene mere</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={() => suspendUser(selectedReport.targetId)}
                        className="flex items-center justify-center gap-2 py-3 bg-red-600/20 text-red-500 border border-red-600/30 rounded font-black uppercase text-[10px] tracking-widest hover:bg-red-600/30 transition-all"
                      >
                         <span className="material-symbols-outlined text-sm">block</span>
                         Suspenduj prijavljenog
                      </button>
                      <button 
                         className="flex items-center justify-center gap-2 py-3 bg-white/5 text-white/40 border border-white/10 rounded font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                      >
                         <span className="material-symbols-outlined text-sm">mail</span>
                         Pošalji upozorenje
                      </button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
