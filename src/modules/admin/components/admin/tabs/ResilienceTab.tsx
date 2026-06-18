import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/src/lib/firebase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/queryKeysFactory';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import { ChartSkeleton } from '@/src/modules/dashboard/components/dashboard/AnalyticsSkeleton';
import { 
  ShieldAlert, RefreshCw, Zap, Trash2, CheckCircle2, 
  TrendingUp, Activity, Database
} from 'lucide-react';

interface CircuitBreakerStats {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastErrorAt: string | null;
}

export function ResilienceTab() {
  const queryClient = useQueryClient();
  const [selectedBreaker, setSelectedBreaker] = useState<string>('');
  const [cachePrefix, setCachePrefix] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { data: breakers = [], isLoading, refetch, isFetching } = useQuery<CircuitBreakerStats[]>({
    queryKey: queryKeys.admin.circuitBreakers,
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/circuit-breakers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Neuspešno učitavanje osigurača');
      return res.json();
    },
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 30 * 60 * 1000,
    enabled: !!auth.currentUser,
  });

  const resetMutation = useMutation({
    mutationFn: async (payload: { name?: string; invalidateCache?: boolean; cachePrefix?: string }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/circuit-breakers/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Neuspešna operacija');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSuccessMsg(data.message || 'Operacija uspešno sprovedena.');
      setErrorMsg('');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.circuitBreakers });
      setTimeout(() => setSuccessMsg(''), 5000);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Došlo je do greške.');
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  });

  const handleResetBreaker = (name: string) => {
    resetMutation.mutate({ name });
  };

  const handleClearCache = (prefix?: string) => {
    if (prefix) {
      resetMutation.mutate({ invalidateCache: true, cachePrefix: prefix });
    } else {
      resetMutation.mutate({ invalidateCache: true });
    }
  };

  // Mock rolling error rate data over the last 10 minutes
  const rollingErrorData = [
    { time: '16:10', RateLimitError: 0.1, GatewayError: 0.0, DatabaseError: 0.2 },
    { time: '16:11', RateLimitError: 0.2, GatewayError: 0.1, DatabaseError: 0.1 },
    { time: '16:12', RateLimitError: 1.5, GatewayError: 0.3, DatabaseError: 0.4 },
    { time: '16:13', RateLimitError: 4.2, GatewayError: 2.1, DatabaseError: 1.1 },
    { time: '16:14', RateLimitError: 0.8, GatewayError: 0.2, DatabaseError: 0.5 },
    { time: '16:15', RateLimitError: 0.3, GatewayError: 0.1, DatabaseError: 1.8 },
    { time: '16:16', RateLimitError: 0.2, GatewayError: 0.0, DatabaseError: 0.2 },
    { time: '16:17', RateLimitError: 0.1, GatewayError: 0.0, DatabaseError: 0.1 },
    { time: '16:18', RateLimitError: 0.0, GatewayError: 0.0, DatabaseError: 0.0 },
    { time: '16:19', RateLimitError: 0.1, GatewayError: 0.3, DatabaseError: 1.2 },
    { time: '16:20', RateLimitError: 0.0, GatewayError: 0.1, DatabaseError: 0.1 },
  ];

  // Requests per minute per resource group
  const requestsPerMinuteData = [
    { name: 'Oglasi API', requests: 4500, cached: 3800 },
    { name: 'Sinhronizacija', requests: 800, cached: 0 },
    { name: 'Messages & Chat', requests: 1200, cached: 200 },
    { name: 'SEO Renderer', requests: 3100, cached: 2900 },
    { name: 'Firme i Korisnici', requests: 1500, cached: 900 },
  ];

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'text-green-500 border-green-500/10 bg-green-500/5';
      case 'OPEN':
        return 'text-red-500 border-red-500/10 bg-red-500/5 animate-pulse';
      case 'HALF_OPEN':
        return 'text-amber-500 border-amber-500/10 bg-amber-500/5';
      default:
        return 'text-white/40 border-white/5 bg-white/5';
    }
  };

  const getBadgeColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'bg-green-500 text-slate-950';
      case 'OPEN':
        return 'bg-red-500 text-white animate-pulse';
      case 'HALF_OPEN':
        return 'bg-amber-500 text-slate-950';
      default:
        return 'bg-white/10 text-white/50';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 text-white font-body"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <span className="p-2 bg-secondary/10 rounded-[10px] text-secondary">
              <ShieldAlert className="w-6 h-6" />
            </span>
            REZILIJENCIJA & TOKENSKA ZAŠTITA
          </h3>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">
            Upravljanje kaskadnim osiguračima (Circuit Breakers) i invalidacija distribuisanog keša
          </p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all self-start md:self-auto flex items-center gap-2 border border-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isLoading ? 'Učitavanje...' : 'OSVEŽI MATRICU'}
        </button>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-[10px] flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-[10px] flex items-center gap-3"
          >
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circuit Breakers grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-10 uppercase font-bold text-white/20 tracking-wider">
            Učitavanje osigurača...
          </div>
        ) : breakers.length > 0 ? (
          breakers.map((breaker) => (
            <div 
              key={breaker.name}
              className={`border rounded-[10px] p-6 flex flex-col justify-between transition-all ${getStatusColor(breaker.state)}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">{breaker.name}</h4>
                    <p className="text-[9px] font-bold text-white/40 uppercase mt-0.5">Sistemska grupa</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded ${getBadgeColor(breaker.state)}`}>
                    {breaker.state}
                  </span>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Faktor greške:</span>
                    <span className="font-mono font-bold text-white">{breaker.failureCount} / 5</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/45">Zadnji prekid:</span>
                    <span className="font-mono text-white/80">
                      {breaker.lastErrorAt ? new Date(breaker.lastErrorAt).toLocaleTimeString('sr-RS') : 'Nema prekida'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleResetBreaker(breaker.name)}
                disabled={resetMutation.isPending}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/20 text-[10px] font-black uppercase tracking-widest rounded border border-white/5 flex items-center justify-center gap-1.5 transition-all text-white hover:text-secondary hover:border-secondary/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Resetuj Osigurač
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-3 p-8 border border-white/5 rounded-[10px] text-center bg-white/[0.01]">
            <p className="text-xs uppercase font-black tracking-wider text-white/30">Nema registrovanih osigurača u sistemu.</p>
          </div>
        )}
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Rolling error rate */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" /> Stopa Grešaka u Realnom Vremenu (Rolling Error Rate %)
          </h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rollingErrorData}>
                <defs>
                  <linearGradient id="rateLimitGrace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="gatewayGrace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="time" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0F14', borderColor: '#333', fontSize: '11px', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="RateLimitError" stroke="#ef4444" fillOpacity={1} fill="url(#rateLimitGrace)" name="Preopterećenje (429)" />
                <Area type="monotone" dataKey="GatewayError" stroke="#eab308" fillOpacity={1} fill="url(#gatewayGrace)" name="Integracione Greške" />
                <Area type="monotone" dataKey="DatabaseError" stroke="#3b82f6" fillOpacity={0.1} strokeWidth={1} name="Firestore Read Timeout" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Requests per minute */}
        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Analiza Opterećenja Grupa Resursa (Zahtevi vs Keš)
          </h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={requestsPerMinuteData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="name" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0F14', borderColor: '#333', fontSize: '11px', borderRadius: '8px' }}
                />
                <Legend iconType="square" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="requests" stroke="#06b6d4" strokeWidth={1.5} fill="#06b6d4" fillOpacity={0.15} radius={[4, 4, 0, 0]} name="Ukupno Zahteva" />
                <Bar dataKey="cached" stroke="#10b981" strokeWidth={1.5} fill="#10b981" fillOpacity={0.3} radius={[4, 4, 0, 0]} name="Servirano iz Keša" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cache & Invalidation Tools */}
      <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
        <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-white">
          <Database className="w-5 h-5 text-secondary" /> ADMINISTRATORSKA ALATKA ZA DISTRIBUISANI KEŠ
        </h4>
        
        <p className="text-xs text-white/50 mb-6 max-w-xl leading-relaxed">
          Ručno invalidirajte ili ispraznite kompletne Redis i klijentske memorijske baferne strukture. 
          Unesite specifični prefiks (npr. <code className="text-secondary bg-[#121921] px-1.5 py-0.5 rounded font-mono">ad_</code> ili <code className="text-secondary bg-[#121921] px-1.5 py-0.5 rounded font-mono">unified_search_</code>) 
          da biste evakuisali ciljane podatke bez kvarenja globalnog caching hit ratio indeksa.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 block">Prefiks Keša</label>
            <input 
              type="text" 
              placeholder="npr. ad_... (Ostavite prazno za sve)"
              value={cachePrefix}
              onChange={(e) => setCachePrefix(e.target.value)}
              className="w-full bg-[#121921] border border-white/10 rounded px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-secondary transition-colors uppercase"
            />
          </div>

          <button
            onClick={() => handleClearCache(cachePrefix)}
            type="button"
            disabled={resetMutation.isPending}
            className="py-3 bg-secondary hover:bg-secondary/90 active:bg-secondary/80 text-slate-950 font-black text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(254,191,13,0.15)] disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {cachePrefix ? `IZBACI PREFIKS: ${cachePrefix}` : 'ISPRAZNI CELOKUPAN KEŠ'}
          </button>

          <button
            onClick={() => handleClearCache()}
            type="button"
            disabled={resetMutation.isPending}
            className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black text-xs uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            NUKLEARNI RESET KEŠA
          </button>
        </div>
      </div>
    </motion.div>
  );
}
