import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface AdOverlaysProps {
  showDepositPrompt: boolean;
  setShowDepositPrompt: (show: boolean) => void;
  isUploadingImages: boolean;
}

export const AdOverlays: React.FC<AdOverlaysProps> = ({
  showDepositPrompt,
  setShowDepositPrompt,
  isUploadingImages
}) => {
  return (
    <>
      {/* Deposit Prompt Overlay */}
      {showDepositPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0F14] border border-orange-500/50 p-8 rounded-[10px] max-w-md w-full shadow-[0_0_50px_rgba(249,115,22,0.15)] relative overflow-hidden text-center"
          >
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.5)]">
              <span className="material-symbols-outlined text-3xl text-orange-500">
                account_balance_wallet
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase mb-4 tracking-tight">
              Nedovoljno Kredita
            </h3>
            <p className="text-white/60 mb-8 font-medium text-sm">
              Nemate dovoljno sredstava na Wallet-u za plaćanje izabranog paketa. Dopunite račun da biste objavili oglas (stanje se pamti, možete platiti odmah).
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/moj-profil?tab=wallet"
                target="_blank"
                className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-[10px] hover:bg-primary/90 shadow-[0_0_15px_rgba(247,190,44,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                Dopuni Wallet
              </Link>
              <button
                onClick={() => setShowDepositPrompt(false)}
                className="w-full py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-black uppercase tracking-widest text-xs rounded-[10px] transition-colors"
                type="button"
              >
                Nazad na Izmenu
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Uploading Status Indicator */}
      {isUploadingImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0F14] border border-secondary/20 p-8 rounded-[10px] max-w-sm w-full relative overflow-hidden text-center flex justify-center items-center flex-col shadow-[0_0_50px_rgba(247,190,44,0.1)] gap-4"
          >
             <div className="animate-spin w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full"></div>
             <div className="text-secondary font-black uppercase tracking-widest text-sm">Otpremanje u toku...</div>
             <p className="text-xs text-white/50">Molimo sačekajte da se sistem osigura da su vaše fotografije visoke rezolucije obrađene.</p>
          </motion.div>
        </div>
      )}
    </>
  );
};
