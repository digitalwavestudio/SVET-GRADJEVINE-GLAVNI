import { motion } from 'motion/react';
import React from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  newEvent: {
    day: number;
    title: string;
    type: 'interview' | 'site' | 'meeting' | 'phase' | 'payment' | 'bill';
  };
  setNewEvent: (event: any) => void;
  onConfirm: (alarm: boolean) => void;
}

export function PaymentModal({ isOpen, onClose, newEvent, setNewEvent, onConfirm }: PaymentModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex justify-center items-center p-4 bg-slate-950/90 backdrop-blur-2xl"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-lg bg-[#0A0F14] border border-white/10 rounded-[10px] p-10 shadow-2xl relative"
      >
          <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-[10px] cursor-pointer z-30">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-emerald-500/10 rounded-[10px] flex items-center justify-center text-emerald-500">
                <span className="material-symbols-outlined text-2xl">payments</span>
             </div>
             <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">UNOS ISPLATE</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Evidentiraj finansijski dan</p>
             </div>
          </div>

          <div className="space-y-6">
             <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 block">Datum Isplate</label>
                <input 
                  type="number" 
                  min="1" max="30"
                  value={newEvent.day}
                  onChange={(e) => setNewEvent({...newEvent, day: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-6 py-4 text-white font-black focus:border-emerald-500 outline-none transition-all"
                />
             </div>
             <div>
                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2 block">Iznos / Svrha</label>
                <input 
                  type="text" 
                  placeholder="npr. 1200€ - Armirači Sektor B"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value.toUpperCase()})}
                  className="w-full bg-white/5 border border-white/10 rounded-[10px] px-6 py-4 text-white font-black focus:border-emerald-500 outline-none transition-all"
                />
             </div>
             
             <button 
                onClick={() => {
                  const alarmCheckbox = document.getElementById('isplata_alarm') as HTMLInputElement;
                  onConfirm(alarmCheckbox?.checked || false);
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 rounded-[10px] text-xs tracking-widest uppercase transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
             >
                POTVRDI I DODAJ U KALENDAR
             </button>

             <div className="flex items-center gap-3 p-4 bg-white/5 rounded-[10px] border border-white/5">
                <input type="checkbox" id="isplata_alarm" className="w-5 h-5 accent-emerald-500" />
                <label htmlFor="isplata_alarm" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">AKTIVIRAJ ALARM ZA OVU ISPLATU</label>
             </div>
          </div>
      </motion.div>
    </motion.div>
  );
}
