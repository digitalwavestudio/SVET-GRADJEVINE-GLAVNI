import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Activity, Zap, ShieldAlert, CheckCircle2, ChevronRight, BarChart3, Clock, LineChart } from 'lucide-react';
import { firestoreTelemetry } from '@/src/lib/firestoreTelemetry';
import QueryOptimizationAudit from './QueryOptimizationAudit';

const FirestoreObservability: React.FC = () => {
  const [data, setData] = useState(() => {
    const stats = firestoreTelemetry.getSnapshot();
    return buildAudit(stats);
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'queries'>('overview');

  useEffect(() => {
    const interval = setInterval(() => {
      const stats = firestoreTelemetry.getSnapshot();
      setData(buildAudit(stats));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const health = data.metrics.fs;
  const statusColor = data.status === 'HEALTHY' ? 'text-emerald-500' : 
                      data.status === 'WARNING' ? 'text-amber-500' : 'text-rose-500';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden backdrop-blur-xl"
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Firestore Telemetry</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] uppercase font-black tracking-tighter ${statusColor}`}>
                {data.status}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono italic">
                Updated {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 pr-4 border-r border-white/5">
             <MetricMini label="Reads" value={health.reads} color="text-blue-400" />
             <MetricMini label="Hits" value={`${(health.cacheHitRate * 100).toFixed(0)}%`} color="text-emerald-400" />
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="border-t border-white/5"
          >
            <div className="flex border-b border-white/5 bg-zinc-950/20 px-6">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'overview' ? 'text-indigo-400 border-indigo-400' : 'text-zinc-500 border-transparent'
                }`}
              >
                <Activity className="w-3 h-3" />
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('queries')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'queries' ? 'text-indigo-400 border-indigo-400' : 'text-zinc-500 border-transparent'
                }`}
              >
                <Clock className="w-3 h-3" />
                Query Auditor
              </button>

            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Reads Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Efficiency</span>
                    </div>
                    <div className="bg-zinc-950/50 p-4 rounded-lg border border-white/5 space-y-3">
                      <DetailRow label="Total Reads" value={health.reads} />
                      <DetailRow label="Cache Hits" value={`${(health.cacheHitRate * 100).toFixed(1)}%`} />
                      <div className="pt-2">
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${health.cacheHitRate * 100}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Active State</span>
                    </div>
                    <div className="bg-zinc-950/50 p-4 rounded-lg border border-white/5 space-y-3">
                      <DetailRow label="Active Listeners" value={health.activeListeners} />
                      <DetailRow label="Writes Recorded" value={health.writes} />
                      <DetailRow label="N+1 Risk" value={health.isAbusive ? 'HIGH' : 'LOW'} 
                             valueColor={health.isAbusive ? 'text-rose-400' : 'text-emerald-400'} />
                    </div>
                  </div>

                  {/* Audit AI Recommendation */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">AI Audit</span>
                    </div>
                    <div className="bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10 h-full">
                      <p className="text-xs text-zinc-300 leading-relaxed italic">
                        "{health.potentialOptimization}"
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Real-time optimization engine active</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'queries' && <QueryOptimizationAudit />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

function buildAudit(stats: any) {
  const isAbusive = stats.reads > 500;
  const slowCount = stats.slowQueries?.length || 0;
  const missingIndexCount = stats.missingIndexes?.length || 0;
  let advice = 'Optimal performance detected.';
  if (isAbusive) advice = 'Critical: High read volume detected. Check for infinite loops or missing cache.';
  else if (slowCount > 0) advice = 'Slow queries detected. Consider adding missing indexes or optimizing filters.';
  else if (missingIndexCount > 0) advice = 'Missing compound indexes. Check the Query Auditor for direct Google Console links.';

  const health = {
    reads: stats.reads,
    writes: stats.writes,
    activeListeners: stats.listeners,
    cacheHitRate: stats.reads > 0 ? (stats.cacheHits / stats.reads) : 1,
    isAbusive,
    slowQueries: slowCount,
    missingIndexes: missingIndexCount,
    potentialOptimization: advice
  };

  return {
    timestamp: new Date().toISOString(),
    status: isAbusive ? 'WARNING' : 'HEALTHY',
    metrics: { fs: health }
  };
}

const MetricMini = ({ label, value, color }: any) => (
  <div className="flex flex-col items-end">
    <span className="text-[8px] text-zinc-500 uppercase font-black leading-none mb-1">{label}</span>
    <span className={`text-xs font-mono font-bold ${color}`}>{value}</span>
  </div>
);

const DetailRow = ({ label, value, valueColor = 'text-zinc-100' }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-zinc-500 uppercase font-bold">{label}</span>
    <span className={`text-xs font-mono ${valueColor}`}>{value}</span>
  </div>
);

export default FirestoreObservability;
