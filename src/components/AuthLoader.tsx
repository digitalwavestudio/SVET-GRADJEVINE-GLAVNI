import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import logoImage from "@/src/assets/images/logo.png";

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  
  return (
    <>
      <AnimatePresence>
        {loading && !user && (
          <motion.div
  aria-label="Loading"
  role="status"
  aria-live="assertive"
  initial={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
  className="fixed inset-0 z-[9999] bg-[#070B0F] flex flex-col items-center justify-center gap-6"
>
            <motion.img 
              src={logoImage} 
              alt="Svet Građevine" 
              className="w-32 sm:w-48 h-auto object-contain"
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "easeInOut" 
              }}
            />
            {/* Elegantni loading bar u centru */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="absolute inset-0 bg-secondary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

