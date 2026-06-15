import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface MyAdsHeaderProps {
  loading: boolean;
  onRefetch: () => void;
  localQuery: string;
  setLocalQuery: (val: string) => void;
  statusFilter: 'all' | 'active' | 'pending';
  setStatusFilter: (val: 'all' | 'active' | 'pending') => void;
}

export function MyAdsHeader({
  loading,
  onRefetch,
  localQuery,
  setLocalQuery,
  statusFilter,
  setStatusFilter,
}: MyAdsHeaderProps) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-1">MOJI OGLASI</h1>
          <div className="flex flex-wrap items-center gap-4 text-white/40 font-bold text-[10px] tracking-[0.2em] uppercase">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              UPRAVLJAJTE SVIM VAŠIM OBJAVAMA
            </span>
            <button 
              onClick={onRefetch}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-[10px] transition-all flex items-center gap-2 border border-white/10 group active:scale-95"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
              OSVEŽI
            </button>
          </div>
        </motion.div>

        <Link to="/postavi-oglas" className="bg-secondary text-slate-950 font-black px-8 py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 shadow-sm shadow-secondary/10">
          <span className="material-symbols-outlined">add</span>
          NOVI OGLAS
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[10px] p-6 flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20">search</span>
            <input 
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              type="text" 
              placeholder="Pretraži svoje oglase po naslovu ili firmi..." 
              className="w-full bg-white/5 border border-white/10 rounded-[10px] py-4 pl-12 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all" 
            />
        </div>
        <div className="flex bg-neutral-900/40 p-1 border border-white/5 rounded-[10px] gap-1 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 sm:py-3 rounded-[8px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-secondary text-slate-950 shadow-md shadow-secondary/10' : 'text-white/40 hover:text-white/80'}`}
            >
              Svi
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`flex-1 sm:flex-initial px-3 py-2 sm:px-5 sm:py-3 rounded-[8px] text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'active' ? 'bg-secondary text-slate-950 shadow-md shadow-secondary/10' : 'text-white/40 hover:text-white/80'}`}
            >
              Aktivni
            </button>
        </div>
      </div>
    </>
  );
}
