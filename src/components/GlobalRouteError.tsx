import { useRouteError } from "react-router-dom";
import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { getQuotaExceeded } from '@/src/lib/errorUtils';

export default function GlobalRouteError() {
  const error: any = useRouteError();
  console.error("Global Route Error:", error);
  
  const isQuota = getQuotaExceeded() || (error?.message || '').toLowerCase().includes('quota');

  if (isQuota) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6">
        <Activity className="w-16 h-16 text-amber-500 mb-4 opacity-80" />
        <h2 className="text-2xl font-bold text-on-surface mb-2">Sistem je pod neverovatnim opterećenjem</h2>
        <p className="text-on-surface/70 max-w-md mx-auto mb-6">
          Ograničen mod je aktivan zbog velikog broja korisnika. Molimo pokušajte ponovo za nekoliko minuta.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-amber-500 text-slate-900 rounded-[10px] font-black uppercase text-xs hover:bg-amber-400 transition-colors"
        >
          Pokušaj ponovo
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6">
      <ShieldAlert className="w-16 h-16 text-error mb-4 opacity-80" />
      <h2 className="text-2xl font-bold text-on-surface mb-2">Desila se greška</h2>
      <p className="text-on-surface/70 max-w-md mx-auto mb-6">
        {error?.statusText || error?.message || "Došlo je do neočekivane greške prilikom učitavanja ove stranice."}
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-[10px] font-medium hover:bg-primary/90 transition-colors"
      >
        Vrati se na početnu
      </button>
    </div>
  );
}
