import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/src/components/ui/Card';

interface SystemStatusWidgetProps {
  internals: {
    circuits: Record<string, string>;
    queues: Record<string, { active: number; waiting: number; completed: number; failed: number }>;
    lastUpdated: string;
  };
}

export function SystemStatusWidget({ internals }: SystemStatusWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!internals) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-white/10 rounded-full hover:bg-slate-800 transition-all group"
      >
        <span className="material-symbols-outlined text-sm text-secondary animate-pulse">monitoring</span>
        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">Sistemski Status</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full right-0 mb-4 w-[400px] z-[70]"
            >
              <Card padding="lg">
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">KONTROLNI CENTAR</h4>
                    <span className="text-[8px] font-mono text-white/30 uppercase">Poslednje osvežavanje: {new Date(internals.lastUpdated).toLocaleTimeString()}</span>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-secondary uppercase tracking-widest">CIRCUIT BREAKERS</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(internals.circuits).map(([name, status]) => (
                        <div key={name} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                          <span className="text-[10px] font-bold text-white/60 uppercase">{name}</span>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${status === 'CLOSED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                             <span className={`text-[9px] font-black uppercase ${status === 'CLOSED' ? 'text-emerald-500' : 'text-red-500'}`}>{status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-[9px] font-black text-secondary uppercase tracking-widest">BULLMQ QUEUES</h5>
                    <div className="space-y-2">
                      {Object.entries(internals.queues).map(([name, stats]) => (
                        <div key={name} className="p-3 bg-white/5 rounded-lg border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-white uppercase tracking-tight">{name}</span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">REAL-TIME</span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-white/30 uppercase">Active</span>
                              <span className={`text-[10px] font-black ${stats.active > 0 ? 'text-blue-400' : 'text-white/60'}`}>{stats.active}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-white/30 uppercase">Waiting</span>
                              <span className="text-[10px] font-black text-white/60">{stats.waiting}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-white/30 uppercase">Done</span>
                              <span className="text-[10px] font-black text-emerald-500/60">{stats.completed}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black text-white/30 uppercase">Failed</span>
                              <span className={`text-[10px] font-black ${stats.failed > 0 ? 'text-red-500' : 'text-white/60'}`}>{stats.failed}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Zatvori Nadzor
                  </button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
