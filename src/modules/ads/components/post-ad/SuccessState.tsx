import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Confetti from 'react-confetti';
import { UI_TOKENS } from '@/src/lib/uiTokens';

interface SuccessStateProps {
  type: 'free' | 'paid';
  packageName?: string;
  onReset: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ type, packageName, onReset }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#0B1219] text-white flex flex-col pt-32 pb-20 px-6 overflow-hidden font-body items-center justify-center text-center">
      <Confetti
        recycle={false}
        numberOfPieces={500}
        colors={["#10B981", "#F59E0B", "#3B82F6", "#FFFFFF"]}
      />
      <div className="absolute inset-0 futuristic-grid opacity-20 pointer-events-none"></div>
      <div className="relative z-10 max-w-xl">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-green-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
          <span className="material-symbols-outlined text-4xl text-green-500">
            {type === 'free' ? 'check' : 'check_circle'}
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 font-headline leading-none">
          {type === 'free' ? (
            <>OGLAS <span className="text-green-500">USPEŠNO POSLAT</span></>
          ) : (
            <>OGLAS JE <span className="text-secondary">AKTIVAN</span></>
          )}
        </h1>

        <p className="text-on-surface-variant text-base mb-10 mx-auto font-medium">
          {type === 'free' ? (
            "Vaš oglas je uspešno sačuvan i trenutno se nalazi besplatno na pregledu kod administratora. Nakon odobrenja, biće vidljiv svim korisnicima na platformi."
          ) : (
            <>Uspešno ste platili paket <strong>{packageName}</strong> iz Vašeg Walleta. Sredstva su skinuta, a oglas je odmah aktiviran. Vaš oglas će se pojaviti za 5 minuta na sajtu.</>
          )}
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link to="/moj-profil" className={UI_TOKENS.BTN_PRIMARY}>
            Upravljaj oglasima
          </Link>
          <button
            onClick={onReset}
            className={UI_TOKENS.BTN_SECONDARY}
          >
            Postavi Novi Oglas
          </button>
        </div>
      </div>
    </div>
  );
};
