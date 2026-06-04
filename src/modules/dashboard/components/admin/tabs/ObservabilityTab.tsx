import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/src/firebase';
import { apiClient } from '@/src/lib/apiClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChartSkeleton } from '@/src/modules/dashboard/components/dashboard/AnalyticsSkeleton';
import { queryKeys } from "@/src/lib/queryKeysFactory";

export function ObservabilityTab() {
  const queryClient = useQueryClient();

  const { data: dlqItems = [], isLoading: dlqLoading } = useQuery({
    queryKey: queryKeys.admin.dlq,
    queryFn: async () => {
      return await apiClient.get<any>('/admin/dlq');
    },
    enabled: !!auth.currentUser,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.admin.monitoring,
    queryFn: async () => {
      return await apiClient.get<any>('/admin/monitoring');
    },
    enabled: !!auth.currentUser,
  });

  const loading = dlqLoading || statsLoading;

  const retryMutation = useMutation({
    mutationFn: async ({ id, source }: { id: string, source: string }) => {
      return apiClient.post(`/admin/dlq/${id}/retry`, { source });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dlq });
    }
  });

  const handleRetry = async (id: string, source: string) => {
    retryMutation.mutate({ id, source });
  };

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.dlq });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.monitoring });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-2xl font-black uppercase tracking-tight">MONITORING SISTEMA</h3>
           <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">DLQ (Dead Letter Queue) i metrike otpornosti</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all"
        >
          {loading ? 'OSVEŽAVANJE...' : 'OSVEŽI NAJNOVIJE'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className={`text-3xl font-black mb-2 ${dlqItems.length > 0 ? 'text-red-500' : 'text-green-500'}`}>{dlqItems.length}</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">DLQ</div>
         </div>
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className="text-3xl font-black mb-2 text-white">{stats?.totalRequests || 0}</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Requestovi</div>
         </div>
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className="text-3xl font-black mb-2 text-white">{stats?.avgResponseTime || 0}ms</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Odziv (MS)</div>
         </div>
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className="text-3xl font-black mb-2 text-yellow-500">{stats?.outbox?.pending || 0}</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Outbox Wait</div>
         </div>
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className="text-3xl font-black mb-2 text-blue-400">{stats?.cacheHitRatio || '0%'}</div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Cache Ratio</div>
         </div>
         <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden group">
            <div className="text-3xl font-black mb-2 text-purple-400">
              {stats?.redisHealth?.used_memory_human || 'N/A'}
            </div>
            <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Redis Mem</div>
         </div>
      </div>

      {loading ? (
        <ChartSkeleton type="bar" height={360} />
      ) : stats?.botStats && Object.keys(stats.botStats).length > 0 && (
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 mb-8">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">robot_2</span> Mission Control: Crawler Load (Danas)
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.keys(stats.botStats).map(name => ({
                  name,
                  Total: stats.botStats[name].total || 0,
                  Errors: stats.botStats[name].errors || 0,
                  ClientErrors: stats.botStats[name].clientErrors || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0F14', borderColor: '#333', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="ClientErrors" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-3">
              {Object.keys(stats.botStats).map(botName => (
                <div key={botName} className="border border-white/5 rounded flex justify-between items-center p-4 bg-white/[0.02]">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white">{botName}</div>
                    <div className="text-[8px] font-bold text-white/40 uppercase mt-1">
                      {stats.botStats[botName].errors > 0 ? <span className="text-red-500">Errors: {stats.botStats[botName].errors}</span> : 'Status: Optimal'}
                    </div>
                  </div>
                  <span className="text-xl font-black text-blue-400">{stats.botStats[botName].total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
           <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-red-500">error</span>
              DEAD LETTER QUEUE (PROPALI TASKOVI)
           </h4>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ENTITET</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">OPERACIJA</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">GREŠKA</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">POKUŠAJI</th>
                    <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">AKCIJA</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center text-white/20 font-black animate-pulse uppercase">Učitavanje...</td></tr>
                 ) : dlqItems.length > 0 ? dlqItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="px-8 py-6">
                          <div className="text-[10px] font-black text-white uppercase">{item.source || 'SISTEM'}</div>
                          <div className="text-[8px] font-bold text-white/20 truncate max-w-[150px]">
                           ID: {item.source === 'outbox' ? (item.payload?.entityId || item.id) : (item.entityId || item.id)}
                          </div>
                          <div className="text-[8px] font-bold text-white/20 truncate max-w-[150px]">
                            {item.source === 'outbox' && item.payload?.collection ? `Kolekcija: ${item.payload.collection}` : ''}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm bg-white/5`}>
                              {item.actionType || item.jobType || item.type || 'NEPOZNATO'}
                            </span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="text-[9px] font-bold text-red-400 max-w-[250px] truncate" title={item.error || 'Nepoznata greška'}>
                             {item.error || 'Nepoznata greška'}
                          </div>
                          <div className="text-[8px] font-bold text-white/20 uppercase">
                             {new Date(item.createdAt || item.metadata?.finishedAt || Date.now()).toLocaleTimeString('sr-RS')}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="text-[12px] font-black text-white">{item.retryCount ?? item.attemptsMade ?? 0}</div>
                       </td>
                       <td className="px-8 py-6">
                          <button 
                            onClick={() => handleRetry(item.id, item.source)}
                            className="bg-white text-slate-900 px-4 py-2 hover:bg-white/90 font-black text-[9px] uppercase tracking-widest transition-colors rounded-sm flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                            RETRY
                          </button>
                       </td>
                    </tr>
                 )) : (
                    <tr><td colSpan={5} className="p-20 text-center text-white/20 font-black uppercase tracking-widest">DLQ Je Čist. Sistem radi optimalno.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </motion.div>
  );
}
