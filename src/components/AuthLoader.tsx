import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from "@/src/assets/images/logo.png";

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const [forceHide, setForceHide] = useState(false);

  useEffect(() => {
    if (loading && !user) {
      const timer = setTimeout(() => {
        console.warn('[AUTH_LOADER] Loading timed out (3500ms). Unblocking UI to prevent white/dark screen lock.');
        setForceHide(true);
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setForceHide(false);
    }
  }, [loading, user]);

  const showSpinner = loading && !user && !forceHide;
  
  return (
    <>
      <AnimatePresence>
        {showSpinner && (
          <motion.div
  aria-label="Loading"
  role="status"
  aria-live="assertive"
  initial={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="fixed inset-0 z-[9999] bg-[#070B0F] flex flex-col items-center justify-center gap-6"
>
            <img 
              src={logoImage} 
              alt="Svet Građevine" 
              className="w-32 sm:w-48 h-auto object-contain"
            />
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">UČITAVANJE...</p>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

