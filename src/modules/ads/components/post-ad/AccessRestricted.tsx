import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';

interface AccessRestrictedProps {
  userRole: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ userRole }) => {
  return (
    <div className="min-h-screen bg-[#0B1219] text-white flex flex-col pt-32 pb-20 px-6 relative overflow-hidden font-body items-center justify-center text-center">
      <div className="absolute inset-0 futuristic-grid opacity-20 pointer-events-none"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-2xl bg-white/5 border border-white/10 p-12 rounded-[10px] backdrop-blur-xl shadow-2xl"
      >
        <div className="w-20 h-20 bg-error/10 rounded-[10px] flex items-center justify-center mx-auto mb-8 border border-error/30">
          <span className="material-symbols-outlined text-4xl text-error">lock</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-6 font-headline leading-none">
          PRISTUP <span className="text-error">OGRANIČEN</span>
        </h1>
        <p className="text-on-surface-variant text-lg mb-10 font-medium">
          Vaša trenutna uloga (<span className="text-white">{userRole}</span>) ne dozvoljava direktno postavljanje oglasa. Ukoliko želite da postavljate oglase, molimo Vas da promenite ulogu na svom profilu.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link to="/moj-profil" className={UI_TOKENS.BTN_PRIMARY}>Idi na Profil</Link>
          <Link to="/kontakt" className={UI_TOKENS.BTN_SECONDARY}>Kontaktiraj Podršku</Link>
        </div>
      </motion.div>
    </div>
  );
};
