import React from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export function AuthLoader({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  
  return (
    <>
      <AnimatePresence>
        {loading && !user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-blue-600 overflow-hidden"
          >
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-full h-full bg-white/50"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
