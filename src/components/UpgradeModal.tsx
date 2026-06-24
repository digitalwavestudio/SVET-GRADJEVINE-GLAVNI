import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { getPackageById } from '@/src/constants/adPackages';
import { PaymentInstructions } from '@/src/modules/ads';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [createdAdId, setCreatedAdId] = useState<string | null>(null);

  const premiumPartnerPkg = getPackageById('company', 'premium_partner');

  const handleUpgradeRequest = async () => {
    setIsLoading(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const token = await getAuth().currentUser?.getIdToken();
      
      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          category: 'companies', 
          data: { 
            type: 'premium_partner_upgrade',
            paket: 'premium_partner',
            priceNum: premiumPartnerPkg.priceNum,
            status: 'pending_payment'
          } 
        })
      });

      if (!res.ok) throw new Error("Greška pri kreiranju zahteva");
      
      const result = await res.json();
      setCreatedAdId(result.id);
      setStep('payment');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
            className={`w-full ${step === 'payment' ? 'max-w-4xl' : 'max-w-xl'} bg-[#0A0F14] border border-white/10 rounded-[10px] shadow-[0_0_80px_rgba(254,191,13,0.15)] overflow-hidden relative z-10 transition-all duration-500`}
          >
            {step === 'info' && (
              <div className="p-10">
                <div className="w-20 h-20 bg-secondary/10 rounded-[10px] flex items-center justify-center mb-8 mx-auto">
                  <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
                
                <h2 className="text-3xl font-black text-center uppercase tracking-tighter mb-4">POSTANI <span className="text-secondary">PREMIUM</span> PARTNER</h2>
                <p className="text-white/40 text-center font-bold text-sm uppercase tracking-widest mb-10 leading-relaxed">
                  DODAJTE BEDŽ POVERENJA VAŠOJ FIRMI I BUDITE PRVI IZBOR POSLODAVACA I RADNIKA.
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    'EKSKLUZIVNI BEDŽ PREMIUM PARTNERA',
                    'MAKSIMALNA VIDLJIVOST U REGISTRU FIRMI',
                    'BOLJI REJTING PRI PRIJAVI NA TENDERE',
                    'ISTAKNUT DIZAJN PROFILA I OGLASA',
                    'DOŽIVOTNI STATUS (BEZ MESEČNE PRETPLATE)'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-[10px]">
                      <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined !text-black text-xs font-black">check</span>
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleUpgradeRequest}
                    disabled={isLoading}
                    className="w-full py-5 bg-secondary !text-black font-black rounded-[10px] text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                  >
                    {isLoading ? 'OBRADA...' : `UNAPREDI NALOG ZA ${premiumPartnerPkg.price}`}
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-4 text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-all"
                  >
                    MOŽDA KASNIJE
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black uppercase tracking-tighter text-white">INSTRUKCIJE ZA PLAĆANJE</h2>
                   <button onClick={() => setStep('info')} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white">Povratak</button>
                </div>

                <PaymentInstructions 
                  amount={premiumPartnerPkg.priceNum}
                  referenceNumber={createdAdId ? `SG-${createdAdId.slice(0, 8).toUpperCase()}` : 'SG-PARTNER'}
                  targetName={user?.businessProfile?.companyName || user?.company || (user?.firstName + ' ' + (user?.lastName || ''))}
                />

                <div className="mt-10 flex flex-col items-center">
                   <button 
                     onClick={onClose}
                     className="w-full py-5 bg-white !text-black font-black rounded-[10px] text-xs uppercase tracking-[0.2em] shadow-xl"
                   >
                     RAZUMEM, ZATVORI I IDI NA PROFIL
                   </button>
                   <p className="text-[9px] text-white/30 uppercase mt-4 font-bold tracking-widest">Vaš zahtev je evidentiran pod brojem: {createdAdId || 'SG-PENDING'}</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

