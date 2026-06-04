import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { apiClient } from '@/src/lib/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from "@/src/lib/queryKeysFactory";
import { toast } from 'react-hot-toast';

interface SyncStatus {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' | 'UNKNOWN';
  failureCount: number;
  name?: string;
}

interface OutboxMetric {
  pending: number;
}

interface MonitoringMetrics {
  avgResponseTime: number;
  totalRequests: number;
  instanceUptimeSeconds: number;
  outbox: OutboxMetric;
  errors: string[];
  syncSuccess: number;
}

interface DLQItem {
  id: string;
  source: string;
  jobType: string;
  queue: string;
  error: string;
  stack?: string;
  attemptsMade: number;
  payload?: any;
}

export function SyncTab() {
  const queryClient = useQueryClient();
  const [reindexing, setReindexing] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const { data: syncStatus, isLoading: loadingSync, refetch: fetchSyncStatus } = useQuery<SyncStatus>({
    queryKey: queryKeys.admin.syncStatus,
    queryFn: async () => {
      const data = await apiClient.get<SyncStatus[]>('/admin/circuit-breakers');
      const algoliaSync = Array.isArray(data) ? data.find(c => c.name === 'AlgoliaSync') : null;
      return (algoliaSync || { state: 'UNKNOWN', failureCount: 0 }) as SyncStatus;
    },
    staleTime: 1000 * 60 * 5, // 5 minuta
  });

  const { data: monitoringMetrics, isLoading: loadingMetrics } = useQuery<MonitoringMetrics>({
    queryKey: queryKeys.admin.monitoringMetrics,
    queryFn: () => apiClient.get<MonitoringMetrics>('/admin/monitoring'),
    staleTime: 1000 * 60 * 5, // 5 minuta
  });

  const { data: dlqItems = [], isLoading: loadingDlq, refetch: fetchDlqItems } = useQuery<DLQItem[]>({
    queryKey: queryKeys.admin.dlqItems,
    queryFn: async () => {
      const data = await apiClient.get<any>('/admin/dlq?limit=20');
      return (data?.items || []) as DLQItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 minuta
  });

  const loading = loadingSync || loadingMetrics || loadingDlq;

  const handleRetryBulkDlq = async () => {
    if (!window.confirm("Da li ste sigurni da želite da ponovite SVE neuspele DLQ zadatke?")) return;
    try {
      const { retriedCount } = await apiClient.post<{ retriedCount: number }>('/admin/dlq/retry', {});
      toast.success(`Uspešno poslato ${retriedCount} zadataka na ponovno procesuiranje.`);
      fetchDlqItems();
    } catch (err: any) {
      console.error(err);
      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || "Došlo je do greške prilikom ponovnog pokušaja svih zadataka.");
    }
  };

  const handleRetryDlq = async (id: string, source: string) => {
    if (!window.confirm("Da li ste sigurni da želite da pokušate ponovo ovaj zadatak?")) return;
    try {
      await apiClient.post(`/admin/dlq/${id}/retry`, { source });
      toast.success("Zadatak uspešno poslat na ponovno procesuiranje.");
      fetchDlqItems(); 
    } catch (err: any) {
      console.error(err);
      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || "Došlo je do greške prilikom ponovnog pokušaja.");
    }
  };

  if (loading && !syncStatus && !monitoringMetrics) return <Skeleton className="w-full h-80 rounded-[10px]" />;

  const isHealthy = syncStatus?.state === 'CLOSED';

  const handleReindex = async () => {
    if (!window.confirm("Da li ste sigurni da želite da pokrenete Re-index all proces? Ovo može trajati neko vreme.")) return;
    setReindexing(true);
    try {
      await apiClient.post('/admin/sync/reindex', {});
      toast.success("Re-index proces uspešno pokrenut u pozadini.");
    } catch (err: any) {
      console.error(err);
      const appErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(appErr?.response?.data?.error || appErr.message || "Došlo je do greške prilikom re-indeksiranja.");
    } finally {
      setReindexing(false);
      fetchSyncStatus();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">SISTEMSKI MONITOR & SINHRONIZACIJA</h2>
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
          PRAĆENJE STANJA SISTEMA, PERFORMANSI I PRETRAŽIVAČA
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Metrike Servera - Latencija i Blokade */}
        <div className="p-8 rounded-[10px] border relative overflow-hidden bg-white/5 border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Performanse Servera</h3>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 text-white/50">
                Latencija API-ja i blokade limitera
              </p>
              
              <div className="flex flex-col gap-4 mt-8">
                 <div className="flex justify-between items-center bg-black/40 p-4 rounded-[10px] border border-white/5">
                    <span className="text-white/40 font-bold uppercase text-xs tracking-widest">Prosečna Latencija</span>
                    <span className="text-2xl font-black text-secondary">{monitoringMetrics?.avgResponseTime || 0} ms</span>
                 </div>
                 <div className="flex justify-between items-center bg-black/40 p-4 rounded-[10px] border border-white/5">
                    <span className="text-white/40 font-bold uppercase text-xs tracking-widest">Zahteva do sada</span>
                    <span className="text-2xl font-black text-white">{monitoringMetrics?.totalRequests || 0}</span>
                 </div>
                 <div className="flex justify-between items-center bg-black/40 p-4 rounded-[10px] border border-white/5">
                    <span className="text-white/40 font-bold uppercase text-xs tracking-widest">Uptime servera</span>
                    <span className="text-xl font-black text-white/70">{(monitoringMetrics?.instanceUptimeSeconds || 0) / 3600 > 1 ? `${Math.floor((monitoringMetrics?.instanceUptimeSeconds || 0) / 3600)}h` : `${Math.floor((monitoringMetrics?.instanceUptimeSeconds || 0) / 60)}m`}</span>
                 </div>
                 <div className="flex justify-between items-center bg-black/40 p-4 rounded-[10px] border border-white/5">
                    <span className="text-white/40 font-bold uppercase text-xs tracking-widest">Outbox Pending</span>
                    <span className={`text-2xl font-black ${(monitoringMetrics?.outbox?.pending || 0) > 50 ? 'text-amber-500' : 'text-green-500'}`}>{monitoringMetrics?.outbox?.pending || 0}</span>
                 </div>
              </div>
            </div>
            
            <div className="mt-8">
               <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4">Rate limit i sistemske greške (poslednjih 50)</h4>
               <div className="bg-black/60 rounded-[10px] p-4 max-h-[150px] overflow-y-auto border border-red-500/10 font-mono text-[10px] text-red-300">
                  {(monitoringMetrics?.errors?.length ?? 0) > 0 ? (
                      monitoringMetrics?.errors?.map((err: string, i: number) => (
                          <div key={i} className="mb-2 border-b border-red-500/10 pb-2 last:mb-0 last:border-0 last:pb-0">{err}</div>
                      ))
                  ) : (
                      <span className="text-green-500">Svež start, nema grešaka ni Rate Limit blokada.</span>
                  )}
               </div>
            </div>
        </div>

        {/* Algolia Sync Box */}
        <div className={`p-8 rounded-[10px] border relative overflow-hidden flex flex-col justify-between ${isHealthy ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="relative z-10 flex flex-col gap-4">
            <div className={`w-16 h-16 rounded-[10px] flex items-center justify-center ${isHealthy ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              <span className="material-symbols-outlined text-3xl">{isHealthy ? 'check_circle' : 'error'}</span>
            </div>
            
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">AUTOMATSKA SINHRONIZACIJA AKTIVNA</h3>
              <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isHealthy ? 'text-green-500' : 'text-red-500'}`}>
                {isHealthy ? 'EKSTERNI PRETRAŽIVAČ RADI U REALNOM VREMENU' : 'OTKRIVENI SU PROBLEMI!'}
              </p>
            </div>
            
            <div className="flex flex-col gap-2 mt-6 p-6 bg-black/40 rounded-[10px] border border-white/5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/40 font-bold uppercase">Neuspešni mrežni pokušaji (Failures)</span>
                <span className="text-white font-black">{syncStatus?.failureCount || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-white/5">
                <span className="text-white/40 font-bold uppercase">Stanje zaštitnika (Circuit Breaker)</span>
                <span className="text-white font-black">{syncStatus?.state || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-3 pt-3 border-t border-white/5">
                <span className="text-white/40 font-bold uppercase">Uspeli Sync Taskovi (Cache/Redis)</span>
                <span className="text-green-400 font-black">{monitoringMetrics?.syncSuccess || 0}</span>
              </div>
            </div>
          </div>
          
          <button
              onClick={handleReindex}
              disabled={reindexing}
              className="mt-6 w-full px-6 py-4 bg-white text-slate-950 font-black uppercase text-xs tracking-widest rounded-[10px] hover:bg-white/90 disabled:opacity-50 transition-all"
          >
              {reindexing ? 'Reindeksiranje u toku...' : 'Pokreni Totalni Re-Index'}
          </button>
        </div>
      </div>

      {/* DLQ - Dead Letter Queue Box */}
      <div className="p-8 rounded-[10px] border relative overflow-hidden bg-white/5 border-white/10">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Dead Letter Queue (DLQ)</h3>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1">ZADACI KOJI SU PALI VIŠE OD 5 PUTA</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-red-500/20 text-red-500 rounded-full font-bold text-sm">
                {dlqItems.length} FAILED
              </div>
              {dlqItems.length > 0 && (
                <button
                  onClick={handleRetryBulkDlq}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white font-black text-[10px] tracking-widest uppercase rounded-[10px] hover:bg-red-600 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  Reprocess Failed DLQ tasks
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-xs uppercase tracking-widest">
                  <th className="p-4">Izvor</th>
                  <th className="p-4">Tip posla</th>
                  <th className="p-4">Greška</th>
                  <th className="p-4">Pokušaji</th>
                  <th className="p-4 text-right">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {dlqItems.map(doc => (
                  <React.Fragment key={doc.id}>
                    <tr 
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${expandedJob === doc.id ? 'bg-white/5' : ''}`}
                      onClick={() => setExpandedJob(expandedJob === doc.id ? null : doc.id)}
                    >
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-[4px] text-[10px] font-black uppercase ${doc.source === 'outbox' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {doc.source}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-white/70">{doc.jobType}</span>
                          <span className="text-[10px] text-white/30 truncate max-w-[150px]">{doc.queue}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs text-red-400 max-w-[300px] truncate">{doc.error}</p>
                      </td>
                      <td className="p-4 font-bold text-white">{doc.attemptsMade}</td>
                      <td className="p-4 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryDlq(doc.id, doc.source);
                          }}
                          className="px-4 py-2 bg-secondary text-slate-950 text-[10px] font-black uppercase rounded-full hover:bg-yellow-400 transition-all"
                        >
                          Retry
                        </button>
                        <span className="material-symbols-outlined text-white/20">
                          {expandedJob === doc.id ? 'expand_less' : 'expand_more'}
                        </span>
                      </td>
                    </tr>
                    {expandedJob === doc.id && (
                      <tr className="bg-black/40">
                        <td colSpan={5} className="p-6 border-b border-white/10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Detaljna Greška</h4>
                              <div className="p-4 bg-black/60 rounded-[10px] border border-red-500/20 font-mono text-xs text-red-300 whitespace-pre-wrap">
                                {doc.error}
                                {doc.stack && <div className="mt-4 opacity-50 border-t border-red-500/10 pt-4 text-[10px]">{doc.stack}</div>}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Payload (Data)</h4>
                              <div className="p-4 bg-black/60 rounded-[10px] border border-white/10 font-mono text-[10px] text-blue-300 overflow-x-auto">
                                <pre>{JSON.stringify(doc.payload || {}, null, 2)}</pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {dlqItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-white/40 font-medium">Nema neuspelih zadataka u DLQ-u.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
