import React from 'react';

interface AdminLaunchGuardProps {
  launchMode: boolean;
  toggleLaunchMode: () => void;
  isUpdatingLaunchMode: boolean;
}

export function AdminLaunchGuard({
  launchMode,
  toggleLaunchMode,
  isUpdatingLaunchMode
}: AdminLaunchGuardProps) {
  return (
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-[10px] p-8 flex items-center justify-between">
       <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-[10px] flex items-center justify-center animate-pulse">
             <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
          </div>
          <div>
             <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
               LANSIRANJE APLIKACIJE: {launchMode ? 'OTVORENO' : 'ZATVORENO - SAMO ZA PARTNERE'}
             </h3>
             <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Ova opcija dozvoljava ili blokira prijavu novih korisnika na platformu.</p>
          </div>
       </div>
       <button 
         onClick={toggleLaunchMode}
         disabled={isUpdatingLaunchMode}
         className={`px-8 py-4 rounded-[10px] text-xs font-black uppercase tracking-widest transition-all ${
            launchMode 
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]' 
            : 'bg-green-500 hover:bg-green-600 !text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
         }`}
       >
         {isUpdatingLaunchMode ? 'AŽURIRANJE...' : (launchMode ? 'ZATVORI REGISTRACIJE' : 'OTVORI REGISTRACIJE')}
       </button>
    </div>
  );
}
