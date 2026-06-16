import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/src/firebase';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChartSkeleton } from '@/src/modules/dashboard/components/dashboard/AnalyticsSkeleton';
import { queryKeys } from "@/src/lib/queryKeysFactory";

export interface CircuitBreakerStats {
  name: string;
  state: string;
  failureCount: number;
  lastErrorAt: string | null;
}

export interface RouteMetric {
  route: string;
  total: number;
  avgDuration: number;
  errorRate: string;
  statusBreakdown: Record<string, number>;
}

export interface DLQItem {
  id: string;
  source?: string;
  jobType?: string;
  type?: string;
  error?: string;
  createdAt?: string | number | Date;
  retryCount?: number;
  attempts?: number;
}

export interface DiagnosticsData {
  stats: {
    instanceUptimeSeconds: number;
    totalRequests: number;
    avgResponseTime: number;
    cacheHitRatio: string;
    botStats: Record<string, { total: number; errors: number }>;
    redisHealth?: {
      status: string;
      used_memory_human: string;
      used_memory_peak_human: string;
      instantaneous_ops_per_sec: number;
      mem_fragmentation_ratio: number;
      evicted_keys: number;
    };
  };
  circuitBreakers: CircuitBreakerStats[];
  routeMetrics: RouteMetric[];
  cachePartitionStats: Record<string, { hits: number; misses: number; ratio: string }>;
}

