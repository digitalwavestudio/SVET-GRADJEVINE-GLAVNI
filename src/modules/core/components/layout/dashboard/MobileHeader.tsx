import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useDashboardUIStore } from '@/src/modules/dashboard/store/dashboardUIStore';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';

export const MobileHeader: React.FC = () => {
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();
  const setIsMobileMenuOpen = useDashboardUIStore(state => state.setIsMobileMenuOpen);
  
  if (!user) return null;

  const isEmployer = user.role === 'poslodavac';

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-[#0A0F14] border-b border-white/5 sticky top-0 z-40">
       <Link to="/" className="flex items-center gap-3">
         <div className="w-10 h-10 bg-transparent flex items-center justify-center overflow-hidden shrink-0 p-0.5">
           <img 
             src={logoUrl || logoImage} 
             alt="Svet Građevine Logo" 
             className="w-full h-full object-contain" 
           />
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
