import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { safeSessionStorage } from '@/src/lib/safeStorage';

export function SignupBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

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
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          className="fixed bottom-0 left-0 right-0 z-[5000] p-4 sm:p-6 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto bg-surface-container-low border border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] rounded-2xl md:rounded-full p-4 sm:p-2 sm:pr-4 flex flex-col md:flex-row items-center gap-4 md:gap-6 pointer-events-auto relative overflow-hidden">
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>

            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full">
              <div className="w-12 h-12 shrink-0 bg-primary/20 rounded-full flex items-center justify-center border border-primary/40 text-primary hidden sm:flex">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
              </div>
              
              <div className="text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-bold uppercase tracking-widest mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Start Budžet
                </div>
                <h3 className="text-sm sm:text-base text-white font-medium m-0 leading-snug">
                  Registruj se sada i preuzmi <strong className="text-primary font-black">1.500 SG Kredita</strong> za prve oglase!
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 relative z-10 w-full md:w-auto">
              <Link 
                to="/registracija"
                onClick={() => setIsVisible(false)}
                className="flex-1 md:flex-none py-2.5 px-6 bg-primary hover:bg-primary/90 text-on-primary rounded-xl md:rounded-full text-xs font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
              >
                Preuzmi Kredite
              </Link>
              <button 
                onClick={handleClose}
                className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-1.5 md:py-2.5 md:px-4 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-outline-variant/10 rounded-full transition-colors flex items-center justify-center shadow-lg"
                aria-label="Zatvori"
              >
                <span className="material-symbols-outlined text-sm md:text-lg">close</span>
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

