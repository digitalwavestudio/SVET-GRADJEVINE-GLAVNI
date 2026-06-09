import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Hide on auth pages
  const isAuthPage = location.pathname === '/prijava' || location.pathname === '/registracija';
  if (isAuthPage) return null;

  const profilePath = user ? '/moj-profil' : '/prijava';
  const messagesPath = user ? '/poruke' : '/prijava';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 pb-safe-bottom">
      <div className="flex justify-around items-center h-16 px-2 relative">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive ? 'text-secondary' : 'text-white/40 hover:text-white/70'}`
          }
        >
          <span className="material-symbols-outlined text-2xl">home</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Početna</span>
        </NavLink>

        <NavLink 
          to="/poslovi" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive ? 'text-secondary' : 'text-white/40 hover:text-white/70'}`
          }
        >
          <span className="material-symbols-outlined text-2xl">search</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Pretraga</span>
        </NavLink>

        {/* Highlighted Post Ad Action */}
        <div className="relative -top-4">
            <NavLink 
              to="/postavi-oglas" 
              className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] text-slate-950 rounded-full shadow-[0_0_20px_rgba(254,191,13,0.4)] border-4 border-slate-950 transition-transform active:scale-95 animate-pulse-gold"
            >
            <span className="material-symbols-outlined text-3xl font-black">add</span>
          </NavLink>
        </div>

        <NavLink 
          to={messagesPath} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive ? 'text-secondary' : 'text-white/40 hover:text-white/70'}`
          }
        >
          <span className="material-symbols-outlined text-2xl">chat_bubble</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Poruke</span>
        </NavLink>

        <NavLink 
          to={profilePath} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive ? 'text-secondary' : 'text-white/40 hover:text-white/70'}`
          }
        >
          <span className="material-symbols-outlined text-2xl">person</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Profil</span>
        </NavLink>
      </div>
    </div>
  );
};
