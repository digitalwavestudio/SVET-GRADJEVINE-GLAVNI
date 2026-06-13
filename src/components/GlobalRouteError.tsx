import { useRouteError } from "react-router-dom";
import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { getQuotaExceeded } from '@/src/lib/errorUtils';

export default function GlobalRouteError() {
  const error: any = useRouteError();
  console.error("Global Route Error:", error);
  
  const errorMsg = error?.message || '';
  const isQuota = getQuotaExceeded() || errorMsg.toLowerCase().includes('quota');
  const isChunkError = errorMsg.toLowerCase().includes('dynamically imported module') || 
                       errorMsg.toLowerCase().includes('chunkloaderror') || 
                       errorMsg.toLowerCase().includes('failed to fetch dynamically');

  if (isChunkError) {
    const lastReload = sessionStorage.getItem('chunk_error_reload');
    const now = Date.now();
    // Ako nismo reload-ovali u poslednjih 10 sekundi, reload-uj ponovo
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('chunk_error_reload', now.toString());
      window.location.reload();
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-on-surface/70">Ažuriranje aplikacije u toku...</p>
        </div>
      );
    }
  }

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
