import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
    {/* Ultra-Premium Full-Width Bottom Nav */}
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B101A]/90 backdrop-blur-2xl border-t border-white/5 pb-safe-bottom shadow-[0_-20px_40px_rgba(0,0,0,0.6)]">
      {/* High-end glossy top edge */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FEBF0D]/30 to-transparent"></div>
      
      <div className="flex justify-between items-center h-[76px] px-1 relative">
        
        {/* Početna */}
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${isActive ? 'text-[#FEBF0D]' : 'text-slate-400 hover:text-white'}`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active Top Line Indicator */}
              {isActive && (
                <div className="absolute top-0 w-1/2 h-[2px] bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] rounded-b-full shadow-[0_0_12px_rgba(254,191,13,0.8)]"></div>
              )}
              {/* Modern Icon Container */}
              <div className="flex items-center justify-center w-11 h-11 rounded-[16px] transition-all duration-300 bg-transparent group-hover:bg-white/5">
                <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(254,191,13,0.5)] text-[#FEBF0D]' : 'group-active:scale-90'}`} style={{ fontVariationSettings: isActive ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 300' }}>home</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 relative z-10 transition-colors duration-300">Početna</span>
            </>
          )}
        </NavLink>

        {/* Pretraga */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${isSearchOpen ? 'text-[#FEBF0D]' : 'text-slate-400 hover:text-white'}`}
        >
          {/* Active Top Line Indicator */}
          {isSearchOpen && (
            <div className="absolute top-0 w-1/2 h-[2px] bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] rounded-b-full shadow-[0_0_12px_rgba(254,191,13,0.8)]"></div>
          )}
          {/* Modern Icon Container */}
          <div className="flex items-center justify-center w-11 h-11 rounded-[16px] transition-all duration-300 bg-transparent group-hover:bg-white/5">
            <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isSearchOpen ? 'scale-110 drop-shadow-[0_0_8px_rgba(254,191,13,0.5)] text-[#FEBF0D]' : 'group-active:scale-90'}`} style={{ fontVariationSettings: isSearchOpen ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 300' }}>search</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 relative z-10 transition-colors duration-300">Pretraga</span>
        </button>

        {/* Highlighted Premium Post Ad Button */}
        <div className="relative -top-6 flex justify-center flex-[1.2] pointer-events-none">
          {/* Ambient Glow */}
          <div className="absolute top-4 w-[46px] h-[46px] bg-[#FEBF0D] rounded-full blur-[16px] opacity-40 animate-pulse-gold"></div>
          
          <NavLink 
            to="/postavi-oglas" 
            className="pointer-events-auto flex items-center justify-center w-[60px] h-[60px] bg-gradient-to-tr from-[#FEBF0D] via-[#F8A010] to-[#E58900] text-[#0A0F14] rounded-full shadow-[0_8px_20px_rgba(254,191,13,0.4),inset_0_2px_6px_rgba(255,255,255,0.5)] border-[5px] border-[#0B101A] ring-1 ring-white/10 transition-all duration-300 active:scale-90 hover:scale-105 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
            
            <span className="material-symbols-outlined text-[36px] font-black group-hover:rotate-90 transition-transform duration-500 relative z-10 drop-shadow-sm">add</span>
          </NavLink>
        </div>

        {/* Poruke */}
        <NavLink 
          to={messagesPath} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${isActive ? 'text-[#FEBF0D]' : 'text-slate-400 hover:text-white'}`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active Top Line Indicator */}
              {isActive && (
                <div className="absolute top-0 w-1/2 h-[2px] bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] rounded-b-full shadow-[0_0_12px_rgba(254,191,13,0.8)]"></div>
              )}
              {/* Modern Icon Container */}
              <div className="flex items-center justify-center w-11 h-11 rounded-[16px] transition-all duration-300 bg-transparent group-hover:bg-white/5">
                <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(254,191,13,0.5)] text-[#FEBF0D]' : 'group-active:scale-90'}`} style={{ fontVariationSettings: isActive ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 300' }}>chat_bubble</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 relative z-10 transition-colors duration-300">Poruke</span>
            </>
          )}
        </NavLink>

        {/* Nalog */}
        <NavLink 
          to={dashboardPath} 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${isActive ? 'text-[#FEBF0D]' : 'text-slate-400 hover:text-white'}`
          }
        >
          {({ isActive }) => (
            <>
              {/* Active Top Line Indicator */}
              {isActive && (
                <div className="absolute top-0 w-1/2 h-[2px] bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] rounded-b-full shadow-[0_0_12px_rgba(254,191,13,0.8)]"></div>
              )}
              {/* Modern Icon Container */}
              <div className="flex items-center justify-center w-11 h-11 rounded-[16px] transition-all duration-300 bg-transparent group-hover:bg-white/5">
                <span className={`material-symbols-outlined text-[24px] transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(254,191,13,0.5)] text-[#FEBF0D]' : 'group-active:scale-90'}`} style={{ fontVariationSettings: isActive ? '"FILL" 1, "wght" 600' : '"FILL" 0, "wght" 300' }}>person</span>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 relative z-10 transition-colors duration-300">Nalog</span>
            </>
          )}
        </NavLink>
      </div>
    </div>

    <div
      className={`md:hidden fixed inset-0 z-[60] bg-[#050F19] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-y-auto transition-transform duration-300 ${
        isSearchOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
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
               <span className="material-symbols-outlined !text-black text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
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
    </div>
    </>
  );
};
