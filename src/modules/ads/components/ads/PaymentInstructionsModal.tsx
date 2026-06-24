import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PaymentInstructions } from '@/src/modules/ads/components/ads/PaymentInstructions';
import { getPackageById } from '@/src/constants/adPackages';

interface PaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: any;
}

export function PaymentInstructionsModal({ isOpen, onClose, ad }: PaymentInstructionsModalProps) {
  if (!ad) return null;

  const pkg = ad.paket ? getPackageById(ad.category || 'job', ad.paket) : null;
  const amount = ad.priceNum || pkg?.priceNum || 6000;
  const title = ad.title || ad.name || (ad.type === 'premium_partner_upgrade' ? 'PRISTUP PREMIUM PARTNER STATUSU' : 'Oglas');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
            className="w-full max-w-4xl bg-[#0A0F14] border border-white/10 rounded-[10px] shadow-[0_0_80px_rgba(254,191,13,0.15)] overflow-hidden relative z-10 p-8 md:p-12 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black uppercase tracking-tighter text-white">INSTRUKCIJE ZA PLAĆANJE</h2>
               <button onClick={onClose} className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all">
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            <div className="mb-8">
               <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Oglas / Predmet</div>
               <div className="text-xl font-black text-white uppercase tracking-tight">{title}</div>
               {pkg && (
                 <div className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Paket: {pkg.name}</div>
               )}
            </div>

            <PaymentInstructions 
              amount={amount}
              referenceNumber={`SG-${ad.id.slice(0, 8).toUpperCase()}`}
            />

            <div className="mt-10 flex flex-col items-center">
               <button 
                 onClick={onClose}
                 className="w-full py-5 bg-white !text-black font-black rounded-[10px] text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform"
               >
                 RAZUMEM, ZATVORI
               </button>
               <p className="text-[9px] text-white/30 uppercase mt-4 font-bold tracking-widest leading-relaxed text-center">
                 VAŠ OGLAS ĆE BITI AKTIVIRAN ODMAH NAKON ŠTO NAŠ TIM EVIDENTIRA UPLATU.<br/>
                 PROSEČNO VREME OBRADE: 1-2 RADNA SATA OD MOMENTA VIDLJIVOSTI NA IZVODU.
               </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
