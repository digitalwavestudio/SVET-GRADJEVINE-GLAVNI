import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import logoImage from '@/src/assets/images/logo.png';

interface AdminHeaderProps {
  activeTab: string;
}

export function AdminHeader({ activeTab }: AdminHeaderProps) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('sr-RS'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('sr-RS'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tabTitles: Record<string, string> = {
    overview: 'KOMANDNI CENTAR',
    moderation: 'MODERACIJA',
    users: 'BAZA KORISNIKA',
    verify: 'VERIFIKACIJE',
    finances: 'FINANSIJSKI TOKOVI',
    marketing: 'MARKETING I PROMO KODOVI',
    broadcast: 'MASOVNE NOTIFIKACIJE',
    support: 'SUPPORT CENTAR',
    abuse: 'PRIJAVE I ZLOUPOTREBE',
    branding: 'BRENDING SISTEM'
  };

  return (
    <header className="relative min-h-[150px] md:h-[220px] flex items-center mb-6 md:mb-12 overflow-hidden rounded-[10px] bg-surface-container-low border border-white/5 p-6 md:p-12">
      {/* Background decoration for admin signature */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 flex-1"
      >
        <div className="flex items-center gap-2 md:gap-3 text-secondary text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.4em] uppercase mb-4 md:mb-6">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_rgba(254,191,13,0.5)]"></span>
          SISTEM MODERACIJA OPERATIVAN
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <img src={logoImage} alt="Svet Građevine Logo" className="h-8 md:h-12 w-auto object-contain brightness-110 self-start md:self-auto" />
          <h2 className="text-3xl md:text-6xl font-black tracking-[-0.05em] uppercase leading-none text-white italic">
            {tabTitles[activeTab] || 'ADMIN PANEL'}
          </h2>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
        className="relative z-10 hidden xl:flex gap-4 items-center"
      >
         <div className="bg-[#13212e]/60 backdrop-blur-3xl border border-white/5 px-10 py-6 rounded-[10px] shadow-2xl">
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">UTC/SRB TIME</div>
            <div className="text-xl font-headline font-black text-secondary flex items-center gap-3 italic">
               {time}
               <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            </div>
         </div>
      </motion.div>
    </header>
  );
}
