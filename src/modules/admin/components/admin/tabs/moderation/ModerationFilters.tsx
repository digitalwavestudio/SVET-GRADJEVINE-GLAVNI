import React from 'react';

interface ModerationFiltersProps {
  pendingCount: number;
  localQuery: string;
  setLocalQuery: (query: string) => void;
  onRefresh: () => void;
}

export function ModerationFilters({ pendingCount, localQuery, setLocalQuery, onRefresh }: ModerationFiltersProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-[10px] p-8 flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-red-500/10 rounded-[10px] flex items-center justify-center border border-red-500/20">
          <span className="material-symbols-outlined text-red-500 text-3xl">queue</span>
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight">QUEZA ZA ODOBRAVANJE</h3>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{pendingCount} OGLASA ČEKA NA VAŠU ODLUKE</p>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-lg">search</span>
          <input 
            aria-label="Unos polja za pretragu" 
            type="text" 
            placeholder="Pretraži..." 
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-[10px] py-3 pl-12 pr-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-secondary transition-all w-64" 
          />
        </div>
        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all">FILTRIRAJ</button>
        <button 
          onClick={onRefresh}
          className="px-6 py-3 bg-secondary !text-black rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          OSVEŽI RED
        </button>
      </div>
    </div>
  );
}
