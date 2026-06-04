import { motion } from 'motion/react';
import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAuth } from '@/src/context/AuthContext';
import { useActivitiesFeed } from '@/src/hooks/useActivitiesFeed';

const ActivityFeed = memo(function ActivityFeed() {
  const { user } = useAuth();
  const { activities, loadMoreActivities, isLoading } = useActivitiesFeed(user?.id);

  if (isLoading && activities.length === 0) {
     return <div className="animate-pulse flex items-center justify-center p-12"><div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!activities || activities.length === 0) {
      return (
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 md:p-12 text-center flex flex-col items-center gap-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center relative shadow-sm">
                <span className="material-symbols-outlined text-3xl text-secondary">radar</span>
              </div>
              
              <div className="space-y-2 relative z-10">
                <h3 className="text-white text-sm font-black uppercase tracking-widest">SISTEM JE U PRIPRAVNOSTI</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">
                  TRENUTNO NEMA NOVIH AKTIVNOSTI ZA VAŠ PROFIL.
                </p>
              </div>

              <button onClick={() => window.location.reload()} className="mt-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest px-6 py-3 rounded-[10px] transition-all flex items-center gap-2 group-hover:border-secondary/30 relative z-10">
                <span className="material-symbols-outlined text-[14px]">refresh</span> OSVEŽI STATUS
              </button>
          </div>
      );
  }

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // Estimated height per item (40px icon + padding/margin = ~70px)
    overscan: 5,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          loadMoreActivities();
        }, 300);
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadMoreActivities]);

  return (
    <div 
      ref={parentRef} 
      className="relative max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth pr-2"
    >
      {/* Timeline Line */}
      <div className="absolute left-5 top-2 bottom-2 w-px bg-white/5"></div>
      
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const activity = activities[virtualItem.index];
          return (
            <motion.div 
              key={virtualItem.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="flex gap-4 group cursor-pointer relative z-10 py-3"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-[10px] bg-slate-950 border border-white/10 flex items-center justify-center group-hover:border-secondary transition-all shadow-sm">
                  <span className={`material-symbols-outlined ${activity.color} group-hover:scale-110 transition-all text-xl`}>{activity.icon}</span>
                </div>
                {activity.time === 'SADA' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-950 animate-pulse"></span>
                )}
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-tight group-hover:text-secondary transition-colors truncate pr-2">
                    {activity.user}
                  </h4>
                  <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest ${activity.time === 'SADA' ? 'text-blue-400' : 'text-white/20'}`}>
                    {activity.time}
                  </span>
                </div>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-normal line-clamp-2">
                  {activity.action}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

export default ActivityFeed;
