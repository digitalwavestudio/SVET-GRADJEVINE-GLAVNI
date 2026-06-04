import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';

export default function WorkLogPage() {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftTime, setShiftTime] = useState(0);

  // Timer simulation
  useEffect(() => {
    let interval: any;
    if (isShiftActive) {
      interval = setInterval(() => {
        setShiftTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isShiftActive]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const logs = [
    { date: 'Danase, 15. April', status: 'ZAVRŠENO', hours: '8h 30m', location: 'Gradilište Blok 45', hasPhoto: true },
    { date: 'Utorak, 14. April', status: 'ZAVRŠENO', hours: '9h 15m', location: 'Gradilište Blok 45', hasPhoto: true },
    { date: 'Ponedeljak, 13. April', status: 'ZAVRŠENO', hours: '8h 00m', location: 'Gradilište Blok 45', hasPhoto: false },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">DNEVNIK RADOVA</h1>
          <p className="text-white/40 font-bold text-xs tracking-[0.2em] uppercase">EVIDENCIJA RADNOG VREMENA I LOKACIJE</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action - Clock In / Clock Out */}
          <div className="lg:col-span-1 bg-[#0A0F14] border border-white/5 rounded-[10px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
            {isShiftActive && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-green-500 rounded-full blur-[100px] pointer-events-none"
              />
            )}
            
            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-8">TRENUTNI STATUS</div>
            
            <div className="text-6xl font-black tracking-tighter tabular-nums mb-2">
              {formatTime(shiftTime)}
            </div>
            <div className="text-xs font-bold text-secondary uppercase tracking-widest mb-10">
              {isShiftActive ? 'SMENA U TOKU' : 'SPREMAN ZA RAD'}
            </div>

            <button 
              onClick={() => setIsShiftActive(!isShiftActive)}
              className={`w-full py-6 rounded-[10px] text-xs font-black tracking-[0.2em] uppercase transition-all shadow-2xl ${
                isShiftActive 
                  ? 'bg-error text-white shadow-error/20 hover:bg-red-600' 
                  : 'bg-green-500 text-slate-950 shadow-green-500/20 hover:bg-green-400'
              }`}
            >
              {isShiftActive ? 'ZAVRŠI SMENU' : 'ZAPOČNI SMENU'}
            </button>

            {isShiftActive && (
              <button className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest w-full py-4 border border-white/5 rounded-[10px] bg-white/5 hover:bg-white/10 transition-all">
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                DODAJ FOTOGRAFIJU SA GRADILIŠTA
              </button>
            )}
          </div>

          {/* Stats & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">OVA NEDELJA</div>
                <div className="text-4xl font-black text-white mb-1">32h 45m</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest">+4h u odnosu na proslu</div>
                <span className="material-symbols-outlined w-32 h-32 absolute -right-6 -bottom-6 text-white/5 pointer-events-none" style={{ fontSize: '128px' }}>schedule</span>
              </div>
              <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative overflow-hidden">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">ZARADA (PROJEKCIJA)</div>
                <div className="text-4xl font-black text-white mb-1">~540 EUR</div>
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest">Ažurirano pre 1 sat</div>
                <span className="material-symbols-outlined w-32 h-32 absolute -right-6 -bottom-6 text-white/5 pointer-events-none" style={{ fontSize: '128px' }}>payments</span>
              </div>
            </div>

            {/* Log History */}
            <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">ISTORIJA SMENA</h3>
                <button className="text-[10px] font-black text-white/40 hover:text-secondary uppercase tracking-widest transition-colors flex items-center gap-1">
                  PREUZMI IZVEŠTAJ <span className="material-symbols-outlined text-sm">download</span>
                </button>
              </div>

              <div className="space-y-4">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 rounded-[10px] border border-white/5 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider">{log.date}</div>
                        <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[12px] text-secondary">location_on</span>
                          GPS Verifikovano: {log.location}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">UKUPNO</div>
                        <div className="text-sm font-black text-secondary">{log.hours}</div>
                      </div>
                      {log.hasPhoto ? (
                        <button className="w-10 h-10 rounded-[10px] bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all" title="Prikaži dokazni snimak">
                          <span className="material-symbols-outlined text-sm">image</span>
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-[10px] bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-white/20" title="Nema fotografije">
                          <span className="material-symbols-outlined text-sm">image_not_supported</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