export function ObservabilityTab() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'overview' | 'routes' | 'cache' | 'infra' | 'dlq'>('overview');
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    setDiagLogs([`[${new Date().toLocaleTimeString('sr-RS')}] Pokrećem dijagnostički proces i provere unutar doker kontejnera...`]);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/monitoring/run-diagnostics', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Dijagnostički test nije uspeo.');
      const data = await res.json();
      if (data.success && data.logs) {
        setDiagLogs(data.logs);
      } else {
        setDiagLogs([`❌ Greška: Server nije vratio ispravne logove.`]);
      }
    } catch (err: any) {
      const error = err as Error;
      setDiagLogs(prev => [...prev, `❌ Fatalna greška pri komunikaciji: ${error.message}`]);
    } finally {
      setIsRunningDiag(false);
    }
  };

  const { data: diagnostics, isLoading: diagLoading } = useQuery<DiagnosticsData>({
    queryKey: ['admin', 'diagnostics'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/monitoring/diagnostics', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error('Failed to fetch diagnostics');
      return res.json();
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 30 * 60 * 1000,
    enabled: !!auth.currentUser,
  });

  const { data: dlqItems = [], isLoading: dlqLoading } = useQuery<DLQItem[]>({
    queryKey: queryKeys.admin.dlq,
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/dlq', { headers: { 'Authorization': `Bearer ${token}` } });
      return res.json();
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 30 * 60 * 1000,
    enabled: !!auth.currentUser,
  });

  const resetCbMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = await auth.currentUser?.getIdToken();
      return fetch(`/api/admin/monitoring/circuit-breakers/${name}/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'diagnostics'] });
    }
  });

  const retryMutation = useMutation({
    mutationFn: async ({ id, source }: { id: string, source: string }) => {
      const token = await auth.currentUser?.getIdToken();
      return fetch(`/api/admin/dlq/${id}/retry`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dlq });
    }
  });

  const loading = diagLoading || dlqLoading;
  const stats = diagnostics?.stats;
  const circuitBreakers = diagnostics?.circuitBreakers || [];
  const routeMetrics = diagnostics?.routeMetrics || [];
  const cachePartitionStats = diagnostics?.cachePartitionStats || {};

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'diagnostics'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.dlq });
  };

  const handleRetry = async (id: string, source: string) => {
    retryMutation.mutate({ id, source }, {
      onSuccess: () => {
         alert(`Retry triggered for task ${id}.`);
      },
      onError: (err: any) => {
         alert("Greška pri retry-u: " + (err.message || 'Nepoznata greška'));
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Header & Nav */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-4">
        <div>
           <h3 className="text-2xl font-black uppercase tracking-tight">GLOBAL OPS & TELEMETRY</h3>
           <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Real-time Health, Circuit Breakers & Route Performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'routes', label: 'API Routes' },
              { id: 'cache', label: 'Cache Sync' },
              { id: 'infra', label: 'Infrastructure' },
              { id: 'dlq', label: 'DLQ' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeView === tab.id ? 'bg-secondary text-slate-950' : 'text-white/40 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button 
            onClick={handleRefresh}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all border border-white/5"
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
               {[
                 { label: 'Uptime (Instance)', value: stats?.instanceUptimeSeconds ? `${Math.floor(stats.instanceUptimeSeconds / 3600)}h ${Math.floor((stats.instanceUptimeSeconds % 3600) / 60)}m` : '0s', color: 'text-white' },
                 { label: 'System Requests', value: stats?.totalRequests?.toLocaleString() || 0, color: 'text-white' },
                 { label: 'Avg Latency', value: `${stats?.avgResponseTime || 0}ms`, color: (stats?.avgResponseTime || 0) > 500 ? 'text-amber-500' : 'text-green-500' },
                 { label: 'Overall Cache Ratio', value: stats?.cacheHitRatio || '0%', color: 'text-blue-400' },
                 { label: 'DLQ Fatal Items', value: dlqItems.length, color: dlqItems.length > 0 ? 'text-red-500' : 'text-white/20' },
               ].map((stat, i) => (
                 <div key={i} className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Circuit Breakers */}
              <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-amber-500">bolt</span>
                    Circuit Breakers Status
                  </h4>
                  <div className="text-[10px] font-bold text-white/20 uppercase">Auto-Reset: Enabled</div>
                </div>
                <div className="p-6 space-y-4">
                  {circuitBreakers.length > 0 ? circuitBreakers.map((cb, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg group">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${cb.state === 'CLOSED' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : cb.state === 'OPEN' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-yellow-500 animate-pulse'}`}></div>
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-tight">{cb.name}</div>
                          <div className="text-[9px] font-bold text-white/30 uppercase">Failures: {cb.failureCount} | State: {cb.state}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => resetCbMutation.mutate(cb.name)}
                        className="opacity-0 group-hover:opacity-100 transition-all text-white/20 hover:text-white"
                        title="Force Reset"
                      >
                        <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                      </button>
                    </div>
                  )) : (
                    <div className="py-10 text-center text-white/20 font-black uppercase text-[10px] tracking-widest border border-dashed border-white/5 rounded-lg">No active breakers registered</div>
                  )}
                </div>
              </div>

              {/* Bot Activity / Crawler Load */}
              <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-6 flex flex-col">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">robot_2</span> BOT LOAD: Crawler Detection (Today)
                </h4>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.keys(stats?.botStats || {}).map(name => ({
                      name,
                      Total: (stats?.botStats[name] as any)?.total || 0,
                      Errors: (stats?.botStats[name] as any)?.errors || 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: '1px solid #222', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'routes' && (
          <motion.div 
            key="routes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A0F14] border border-white/5 rounded-[12px] overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest">API ROUTE PERFORMANCE</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Status code distribution & latency heat-map (24h Window)</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> <span className="text-white/40">Healthy</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> <span className="text-white/40">Error Ratio {'>'} 5%</span></div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Endpoint</th>
                    <th className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Traffic</th>
                    <th className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Latency (Avg)</th>
                    <th className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Error Rate</th>
                    <th className="px-8 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {routeMetrics.length > 0 ? routeMetrics.map((rm, idx) => {
                    const isSlow = rm.avgDuration > 500;
                    const isUnstable = parseFloat(rm.errorRate) > 5;
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="text-[11px] font-black text-white font-mono">{rm.route}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-[12px] font-black text-white">{rm.total.toLocaleString()}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`text-[12px] font-black ${isSlow ? 'text-amber-500' : 'text-white/60'}`}>{rm.avgDuration}ms</div>
                        </td>
                        <td className="px-8 py-5">
                           <div className={`text-[12px] font-black ${isUnstable ? 'text-red-500' : 'text-green-500/80'}`}>{rm.errorRate}%</div>
                        </td>
                        <td className="px-8 py-5 min-w-[200px]">
                           <div className="flex h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              {Object.entries(rm.statusBreakdown).map(([status, count]) => {
                                const width = (count / rm.total) * 100;
                                const color = status.startsWith('2') ? 'bg-green-500' : status.startsWith('5') ? 'bg-red-500' : status.startsWith('4') ? 'bg-amber-500' : 'bg-blue-500';
                                return <div key={status} style={{ width: `${width}%` }} className={color} title={`${status}: ${count}`} />
                              })}
                           </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} className="p-20 text-center text-white/20 font-black uppercase text-[10px] tracking-[0.5em]">Gathering telemetry data...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeView === 'cache' && (
          <motion.div 
            key="cache"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Object.entries(cachePartitionStats).map(([pref, s]) => (
                <div key={pref} className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-8 flex flex-col items-center text-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-8">{pref.replace('_', ' ')}</div>
                  <div className="relative w-32 h-32 mb-8">
                     <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                        <circle 
                          cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={364} 
                          strokeDashoffset={364 - (364 * parseFloat((s as any).ratio)) / 100}
                          className="text-blue-500 transition-all duration-1000 ease-out" 
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-white">{(s as any).ratio}</span>
                        <span className="text-[8px] font-bold text-white/30 uppercase">Hit Ratio</span>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 w-full gap-4 pt-4 border-t border-white/5">
                     <div>
                        <div className="text-[12px] font-black text-white">{(s as any).hits.toLocaleString()}</div>
                        <div className="text-[8px] font-bold uppercase text-white/30">Hits</div>
                     </div>
                     <div>
                        <div className="text-[12px] font-black text-white">{(s as any).misses.toLocaleString()}</div>
                        <div className="text-[8px] font-bold uppercase text-white/30">Misses</div>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeView === 'infra' && (stats?.redisHealth) && (
          <motion.div 
            key="infra"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Redis Analytics */}
            <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-8">
               <div className="flex items-center justify-between mb-10">
                  <h4 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">database</span> REDIS DATA ENGINE
                  </h4>
                  <div className={`px-3 py-1 rounded text-[9px] font-black uppercase ${stats.redisHealth.status === 'connected' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    ONLINE
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Memory Usage</div>
                    <div className="text-4xl font-black text-white mb-2">{stats.redisHealth.used_memory_human}</div>
                    <div className="text-[9px] font-bold text-white/20 uppercase">Peak: {stats.redisHealth.used_memory_peak_human}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Ops Per Sec</div>
                    <div className="text-4xl font-black text-white mb-2">{stats.redisHealth.instantaneous_ops_per_sec?.toLocaleString() || 0}</div>
                    <div className="text-[9px] font-bold text-white/20 uppercase">High Performance Mode</div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">
                      <span>Fragmentation Ratio</span>
                      <span className={stats.redisHealth.mem_fragmentation_ratio > 1.5 ? 'text-amber-500' : 'text-green-500'}>{stats.redisHealth.mem_fragmentation_ratio}x</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (stats.redisHealth.mem_fragmentation_ratio / 2) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg text-center">
                        <div className="text-xl font-black text-white">{stats.redisHealth.evicted_keys?.toLocaleString() || 0}</div>
                        <div className="text-[8px] font-black uppercase text-white/30 mt-1">Evicted Keys</div>
                     </div>
                     <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg text-center">
                        <div className="text-xl font-black text-white">L1/L2</div>
                        <div className="text-[8px] font-black uppercase text-white/30 mt-1">Multi-Layer Cache</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Infrastructure Health */}
            <div className="bg-[#0A0F14] border border-white/5 rounded-[12px] p-8 flex flex-col">
               <h4 className="text-[12px] font-black uppercase tracking-widest mb-8">COMPUTE & LATENCY OVERVIEW</h4>
               <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={routeMetrics.slice(0, 7).map((r) => ({ name: r.route.split('/').pop() || r.route, latency: r.avgDuration, traffic: r.total }))}>
                        <defs>
                          <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="name" stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                        <YAxis stroke="#444" fontSize={9} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #222', boxSizing: 'border-box' }} itemStyle={{ fontSize: '10px' }} />
                        <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Live Container Diagnostics Terminal */}
            <div className="lg:col-span-2 bg-[#0A0F14] border border-white/5 rounded-[12px] p-8 flex flex-col space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">terminal</span>
                    INTEGRISANI DIJAGNOSTIČKI ALAT KONTEJNERA (X-RAY)
                  </h4>
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">
                    Direktno testiranje memorije, performansi niti i mrežne ispravnosti sistema
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiag}
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-white/10 disabled:text-white/30 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isRunningDiag ? 'animate-spin' : ''}`}>
                    {isRunningDiag ? 'sync' : 'play_arrow'}
                  </span>
                  {isRunningDiag ? 'IZVRŠAVAM TESTOVE...' : 'POKRENI SISTEMSKI TEST'}
                </button>
              </div>

              <div className="w-full bg-slate-950 border border-white/10 rounded-lg p-5 font-mono text-[11px] leading-relaxed text-cyan-400/90 max-h-[350px] overflow-y-auto">
                {diagLogs.length > 0 ? (
                  <div className="space-y-1">
                    {diagLogs.map((log, idx) => (
                      <div key={idx} className={log.startsWith('❌') ? 'text-red-400 font-bold' : log.includes('✅') ? 'text-green-400' : 'text-cyan-400/90'}>
                        {log}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/20 text-center py-6 font-bold uppercase tracking-wider">
                    Terminalska konzola je spremna. Kliknite na dugme iznad za pokretanje dijagnostike u realnom vremenu.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'dlq' && (
           <motion.div 
            key="dlq"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A0F14] border border-white/5 rounded-[12px] overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 bg-red-500/[0.03]">
               <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-red-500">
                  <span className="material-symbols-outlined text-sm">error</span>
                  DEAD LETTER QUEUE (JOB FAILURES)
               </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">SERVICE</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">JOB TYPE</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ERROR MESSAGE</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ATTEMPTS</th>
                      <th className="px-8 py-6 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dlqLoading ? (
                      <tr><td colSpan={5} className="p-20 text-center text-white/20 animate-pulse font-black uppercase">Loading DLQ Data...</td></tr>
                    ) : dlqItems.length > 0 ? dlqItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-6">
                           <div className="text-[10px] font-black text-white uppercase">{item.source || 'OUTBOX'}</div>
                           <div className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">ID: {item.id}</div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[9px] font-black uppercase px-2 py-1 bg-white/5 rounded text-white/70">{item.jobType || item.type || 'SYSTEM'}</span>
                        </td>
                        <td className="px-8 py-6 max-w-[300px]">
                           <div className="text-[10px] font-bold text-red-400 truncate" title={item.error}>{item.error || 'N/A'}</div>
                           <div className="text-[8px] font-bold text-white/20 mt-1 uppercase leading-none">{new Date(item.createdAt || Date.now()).toLocaleString('sr-RS')}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-xl font-black text-white">{item.retryCount ?? item.attempts ?? 0}</div>
                        </td>
                        <td className="px-8 py-6">
                           <button 
                             onClick={() => handleRetry(item.id, item.source || 'outbox')}
                             className="px-4 py-2 bg-white text-slate-950 text-[9px] font-black uppercase tracking-widest rounded transition-all hover:bg-secondary"
                           >
                             RETRY
                           </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="p-24 text-center text-white/10 font-black uppercase tracking-[0.4em]">DLQ IS EMPTY. SYSTEM OPERATING AT 100% HEALTH.</td></tr>
                    )}
                  </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
