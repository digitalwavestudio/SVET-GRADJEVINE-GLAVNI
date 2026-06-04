import { useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Match {
  id: string;
  title: string;
  subtitle: string;
  matchRate: number;
  image?: string;
}

interface SmartMatchesProps {
  type: 'jobs' | 'masters';
  matches: Match[];
}

export default function SmartMatches({ type, matches = [] }: SmartMatchesProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Approximate height of each match row
    overscan: 5,
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 group flex flex-col h-[500px]"
    >
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">PAMETNO SPAJANJE</h3>
          <div className="text-2xl font-black text-white tracking-tighter uppercase">
            PREPORUČENI <span className="text-secondary">{type === 'jobs' ? 'POSLOVI' : 'MAJSTORI'}</span>
          </div>
        </div>
        <div className="w-10 h-10 bg-secondary/10 rounded-[10px] flex items-center justify-center">
          <span className="material-symbols-outlined text-secondary">auto_awesome</span>
        </div>
      </div>

      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pr-2"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const match = matches[virtualItem.index];
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
                className="py-2"
              >
                <Link 
                  to={type === 'jobs' ? `/poslovi/${match.id}` : `/majstori/${match.id}`}
                  className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[10px] hover:bg-white/5 hover:border-white/10 transition-all group/match h-full"
                >
                  <div className="w-12 h-12 rounded-[10px] bg-white/5 border border-white/10 overflow-hidden shrink-0">
                    {match.image ? (
                      <img width="800" height="600" decoding="async" src={match.image} alt="Slika" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/20">
                          {type === 'jobs' ? 'work' : 'person'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight group-hover/match:text-secondary transition-colors truncate">
                      {match.title}
                    </h4>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest truncate">{match.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-black text-green-500">{match.matchRate}%</div>
                    <div className="text-[8px] font-black text-white/20 uppercase tracking-tighter">MATCH</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <button className="w-full mt-6 py-4 border border-white/5 text-white/40 text-[9px] font-black rounded-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all shrink-0">
        POGLEDAJ SVE PREPORUKE
      </button>
    </motion.div>
  );
}
