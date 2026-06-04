import React from 'react';
import { motion } from 'motion/react';
import { useAdminStats } from '@/src/modules/admin/hooks/useAdminStats';

export function HousekeepingStatus() {
  const { data } = useAdminStats();
  const housekeeping = data?.housekeeping;

  if (!housekeeping) return null;

  const tasks = [
    { name: 'Archive Service', key: 'archiveDeletedAds', icon: 'archive' },
    { name: 'Algolia Sync', key: 'cleanupAlgoliaOrphans', icon: 'sync' },
    { name: 'Stats Reconcile', key: 'reconcileGlobalStats', icon: 'analytics' }
  ];

  return (
    <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 mt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Sistem Housekeeping</h3>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Status pozadinskih procesa održavanja</p>
        </div>
        <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Sistem Aktivan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const status = housekeeping[task.key];
          const lastRun = status?.lastRun ? new Date(status.lastRun._seconds * 1000).toLocaleString('sr-RS') : 'N/A';
          const isError = status?.status === 'error';

          return (
            <div key={task.key} className="bg-white/5 rounded-[10px] p-6 border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-[10px] ${isError ? 'bg-red-500/10 text-red-500' : 'bg-secondary/10 text-secondary'}`}>
                  <span className="material-symbols-outlined">{task.icon}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-[10px] uppercase tracking-widest ${isError ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                   {isError ? 'Greška' : 'Uspešno'}
                </span>
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{task.name}</h4>
              <p className="text-[10px] text-white/40 font-bold mb-4 uppercase tracking-tighter">Poslednje: {lastRun}</p>
              
              {status?.result && (
                 <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                   {Object.entries(status.result).slice(0, 3).map(([k, v]: [string, any]) => (
                     <div key={k} className="bg-white/5 px-2 py-1 rounded text-[9px] font-black text-white/50 uppercase tracking-tighter">
                        {k}: {typeof v === 'object' ? '...' : v}
                     </div>
                   ))}
                 </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
