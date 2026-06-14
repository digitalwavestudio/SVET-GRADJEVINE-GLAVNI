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
  isUpdatingLaunchMode
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data } = useAdminStats();
  const pendingAds = data?.pendingAds || 0;

  const navItems: { id: string; label: string; icon: string; badge?: number }[] = [
    { id: 'overview', label: 'PREGLED SISTEMA', icon: 'dashboard' },
    { id: 'users', label: 'BAZA KORISNIKA', icon: 'groups' },
    { id: 'verify', label: 'VERIFIKACIJE', icon: 'verified' },
    { id: 'finances', label: 'FINANSIJE', icon: 'payments' },
    { id: 'marketing', label: 'MARKETING I PROMO', icon: 'campaign' },
    { id: 'broadcast', label: 'BROADCAST SISTEM', icon: 'podcasts' },
    { id: 'sync', label: 'ALGOLIA & SYNC', icon: 'sync_alt' },
    { id: 'support', label: 'SUPPORT & TIKETI', icon: 'support_agent' },
    { id: 'abuse', label: 'ZLOUPOTREBE', icon: 'gavel' },
    { id: 'audit', label: 'AUDIT LOGOVI', icon: 'history' },
    { id: 'observability', label: 'MONITORING & DLQ', icon: 'monitor_heart' },
    { id: 'settings', label: 'GLOBALNA PODEŠAVANJA', icon: 'settings' },
    { id: 'branding', label: 'PODEŠAVANJA BRENDA', icon: 'palette' },
    { id: 'housekeeping', label: 'ODRŽAVANJE SISTEMA', icon: 'cleaning_services' },
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVars}
      className="fixed left-0 top-0 bottom-0 w-80 bg-[#0A0F14] border-r border-white/5 z-50 flex flex-col p-8"
    >
      <div className="flex items-center gap-4 mb-16">
        <div className="w-12 h-12 bg-secondary rounded-[10px] flex items-center justify-center shadow-[0_0_30px_rgba(254,191,13,0.3)]">
          <span className="material-symbols-outlined text-slate-950 text-3xl font-bold">terminal</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">ADMIN <span className="text-secondary">HUB</span></h1>
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Svet Građevine v1.0</p>
        </div>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-2">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            variants={itemVars}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-[10px] transition-all group ${
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
        
        <Link 
          to="/" 
          className="w-full flex items-center gap-4 px-6 py-4 rounded-[10px] transition-all group text-secondary hover:bg-secondary/10"
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[11px] font-black uppercase tracking-widest">VRATI SE NA POČETNU</span>
        </Link>
      </nav>

      <div className="mt-auto border-t border-white/5 pt-8 space-y-4">
        <div className="bg-white/[0.03] border border-white/5 rounded-[10px] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">LAUNCH MODE</span>
            <div className={`w-2 h-2 rounded-full ${launchMode ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase ${launchMode ? 'text-green-500' : 'text-red-500'}`}>
              {launchMode ? 'AKTIVAN (FREE)' : 'LIMITIRAN'}
            </span>
            <button 
              onClick={toggleLaunchMode}
              disabled={isUpdatingLaunchMode}
              className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline disabled:opacity-50"
            >
              {isUpdatingLaunchMode ? '...' : 'IZMENI'}
            </button>
          </div>
        </div>

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
  );
}
