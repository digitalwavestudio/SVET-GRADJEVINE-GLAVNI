import { motion } from 'motion/react';
import React from 'react';

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDay: number | null;
  currentMonthLabel: string;
  localDiaryText: string;
  handleDiaryChange: (val: string) => void;
  onSave: () => void;
}

export function DiaryModal({
  isOpen,
  onClose,
  selectedDay,
  currentMonthLabel,
  localDiaryText,
  handleDiaryChange,
  onSave
}: DiaryModalProps) {
  if (!isOpen || selectedDay === null) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex justify-center items-center p-4 bg-slate-950/90 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl bg-[#0A0F14] border border-white/10 rounded-[10px] overflow-hidden shadow-2xl relative"
      >
        <div className="absolute top-0 right-0 p-8 z-20">
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-[10px] p-2 flex items-center justify-center cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-10 lg:p-14">
          <div className="flex items-center gap-6 mb-12">
              <div className="w-16 h-16 bg-secondary/10 border border-secondary/20 rounded-[10px] flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[32px]">history_edu</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">GRAĐEVINSKI DNEVNIK</h3>
                <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">EVIDENCIJA ZA {selectedDay}. {currentMonthLabel}</p>
              </div>
          </div>

          <div className="space-y-8">
            <div>
                <label className="text-[9px] font-black tracking-[0.2em] text-white/20 uppercase block mb-4">Dnevni Zapisnik Radova</label>
                <textarea 
                  value={localDiaryText}
                  onChange={(e) => handleDiaryChange(e.target.value)}
                  placeholder="Unesite opis radova, utrošak resursa ili specifične napomene..."
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-[10px] p-6 text-white text-sm font-medium focus:border-secondary transition-all outline-none resize-none placeholder:text-white/10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[10px]">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">RADNA SNAGA</span>
                  <div className="text-xl font-black text-white">8 <span className="text-[10px] opacity-40">RADNIKA</span></div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[10px] border-b-secondary/40">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">MATERIJAL</span>
                  <div className="text-xl font-black text-white">12t <span className="text-[10px] opacity-40">CEMENTA</span></div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[10px]">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-2">MEHANIZACIJA</span>
                  <div className="text-xl font-black text-white">2 <span className="text-[10px] opacity-40">MAŠINE</span></div>
                </div>
            </div>
          </div>

          <div className="mt-12 pt-10 border-t border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-sm">auto_awesome</span>
                </div>
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">AI PAMETNA ANALIZA AKTIVNA</span>
            </div>
            <button 
              onClick={() => {
                onSave();
                onClose();
              }}
              className="bg-secondary text-slate-950 font-black uppercase tracking-widest text-[11px] py-4 px-10 rounded-[10px] transition-all shadow-[0_0_30px_rgba(247,150,26,0.2)] hover:shadow-[0_0_40px_rgba(247,150,26,0.4)]"
            >
              SAČUVAJ DNEVNIK
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
