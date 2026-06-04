import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useEscToClose } from '@/src/hooks/useEscToClose';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditModal({ isOpen, onClose }: CreditModalProps) {
  useEscToClose(isOpen, onClose);
  const { user, updateUser } = useAuth();
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ads: number, price: number} | null>(null);

  const packages = [
    { ads: 5, price: 199, discount: '20% POPUSTA' },
    { ads: 10, price: 349, discount: '30% POPUSTA', popular: true },
    { ads: 20, price: 599, discount: '40% POPUSTA' },
  ];

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setIsLoading(true);
    // Simulate payment
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (user) {
      // In a real app, we would update credits in DB
      console.log(`Purchased ${selectedPackage.ads} credits`);
    }
    
    setIsLoading(false);
    setStep('success');
  };

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
            {step === 'select' && (
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">DOPUNI <span className="text-secondary">KREDITE</span></h2>
                    <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">IZABERITE AGENCIJSKI PAKET OGLASA</p>
                  </div>
                  <div className="w-14 h-14 bg-secondary/10 rounded-[10px] flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary text-3xl">token</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                  {packages.map((pkg, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-6 rounded-[10px] border-2 transition-all text-left relative group ${
                        selectedPackage?.ads === pkg.ads 
                          ? 'border-secondary bg-secondary/5' 
                          : 'border-white/5 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-slate-950 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">NAJPOPULARNIJE</span>
                      )}
                      <div className="text-3xl font-black text-white mb-1">{pkg.ads}</div>
                      <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">OGLASA</div>
                      <div className="text-xl font-black text-secondary mb-1">{pkg.price}€</div>
                      <div className="text-[8px] font-black text-green-500 uppercase tracking-widest">{pkg.discount}</div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    disabled={!selectedPackage}
                    onClick={() => setStep('payment')}
                    className="w-full py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    NASTAVI NA PLAĆANJE
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all"
                  >
                    ODUSTANI
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="p-10">
                <button onClick={() => setStep('select')} className="flex items-center gap-2 text-white/20 hover:text-white mb-8 transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">NAZAD NA IZBOR</span>
                </button>

                <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 text-center">PLAĆANJE PAKETA: <span className="text-secondary">{selectedPackage?.ads} OGLASA</span></h2>
                
                <div className="space-y-4 mb-10">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">BROJ KARTICE</label>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-[10px] flex items-center gap-4">
                      <span className="material-symbols-outlined text-white/20">credit_card</span>
                      <input aria-label="Unos polja" type="text" placeholder="**** **** **** ****" className="bg-transparent border-none outline-none text-white font-black tracking-widest w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">DATUM</label>
                      <input aria-label="Unos polja" type="text" placeholder="MM/YY" className="w-full bg-white/5 border border-white/10 p-4 rounded-[10px] text-white font-black tracking-widest outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-4">CVC</label>
                      <input aria-label="Unos polja" type="text" placeholder="***" className="w-full bg-white/5 border border-white/10 p-4 rounded-[10px] text-white font-black tracking-widest outline-none" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="w-full py-5 bg-secondary text-slate-950 font-black rounded-[10px] text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      OBRADA...
                    </>
                  ) : (
                    `POTVRDI UPLATU ${selectedPackage?.price}€`
                  )}
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="p-12 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-green-500/20"
                >
                  <span className="material-symbols-outlined text-white text-5xl">check</span>
                </motion.div>
                
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">USPEŠNA <span className="text-secondary">DOPUNA</span></h2>
                <p className="text-white/40 font-bold text-sm uppercase tracking-widest mb-10 leading-relaxed">
                  VAŠI KREDITI SU DODATI NA NALOG. SADA MOŽETE POSTAVITI NOVE OGLASE.
                </p>

                <button 
                  onClick={onClose}
                  className="w-full py-5 bg-white text-slate-950 font-black rounded-[10px] text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
                >
                  NAZAD NA KOMANDNU TABLU
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
