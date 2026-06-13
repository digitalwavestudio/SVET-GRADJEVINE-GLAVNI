import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAdminStats } from '@/src/modules/admin/hooks/useAdminStats';
import Avatar from '@/src/components/ui/Avatar';
import { useAuth } from '@/src/context/AuthContext';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  launchMode: boolean;
  toggleLaunchMode: () => void;
  isUpdatingLaunchMode: boolean;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (val: boolean) => void;
}

const containerVars: any = {
  hidden: { opacity: 0, x: -50 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      staggerChildren: 0.05,
      duration: 0.6,
      ease: [0.23, 1, 0.32, 1]
    }
  }
};

const itemVars: any = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }
};

export function AdminSidebar({
  activeTab,
  setActiveTab,
  launchMode,
  toggleLaunchMode,
  isUpdatingLaunchMode,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data } = useAdminStats();
  const pendingAds = data?.pendingAds || 0;

  const navItems = [
    { id: 'overview', label: 'PREGLED SISTEMA', icon: 'dashboard' },
    { id: 'moderation', label: 'MODERACIJA OGLASA', icon: 'rule', badge: pendingAds },
    { id: 'users', label: 'BAZA KORISNIKA', icon: 'groups' },
    { id: 'verify', label: 'VERIFIKACIJE', icon: 'verified' },
    { id: 'finances', label: 'FINANSIJE', icon: 'payments' },
    { id: 'settings', label: 'GLOBALNA PODEŠAVANJA', icon: 'settings' },
    { id: 'branding', label: 'PODEŠAVANJA BRENDA', icon: 'palette' },
    { id: 'abuse', label: 'ZLOUPOTREBE', icon: 'gavel' },
    { id: 'marketing', label: 'MARKETING I PROMO', icon: 'campaign' },
    { id: 'broadcast', label: 'BROADCAST SISTEM', icon: 'podcasts' },
    { id: 'sync', label: 'ALGOLIA & SYNC', icon: 'sync_alt' },
    { id: 'support', label: 'SUPPORT & TIKETI', icon: 'support_agent' },
    { id: 'audit', label: 'AUDIT LOGOVI', icon: 'history' },
    { id: 'observability', label: 'MONITORING & DLQ', icon: 'monitor_heart' },
    { id: 'resilience', label: 'REZILIJENCIJA', icon: 'health_and_safety' },
    { id: 'magazine', label: 'MAGAZIN CMS', icon: 'newspaper' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/80 z-40 backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}
      
      <motion.div 
        initial="hidden"
        animate="show"
        variants={containerVars}
        className={`fixed left-0 top-0 bottom-0 w-80 bg-[#0A0F14] border-r border-white/5 z-50 flex flex-col p-8 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
      <div className="flex items-center justify-between mb-8 md:mb-16">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-secondary rounded-[10px] flex items-center justify-center shadow-[0_0_30px_rgba(254,191,13,0.3)]">
            <span className="material-symbols-outlined text-slate-950 text-3xl font-bold">terminal</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">ADMIN <span className="text-secondary">HUB</span></h1>
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Svet Građevine v1.0</p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileMenuOpen?.(false)}
          className="md:hidden p-2 text-white/40 hover:text-white"
          aria-label="Zatvori meni"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            variants={itemVars}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 md:px-6 md:py-4 rounded-[10px] transition-all group ${
              activeTab === item.id 
                ? 'bg-secondary text-slate-950 shadow-xl shadow-secondary/10' 
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            {item.badge ? (
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[9px] font-black ${
                activeTab === item.id ? 'bg-slate-950 text-secondary' : 'bg-red-500 text-white animate-pulse'
              }`}>
                {item.badge}
              </span>
            ) : null}
          </motion.button>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/5 pt-8 space-y-4">
        <Link 
          to="/" 
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/5 border border-white/10 rounded-[10px] text-xs font-black uppercase tracking-widest text-secondary hover:bg-secondary hover:text-slate-950 transition-all shadow-md active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">home</span>
          <span>VRATI SE NA POČETNU</span>
        </Link>

        <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-[10px] border border-white/5">
          <Avatar name={user?.name || 'A'} className="w-10 h-10 rounded-full" />

          <div className="flex-1 overflow-hidden">
             <div className="text-[10px] font-black text-white uppercase truncate">{user?.name}</div>
             <div className="text-[8px] font-bold text-green-500 uppercase tracking-widest">SISTEM ADMIN</div>
          </div>
          <button onClick={() => navigate('/')} className="material-symbols-outlined text-white/20 hover:text-white transition-colors">logout</button>
        </div>
      </div>
    </motion.div>
    </>
  );
}
