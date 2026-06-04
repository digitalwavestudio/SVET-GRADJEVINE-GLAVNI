import React from 'react';

interface NoResultsProps {
  message?: string;
  icon?: string;
}

export default function NoResults({ 
  message = "Trenutno nema rezultata za tražene kriterijume.",
  icon = "search_off" 
}: NoResultsProps) {
  return (
    <div className="col-span-full py-16 text-center bg-surface-container-lowest rounded-[10px] border border-white/5 flex flex-col items-center justify-center min-h-[400px] shadow-2xl">
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-6xl text-white/10" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
      </div>
      <h3 className="text-2xl font-black text-white/50 mb-3 uppercase tracking-tighter">Nema rezultata</h3>
      <p className="text-on-surface-variant text-base max-w-sm mx-auto font-medium">{message}</p>
    </div>
  );
}
