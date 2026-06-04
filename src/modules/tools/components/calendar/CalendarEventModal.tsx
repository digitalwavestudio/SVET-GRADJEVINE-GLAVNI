import { motion, AnimatePresence } from 'motion/react';
import React from 'react';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  newEvent: {
    day: number;
    title: string;
    type: 'interview' | 'site' | 'meeting' | 'phase' | 'payment' | 'bill';
  };
  setNewEvent: (event: any) => void;
  currentMonthLabel: string;
  onAddEvent: (hasAlarm: boolean) => void;
}

export function CalendarEventModal({
  isOpen,
  onClose,
  newEvent,
  setNewEvent,
  currentMonthLabel,
  onAddEvent
}: CalendarEventModalProps) {
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
        className="w-full max-w-xl bg-[#0A0F14] border border-white/10 rounded-[10px] p-10 lg:p-14 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-[10px] cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-[10px] flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[32px]">more_time</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">ZAKAŽI AKTIVNOST</h3>
              <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">Direktno dodavanje u poslovni kalendar</p>
            </div>
        </div>

        <div className="space-y-6">
            <div>
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Vrsta Događaja</label>
              <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'interview', label: 'INTERVJU', icon: 'chat' },
                    { type: 'site', label: 'OBILAZAK', icon: 'location_on' },
                    { type: 'meeting', label: 'SASTANAK', icon: 'groups' },
                    { type: 'payment', label: 'ISPLATA', icon: 'payments' }
                  ].map((item) => (
                    <button 
                      key={item.type}
                      onClick={() => setNewEvent({ ...newEvent, type: item.type as any })}
                      className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all text-left ${
                        newEvent.type === item.type ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{item.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Naziv i Napomena</label>
              <input 
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value.toUpperCase() })}
                placeholder="NPR: INTERVJU - ARMIRAČ MARKO"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-[10px] text-white text-xs font-black tracking-widest outline-none focus:border-secondary transition-all placeholder:text-white/10"
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] block mb-3">Datum ({currentMonthLabel})</label>
              <input 
                type="number"
                min="1"
                max="30"
                value={newEvent.day}
                onChange={(e) => setNewEvent({ ...newEvent, day: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 p-5 rounded-[10px] text-white text-xs font-black tracking-widest outline-none focus:border-secondary"
              />
            </div>

            <div className="flex items-center gap-3 p-5 bg-white/5 rounded-[10px] border border-white/5">
              <input 
                type="checkbox" 
                id="event_alarm_check" 
                className="w-5 h-5 accent-secondary" 
              />
              <label htmlFor="event_alarm_check" className="text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">AKTIVIRAJ ALARM ZA OVU AKTIVNOST</label>
            </div>
        </div>

          <button 
          onClick={() => {
            if (!newEvent.title) return;
            const alarmCheckbox = document.getElementById('event_alarm_check') as HTMLInputElement;
            onAddEvent(alarmCheckbox?.checked || false);
          }}
          className="w-full bg-secondary text-slate-950 font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-[10px] mt-12 transition-all shadow-[0_0_40px_rgba(247,150,26,0.3)] hover:shadow-[0_0_50px_rgba(247,150,26,0.5)]"
        >
          DODAJ U KALENDAR
        </button>
      </motion.div>
    </motion.div>
  );
}
