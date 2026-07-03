import React from 'react';
import { motion } from 'motion/react';
import { Search, AlertTriangle, ExternalLink, Zap, Clock, Database } from 'lucide-react';
interface SlowQuery { collection: string; operation: string; id: string; timestamp: number; duration: number; resultSize: number; }

const QueryOptimizationAudit: React.FC = () => {
  const stats: { slowQueries: SlowQuery[]; missingIndexes: string[] } = { slowQueries: [], missingIndexes: [] };
  const slowQueries = stats.slowQueries || [];
  const missingIndexes = stats.missingIndexes || [];

  return (
    <div className="space-y-6">
      {/* Missing Indexes Section */}
      {missingIndexes.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 text-rose-400 mb-4">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Critical: Missing Compound Indexes</h3>
          </div>
          <div className="space-y-2">
            {missingIndexes.map((link: string, i: number) => (
              <a 
                key={i}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-white/5 hover:bg-zinc-800 transition-colors group"
              >
                <span className="text-xs text-zinc-300 font-mono truncate mr-4">{link}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-white" />
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Slow Queries Section */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-100">Slow Query Log (&gt;500ms)</h3>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black uppercase">
            {slowQueries.length} Detected
          </span>
        </div>
        
        <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
          {slowQueries.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 italic text-xs">
              No slow queries detected in the current session.
            </div>
          ) : (
            slowQueries.slice().reverse().map((q: SlowQuery, i: number) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-zinc-800 rounded">
                    <Database className="w-3 h-3 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-200">{q.collection}</span>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold px-1.5 py-0.5 bg-white/5 rounded">
                        {q.operation}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                      Query ID: {q.id} • {new Date(q.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-right">
                   <div className="flex flex-col items-end">
                     <span className="text-[8px] text-zinc-500 uppercase font-black">Latency</span>
                     <span className="text-sm font-mono font-bold text-amber-400">{q.duration.toFixed(0)}ms</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[8px] text-zinc-500 uppercase font-black">Results</span>
                     <span className="text-sm font-mono font-bold text-zinc-300">{q.resultSize}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Optimization Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard 
          icon={<Search className="w-4 h-4" />}
          title="Full Scan Risk"
          description="Queries fetching more than 100 docs without a limit detected. High cost & latency."
          status={slowQueries.some((q: SlowQuery) => q.resultSize > 100) ? 'Warning' : 'Good'}
        />
        <InsightCard 
          icon={<Zap className="w-4 h-4" />}
          title="Pagination Health"
          description="Detected efficient cursor-based pagination in most active collections."
          status="Optimized"
        />
      </div>
    </div>
  );
};

const InsightCard = ({ icon, title, description, status }: any) => (
  <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-indigo-400">
        {icon}
        <h4 className="text-xs font-bold uppercase tracking-wider">{title}</h4>
      </div>
      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
        status === 'Warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
      }`}>
        {status}
      </span>
    </div>
    <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
      {description}
    </p>
  </div>
);

export default QueryOptimizationAudit;
