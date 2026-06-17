import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on auth pages
  const isAuthPage = location.pathname === '/prijava' || location.pathname === '/registracija';
  if (isAuthPage) return null;

  const dashboardPath = user ? '/kontrolna-tabla' : '/prijava';
  const messagesPath = user ? '/poruke' : '/prijava';

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/pretraga?q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isSearchOpen]);

  return (
    <>
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

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-col items-center justify-center w-12 h-12 transition-colors text-white/40 hover:text-white/70"
        >
          <span className="material-symbols-outlined text-2xl">search</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Pretraga</span>
        </button>

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
          to={dashboardPath} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-12 h-12 transition-colors ${isActive ? 'text-secondary' : 'text-white/40 hover:text-white/70'}`
          }
        >
          <span className="material-symbols-outlined text-2xl">dashboard</span>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1">Dashboard</span>
        </NavLink>
      </div>
    </div>

    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="md:hidden fixed inset-0 z-[60] bg-[#070B0F]/95 backdrop-blur-xl"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="flex items-center gap-3 p-4 border-b border-white/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-white/40">search</span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pretraži Svet Građevine..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20 font-medium"
              />
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white/70"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-4" onClick={(e) => e.stopPropagation()}>
            {searchQuery.trim() ? (
              <button
                onClick={handleSearchSubmit}
                className="w-full py-4 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                PRETRAŽI "{searchQuery.trim()}"
              </button>
            ) : (
              <div className="space-y-1">
                <div className="text-[9px] font-black text-white/20 tracking-[0.2em] uppercase mb-4">BRZA NAVIGACIJA</div>
                {[
                  { label: 'Poslovi', icon: 'work', path: '/poslovi' },
                  { label: 'Majstori', icon: 'construction', path: '/majstori' },
                  { label: 'Firme', icon: 'business', path: '/firme' },
                  { label: 'Smeštaj', icon: 'hotel', path: '/smestaj' },
                  { label: 'Ketering', icon: 'restaurant', path: '/ketering' },
                  { label: 'Alat i oprema', icon: 'storefront', path: '/alat-i-oprema' },
                  { label: 'Građ. mašine', icon: 'precision_manufacturing', path: '/gradjevinske-masine' },
                  { label: 'Placevi', icon: 'terrain', path: '/placevi' },
                ].map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg text-white/30">{link.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider">{link.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
