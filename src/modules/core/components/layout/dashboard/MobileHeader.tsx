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

  return (
    <div className="md:hidden flex items-center justify-between px-4 bg-[#0A0F14] border-b border-white/5 sticky top-0 z-40">
        <Link to="/" className="flex items-center">
          <div className="w-[110px] h-[110px] bg-transparent flex items-center justify-center overflow-hidden shrink-0">
            <img 
              src={logoUrl || logoImage} 
              alt="Svet Građevine Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
        </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/moj-profil/obavestenja"
          className="p-0 w-[48px] h-[48px] flex items-center justify-center text-white/60 hover:text-white"
          aria-label="Obaveštenja"
        >
          <span className="material-symbols-outlined">notifications</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-0 w-[48px] h-[48px] flex items-center justify-center text-white/60 hover:text-white"
          aria-label="Otvori meni"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </div>
  );
};
