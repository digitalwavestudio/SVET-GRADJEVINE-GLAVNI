import { useRouteError } from 'react-router-dom';
import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { getQuotaExceeded } from '@/src/lib/errorUtils';

const CHUNK_RELOAD_KEY = '__svet_chunk_reload';
const CHUNK_RELOAD_WINDOW_MS = 10000;
const MAX_RELOADS = 3;

export default function GlobalRouteError() {
  const error: any = useRouteError();
  console.error('Global Route Error:', error);

  const errorMsg = (error?.message || '').toString();
  const isQuota = getQuotaExceeded() || errorMsg.toLowerCase().includes('quota');
  const isChunkError = /dynamically imported module|chunkloaderror|failed to fetch dynamically/i.test(errorMsg);

  React.useEffect(() => {
    if (!isChunkError) return;

    try {
      const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
      const now = Date.now();
      let record = raw ? JSON.parse(raw) : { lastTime: 0, count: 0 };

      if (now - record.lastTime > CHUNK_RELOAD_WINDOW_MS) {
        record = { lastTime: now, count: 0 };
      }

      if (record.count < MAX_RELOADS) {
        record.count += 1;
        record.lastTime = now;
        sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(record));
        setTimeout(() => window.location.reload(), 300 + record.count * 200);
      } else {
        console.warn('Exceeded chunk reload attempts; not reloading further.');
      }
    } catch (e) {
      console.warn('Chunk reload logic failed:', e);
    }
  }, [isChunkError]);

  if (isChunkError) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-on-surface/70">Ažuriranje aplikacije u toku...</p>
      </div>
    );
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
        {error?.statusText || error?.message || 'Došlo je do neočekivane greške prilikom učitavanja ove stranice.'}
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
