import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { BusinessNiche, useAuth } from '@/src/context/AuthContext';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const { user, updateUser, switchRole } = useAuth();
  const [step, setStep] = useState<'choice' | 'master' | 'firm'>('choice');
  const [niche, setNiche] = useState<BusinessNiche>('gradjevina');
  const [pib, setPib] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleMasterUpgrade = async () => {
    try {
      await switchRole('majstor');
      onClose();
    } catch (err) {
      console.error("Failed to upgrade to master:", err);
    }
  };

  const handleFirmUpgrade = async () => {
    setIsVerifying(true);
    try {
      await updateUser({ 
        company: companyName,
        businessProfile: {
          niche,
          pib,
          isVerified: true,
          isPremium: false
        }
      });
      await switchRole('poslodavac');
      setIsVerifying(false);
      onClose();
    } catch (err) {
      console.error("Failed to upgrade to firm:", err);
      setIsVerifying(false);
    }
  };

  const niches: { id: BusinessNiche; label: string; icon: string }[] = [
    { id: 'gradjevina', label: 'GRAĐEVINSKA FIRMA', icon: 'engineering' },
    { id: 'ketering', label: 'KETERING / HRANA', icon: 'restaurant' },
    { id: 'smestaj', label: 'SMEŠTAJ RADNIKA', icon: 'bed' },
    { id: 'placevi', label: 'PRODAJA PLACEVA', icon: 'landscape' },
    { id: 'masine', label: 'NAJAM MAŠINA', icon: 'construction' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl bg-[#0A0F14] border border-white/10 rounded-[10px] shadow-2xl overflow-hidden relative z-10"
          >
            <div className="p-10">
              {step === 'choice' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">IZABERITE VAŠU ULOGU</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">KAKO ŽELITE DA KORISTITE PLATFORMU?</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => setStep('master')}
                      className="p-8 bg-white/[0.02] border border-white/5 rounded-[10px] hover:border-secondary/50 hover:bg-white/[0.05] transition-all group text-left"
                    >
                      <div className="w-14 h-14 bg-secondary/10 rounded-[10px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-secondary text-3xl">engineering</span>
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">JA SAM MAJSTOR</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                        KREIRAJTE CV, POSTAVITE SERTIFIKATE I PRONAĐITE NAJBOLJE POSLOVE NA GRADILIŠTIMA.
                      </p>
                    </button>

                    <button 
                      onClick={() => setStep('firm')}
                      className="p-8 bg-white/[0.02] border border-white/5 rounded-[10px] hover:border-blue-500/50 hover:bg-white/[0.05] transition-all group text-left"
                    >
                      <div className="w-14 h-14 bg-blue-500/10 rounded-[10px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-blue-500 text-3xl">business</span>
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">JA SAM FIRMA</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                        PRONAĐITE RADNIKE, OGLASITE USLUGE, KETERING ILI SMEŠTAJ I UPRAVLJAJTE TIMOM.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {step === 'master' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">POSTANI MAJSTOR</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">VAŠ PROFIL ĆE POSTATI VIDLJIV POSLODAVCIMA</p>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-[10px] p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-relaxed">VAŠ CV ĆE BITI DOSTUPAN U BAZI MAJSTORA.</p>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="material-symbols-outlined text-secondary">check_circle</span>
                      <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-relaxed">MOŽETE SE PRIJAVLJIVATI NA SVE OGLASE JEDNIM KLIKOM.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep('choice')} className="flex-1 py-5 bg-white/5 text-white font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-white/10 transition-all">NAZAD</button>
                    <button onClick={handleMasterUpgrade} className="flex-[2] py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/20">POTVRDI I NASTAVI</button>
                  </div>
                </div>
              )}

              {step === 'firm' && (
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tighter uppercase mb-2">VERIFIKACIJA FIRME</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">UNESITE PODATKE ZA POSLOVNI NALOG</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">NAZIV FIRME</label>
                        <input 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="NPR. ENERGOPROJEKT DOO"
                          className="w-full bg-white/5 border border-white/10 rounded-[10px] px-6 py-4 text-white font-black uppercase text-xs outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">PIB FIRME</label>
                        <input 
                          value={pib}
                          onChange={(e) => setPib(e.target.value)}
                          placeholder="10-CIFRENI BROJ"
                          className="w-full bg-white/5 border border-white/10 rounded-[10px] px-6 py-4 text-white font-black uppercase text-xs outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">IZABERITE NIŠU (DELATNOST)</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {niches.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => setNiche(n.id)}
                            className={`p-4 rounded-[10px] border transition-all flex flex-col items-center gap-2 group ${
                              niche === n.id 
                                ? 'bg-blue-500/10 border-blue-500 text-blue-500' 
                                : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                            }`}
                          >
                            <span className="material-symbols-outlined text-xl">{n.icon}</span>
                            <span className="text-[8px] font-black uppercase tracking-tighter text-center">{n.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep('choice')} className="flex-1 py-5 bg-white/5 text-white font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-white/10 transition-all">NAZAD</button>
                    <button 
                      onClick={handleFirmUpgrade} 
                      disabled={isVerifying || !pib || !companyName}
                      className="flex-[2] py-5 bg-blue-500 text-white font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          VERIFIKACIJA U TOKU...
                        </>
                      ) : (
                        'VERIFIKUJ FIRMU'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
