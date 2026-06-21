import { useEffect, useState, useRef } from 'react';
import { useNetworkStatus } from '@/src/hooks/useNetworkStatus';

export default function NetworkStatus() {
  const { isOffline, isQuotaExceeded } = useNetworkStatus();
  const [showResolved, setShowResolved] = useState(false);
  const prevOfflineRef = useRef(isOffline);
  const [visible, setVisible] = useState(false);

  const show = isOffline || showResolved || isQuotaExceeded;

  useEffect(() => {
    if (show) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (prevOfflineRef.current && !isOffline) {
      setShowResolved(true);
      const timer = setTimeout(() => setShowResolved(false), 3000);
      return () => clearTimeout(timer);
    }
    prevOfflineRef.current = isOffline;
  }, [isOffline]);

  if (!visible) return null;

  return (
    <div
      style={{ left: '50%' }}
      className={`fixed bottom-6 z-[999] px-6 py-3.5 rounded-[12px] border shadow-2xl backdrop-blur-xl flex items-center justify-center gap-3 max-w-md w-[calc(100%-2rem)] transition-all duration-300 ${
        show
          ? 'translate-y-0 opacity-100'
          : 'translate-y-16 opacity-0 pointer-events-none'
      } ${
        isQuotaExceeded 
          ? 'bg-[#180A05]/95 text-orange-500 border-orange-500/30' 
          : isOffline 
            ? 'bg-[#140505]/95 text-red-500 border-red-500/30 shadow-red-950/25' 
            : 'bg-[#05140A]/95 text-emerald-500 border-emerald-500/30'
      }`}
    >
      <div className="flex items-center justify-center relative">
        <span className={`material-symbols-outlined text-lg ${
          isOffline ? 'animate-pulse' : ''
        }`}>
          {isQuotaExceeded ? 'cloud_off' : (isOffline ? 'wifi_off' : 'wifi')}
        </span>
        {isOffline && (
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75 animate-ping -top-1 -right-1"></span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-black text-[10px] tracking-[0.2em] uppercase leading-none mb-1">
          {isQuotaExceeded ? 'OPTEREĆENJE SISTEMA' : (isOffline ? 'KONEKCIJA IZGUBLJENA' : 'KONEKCIJA VRAĆENA')}
        </span>
        <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest leading-none">
          {isQuotaExceeded 
            ? 'Pristup bazi je privremeno limitiran.' 
            : (isOffline 
              ? 'Sve destruktivne i administrativne akcije su stopirane.' 
              : 'Sistem je online i sinhronizovan.')}
        </span>
      </div>
    </div>
  );
}
