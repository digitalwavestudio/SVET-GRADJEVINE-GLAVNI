import React from 'react';
import { motion } from 'motion/react';

interface PartnerHubUIProps {
  user: any;
}

export default function PartnerHubUI({ user }: PartnerHubUIProps) {
  return (
    <motion.div 
      initial="hidden" animate="visible" 
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } }}}
      className="space-y-8"
    >
      {/* Partner Banner */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] rounded-[10px] p-10 relative overflow-hidden shadow-[0_0_50px_rgba(254,191,13,0.15)] flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
        <div className="relative z-10 w-full md:w-auto">
          <h3 className="text-slate-950 font-black text-4xl uppercase tracking-tighter mb-2">PARTNER HUB</h3>
          <p className="text-slate-900/80 font-bold text-xs tracking-widest uppercase">Klijenti dobijaju 30% popusta, a ti 20% od svake uplate!</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0A0F14] p-2 rounded-[10px] w-full md:w-auto relative z-10">
          <div className="px-4 py-2 text-white font-mono text-sm uppercase tracking-wider flex-1 md:w-64 truncate">
            {user?.partnerSlug ? `https://svetgradjevine.com/?ref=${user.partnerSlug}` : 'https://svetgradjevine.com/'}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`https://svetgradjevine.com/?ref=${user?.partnerSlug}`); }} className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-[10px] transition-all flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
          </button>
        </div>
      </motion.div>

      {/* Partner Stats */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 }}} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Uplata za tvoj kod', value: user?.partnerConversions || 0, icon: 'receipt_long' },
          { label: 'Zarada', value: `${user?.walletBalance || 0} SG Kredita`, icon: 'account_balance_wallet' },
          { label: 'Klikova na link', value: user?.partnerClicks || 0, icon: 'ads_click' },
          { label: 'Otvoreno NALOGA', value: user?.partnerLeads || 0, icon: 'person_add' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-6 relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-secondary transition-all">
                <span className="material-symbols-outlined text-white/50 group-hover:text-secondary transition-colors text-xl">{stat.icon}</span>
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-3xl font-black text-white tracking-tighter uppercase">{stat.value}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mt-1">{stat.label}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
