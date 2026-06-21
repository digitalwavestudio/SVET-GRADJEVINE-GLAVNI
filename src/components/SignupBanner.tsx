import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { safeSessionStorage } from '@/src/lib/safeStorage';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';

export default function SignupBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const { logoUrl } = useBrandLogo();

  useEffect(() => {
    const hasClosed = safeSessionStorage.getItem('signup_banner_closed_v4');
    const isAuthPage = location.pathname.includes('/registracija') || location.pathname.includes('/prijava');

    if (!user && !hasClosed && !isAuthPage) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    safeSessionStorage.setItem('signup_banner_closed_v4', 'true');
  };

  if (user) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
          className="fixed bottom-0 left-0 right-0 z-[5000] p-4 sm:p-6 sm:pb-8 pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-5xl bg-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5),_0_0_40px_rgba(254,191,13,0.15)] rounded-[24px] lg:rounded-full p-6 lg:p-4 lg:pr-6 flex flex-col lg:flex-row items-center justify-between gap-6 pointer-events-auto relative overflow-hidden ring-1 ring-white/5">
            
            {/* Ambient Glows */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#FEBF0D]/10 blur-[100px] pointer-events-none rounded-full"></div>
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#FEBF0D]/10 blur-[100px] pointer-events-none rounded-full"></div>

            <div className="flex-1 flex flex-col lg:flex-row items-center text-center lg:text-left gap-4 lg:gap-6 relative z-10 w-full pl-0 lg:pl-4 mt-2 lg:mt-0">
              {/* Logo Section */}
              <div className="flex shrink-0 items-center justify-center py-2 lg:py-0">
                 <img src={logoUrl || logoImage} alt="Svet Građevine" className="h-10 lg:h-12 w-auto object-contain drop-shadow-md" />
              </div>
              
              {/* Separator - only on large screens */}
              <div className="hidden lg:block w-px h-14 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
              
              {/* Text Section */}
              <div className="flex-1 max-w-xl mx-auto lg:mx-0">
                <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-3 py-1 bg-[#FEBF0D]/10 text-[#FEBF0D] rounded-[8px] text-[10px] font-black uppercase tracking-[0.2em] mb-3 lg:mb-2 border border-[#FEBF0D]/20 shadow-[inset_0_0_10px_rgba(254,191,13,0.1)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FEBF0D] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FEBF0D]"></span>
                  </span>
                  Start Budžet
                </div>
                <h3 className="text-sm sm:text-base md:text-lg text-slate-300 font-medium m-0 leading-snug">
                  Registruj se sada i preuzmi <strong className="text-white font-black drop-shadow-[0_0_10px_rgba(254,191,13,0.3)] whitespace-nowrap">1.500 SG Kredita</strong> za prve oglase!
                </h3>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex items-center justify-center shrink-0 relative z-10 w-full lg:w-auto mt-2 lg:mt-0">
              <Link 
                to="/registracija"
                onClick={() => setIsVisible(false)}
                className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] hover:from-white hover:to-white text-slate-950 rounded-[16px] lg:rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(254,191,13,0.3)] hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] text-center flex items-center justify-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-base">redeem</span>
                Preuzmi Kredite
              </Link>
            </div>

            {/* Close Button - absolute on small, flow on large */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 lg:relative lg:top-0 lg:right-0 p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/10 rounded-full transition-all flex items-center justify-center pointer-events-auto z-50 group hover:scale-110 active:scale-95"
              aria-label="Zatvori"
            >
              <span className="material-symbols-outlined text-sm group-hover:rotate-90 transition-transform duration-300">close</span>
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

