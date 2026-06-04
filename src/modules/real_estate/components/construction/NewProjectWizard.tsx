import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

interface NewProjectWizardProps {
  isOpen: boolean;
  onClose: () => void;
  step: number;
  setStep: (step: number) => void;
  onConfirm: () => void;
}

export const NewProjectWizard = React.memo(function NewProjectWizard({ isOpen, onClose, step, setStep, onConfirm }: NewProjectWizardProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex justify-center items-center p-4 md:p-8 bg-[#030507]/95 backdrop-blur-xl"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-4xl bg-[#0A0F14] border border-white/10 rounded-[10px] overflow-hidden shadow-[0_0_100px_rgba(255,204,0,0.05)] relative flex flex-col min-h-[70vh] max-h-[90vh]"
      >
        {/* Header Oblačić */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="flex items-center justify-between p-8 md:p-10 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center text-secondary shadow-inner">
                <span className="material-symbols-outlined text-[32px]">domain_add</span>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-headline font-black text-white uppercase tracking-tighter">POKRETANJE NOVOG PROJEKTA</h3>
              <p className="text-xs md:text-sm font-bold text-white/40 uppercase tracking-widest mt-1">WIZARD ZA INICIJALIZACIJU GRADILIŠTA</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-[10px] p-3 flex items-center justify-center cursor-pointer shadow-lg">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* STEPS INDICATOR LOGIC */}
        <div className="flex px-10 py-8 border-b border-white/5 relative z-10 bg-[#070B0F]/50">
          <div className="flex items-center w-full gap-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-3 relative">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-black transition-all duration-500 z-10 ${step >= s ? 'bg-secondary text-slate-900 shadow-[0_0_20px_rgba(255,204,0,0.4)] scale-110' : 'bg-[#131920] text-white/30 border-2 border-white/5'}`}>
                    {step > s ? <span className="material-symbols-outlined text-[20px]">check</span> : s}
                  </div>
                  <span className={`absolute top-14 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${step >= s ? 'text-white' : 'text-white/30'}`}>
                    {s === 1 ? 'OSNOVNI PODACI' : s === 2 ? 'LJUDSKI RESURSI' : 'LANSIRE STANJE'}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded-full transition-all duration-700 ease-out mb-5 ${step > s ? 'bg-secondary' : 'bg-white/5'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* WIZARD CONTENT BOX */}
        <div className="p-8 md:p-12 flex-1 relative z-10 overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col justify-center max-w-2xl mx-auto">
              <h4 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 border-l-4 border-secondary pl-4">
                <span className="text-secondary text-xs align-top">01 //</span> OSNOVNI PODACI SISTEMA
              </h4>
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-3 block">Radni Naziv Gradilišta</label>
                  <input aria-label="Unos polja" type="text" placeholder="Npr. BW VISTA Faza 2" className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-6 py-5 text-lg font-black text-white uppercase tracking-wider outline-none focus:border-secondary focus:bg-white/[0.02] focus:shadow-[0_0_30px_rgba(255,204,0,0.05)] transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-3 block">Tačna Lokacija / Parcela</label>
                  <div className="relative group">
                      <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-secondary transition-colors text-[24px]">location_on</span>
                      <input aria-label="Unos polja" type="text" placeholder="Unesite adresu ili katastarsku parcelu" className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] pl-16 pr-6 py-5 text-sm font-medium text-white/80 outline-none focus:border-white/30 focus:bg-white/[0.02] transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-3 block">Planirani Budžet</label>
                    <div className="relative flex items-center bg-[#070B0F] border border-white/10 rounded-[10px] px-6 py-5 focus-within:border-secondary focus-within:bg-white/[0.02] focus-within:shadow-[0_0_30px_rgba(255,204,0,0.05)] transition-all">
                        <input aria-label="Unos polja" type="number" placeholder="0" className="w-full bg-transparent font-mono text-2xl font-black text-white outline-none" />
                        <span className="text-xs font-black text-white/30 ml-3 uppercase">EUR</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-3 block">Kritični Rok (Deadline)</label>
                    <input aria-label="Unos polja" type="date" className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-6 py-5 text-lg font-mono text-white/80 outline-none focus:border-secondary focus:bg-white/[0.02] transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col justify-center max-w-2xl mx-auto">
              <h4 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 border-l-4 border-secondary pl-4">
                <span className="text-secondary text-xs align-top">02 //</span> UPRAVLJANJE LJUDSKIM RESURSIMA
              </h4>
              <div className="space-y-8">
                <div>
                  <label className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-3 block">Dodela Glavnog Inženjera (Šef Gradilišta)</label>
                  <div className="relative">
                      <select className="w-full bg-[#070B0F] border border-white/10 rounded-[10px] px-6 py-5 text-base font-medium text-white/80 outline-none focus:border-secondary focus:bg-white/[0.02] transition-all appearance-none cursor-pointer pr-16 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:24px] bg-no-repeat bg-[right_20px_center]">
                        <option>Pera Perić (Senior Inženjer)</option>
                        <option>Marko Marković (Nadzornik)</option>
                        <option>Jovan Jovanović (Šef operative)</option>
                      </select>
                  </div>
                </div>
                
                <div className="bg-[#131920]/50 border-2 border-dashed border-white/10 rounded-[10px] p-10 flex flex-col items-center justify-center text-center hover:bg-[#131920] hover:border-white/20 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-[#0A0F14] rounded-full flex items-center justify-center border border-white/5 mb-4 group-hover:scale-110 group-hover:border-secondary/30 transition-transform shadow-xl">
                      <span className="material-symbols-outlined text-white/30 text-[28px] group-hover:text-secondary transition-colors">groups</span>
                  </div>
                  <span className="text-sm font-black text-white mb-2 uppercase tracking-widest">Inicijalni tim radnika</span>
                  <p className="text-xs font-medium text-white/40 max-w-[350px] mb-6 leading-relaxed">Trenutno niste dodelili radnike sa drugih gradilišta na ovaj projekat. Možete ih dodati sada ili kasnije putem Digitalnog Dnevnika.</p>
                  <button className="text-xs font-black text-slate-900 bg-secondary hover:bg-yellow-400 px-6 py-3 rounded-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,204,0,0.2)]">
                      OTVORI BAZU RADNIKA
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-green-500/20 blur-[50px] rounded-full animate-pulse"></div>
                    <div className="w-32 h-32 rounded-full bg-[#0A0F14] border-4 border-green-500/30 flex items-center justify-center relative z-10 shadow-2xl">
                      <span className="material-symbols-outlined text-green-500 text-[64px] animate-[ping_2s_ease-out_infinite_reverse]">check_circle</span>
                    </div>
                </div>
                <h4 className="text-3xl font-headline font-black text-white uppercase tracking-tighter mb-4">SISTEM JE SPREMAN</h4>
                <p className="text-sm font-medium text-white/50 leading-relaxed max-w-md">
                  Konfiguracija projekta je validna. Digitalni dnevnik, automatsko prepoznavanje troškova i Live Teren arhitektura će biti aktivirani odmah nakon finalnog lansiranja.
                </p>
            </motion.div>
          )}
        </div>

        {/* FOOTER WIZARDA */}
        <div className="p-8 md:p-10 py-6 border-t border-white/5 flex justify-between items-center bg-[#070B0F]/90 backdrop-blur-md relative z-20 mt-auto">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="text-xs font-black text-white/40 hover:text-white uppercase tracking-[0.2em] transition-colors cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {step > 1 ? 'PRETHODNI KORAK' : 'PREKINI SETUP'}
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="bg-white hover:bg-gray-200 text-slate-900 font-black uppercase tracking-widest text-[12px] py-4 px-10 rounded-[10px] transition-all cursor-pointer shadow-xl flex items-center gap-2"
            >
                SLEDEĆI KORAK <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button 
              onClick={onConfirm}
              className="bg-secondary hover:bg-yellow-400 text-slate-900 font-black uppercase tracking-[0.2em] text-[13px] py-4 px-12 rounded-[10px] transition-all shadow-[0_0_30px_rgba(255,204,0,0.3)] hover:shadow-[0_0_50px_rgba(255,204,0,0.5)] cursor-pointer flex items-center gap-3 group"
            >
                <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-1 transition-transform">rocket_launch</span>
                LANSIRAJ PROJEKAT
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});
