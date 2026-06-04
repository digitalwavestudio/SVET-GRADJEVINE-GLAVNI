import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardUIStore } from '@/src/modules/dashboard/store/dashboardUIStore';

export const MobileHeader: React.FC = () => {
  const { user } = useAuth();
  const setIsMobileMenuOpen = useDashboardUIStore(state => state.setIsMobileMenuOpen);
  
  if (!user) return null;

  const isEmployer = user.role === 'poslodavac';

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F14] border-b border-white/5 sticky top-0 z-40">
       <Link to="/" className="flex items-center gap-3">
         <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-black/20 p-1">
           {user.businessProfile?.logo || user.photoURL ? (
             <img width="800" height="600" decoding="async" src={user?.businessProfile?.logo || user?.photoURL} alt="Profile" className="w-full h-full object-contain" loading="lazy" />
           ) : (
             <span className="font-black text-slate-950 text-[10px]">SG</span>
           )}
         </div>
         <div className="leading-none flex flex-col">
            <span className="text-sm font-black tracking-tighter text-white uppercase">{isEmployer ? (user.company || 'SVET GRAĐEVINE') : 'SVET GRAĐEVINE'}</span>
            <span className="text-[8px] font-bold text-secondary tracking-[0.2em] uppercase">{isEmployer ? 'POSLODAVAC' : 'MREŽA GRADNJE'}</span>
         </div>
       </Link>
       <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-white/60 hover:text-white">
         <span className="material-symbols-outlined">menu</span>
       </button>
    </div>
  );
};
