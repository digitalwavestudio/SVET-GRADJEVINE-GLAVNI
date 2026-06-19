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

  useEffect(() => {
    if (isSearchOpen) {
      // Dodaj dummy history state da bi Back dugme moglo da ga "potrosi"
      window.history.pushState({ searchOpen: true }, '');
      
      const handlePopState = () => {
        setIsSearchOpen(false);
      };
      
      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        // Ako korisnik klikne na logo (link ka /) ili bilo koji link, zatvori modal
        if (link) {
          setIsSearchOpen(false);
        }
      };

      window.addEventListener('popstate', handlePopState);
      document.addEventListener('click', handleGlobalClick);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname, location.search]);

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
          className="md:hidden fixed inset-0 z-[60] bg-[#050F19] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-y-auto"
          onClick={() => setIsSearchOpen(false)}
        >
          {/* Top Gradient Overlay */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none"></div>

          {/* Header */}
          <div className="relative flex justify-end p-4 z-10">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white bg-white/5 rounded-full backdrop-blur-md border border-white/10 shadow-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="relative z-10 px-6 pt-10 pb-20 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {/* AI Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] rounded-[20px] flex items-center justify-center mb-12 shadow-[0_0_40px_rgba(254,191,13,0.3)] animate-pulse-gold border border-white/20 relative">
               <div className="absolute inset-0 rounded-[20px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
               <span className="material-symbols-outlined text-slate-950 text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
            </div>
            
            {/* Title & Description */}
            <h2 className="font-headline text-4xl font-black text-white text-center mb-3 mt-6 uppercase tracking-tighter drop-shadow-md">PAMETNA PRETRAGA</h2>
            <p className="text-white/50 text-center text-sm md:text-base mb-10 max-w-sm">Opišite šta vam treba. Naš AI će pronaći najbolje rezultate u celom sistemu.</p>
            
            {/* Search Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSubmit(); }} className="w-full max-w-md relative flex flex-col items-center">
              <div className="w-full relative bg-[#0A1624] rounded-[16px] border-2 border-secondary/40 focus-within:border-secondary shadow-[0_0_20px_rgba(254,191,13,0.1)] focus-within:shadow-[0_0_40px_rgba(254,191,13,0.3)] transition-all duration-300 p-2 flex items-center group overflow-hidden">
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                
                <span className="material-symbols-outlined text-secondary ml-4 text-2xl animate-pulse">search</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Traži posao, mašine, firme..."
                  className="flex-1 bg-transparent text-lg text-white outline-none placeholder:text-white/30 font-medium px-4 py-4 relative z-10"
                />
              </div>
              
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="w-full mt-6 py-4 bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] text-[#0d151c] rounded-[14px] font-headline font-black text-lg uppercase tracking-widest shadow-[0_10px_20px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#ffad3a] hover:to-[#ffa424] transition-all active:scale-[0.98] border border-white/20"
              >
                PRETRAŽI
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>arrow_forward</span>
              </button>
            </form>
            
            {/* AI Search Suggestions */}
            <div className="mt-12 w-full max-w-md">
              <div className="text-[10px] font-black text-white/30 tracking-[0.2em] uppercase mb-4 text-center">POPULARNE PRETRAGE</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Moler u Beogradu', 'Polovan bager', 'Ketering za 50 radnika', 'Iznajmljivanje skele'].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 50);
                    }}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white hover:border-secondary/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
